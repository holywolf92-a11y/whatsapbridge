import qrcode from 'qrcode-terminal';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Logger } from 'pino';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import type { BridgeAccountConfig, ManagedSession, SessionStatus } from '../types';
import { MessageHandler } from '../handlers/messageHandler';
import { AccountControlService } from './accountControlService';
import { VolumeSessionStore } from './volumeSessionStore';

/**
 * SafeRemoteAuth wraps every backup-timer call in a try/catch so a missing
 * Chrome "Default" directory (ENOENT) cannot bubble up as an unhandled
 * rejection and crash the process — taking ALL sessions down with it.
 */
class SafeRemoteAuth extends RemoteAuth {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async storeRemoteSession(options?: any): Promise<void> {
    try {
      // storeRemoteSession is defined in the JS base class but not in the TS types;
      // access it via the prototype to satisfy the TypeScript compiler.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentFn = (RemoteAuth.prototype as any).storeRemoteSession as (opts?: any) => Promise<void>;
      await parentFn.call(this, options);
    } catch {
      // Non-fatal: backup silently skipped; will retry at next interval.
    }
  }
}

type SessionSnapshot = {
  accountId: string;
  displayName: string;
  owner: string | null;
  rolloutWave: string | null;
  status: SessionStatus;
  lastEventAt: string | null;
  lastError: string | null;
  hasQrCode: boolean;
  pairingCode: string | null;
  pairingCodeGeneratedAt: string | null;
};

const MAX_FAST_RECONNECT_ATTEMPTS = 10;  // first N attempts: short delay
const MAX_QR_ROTATIONS = 10;
const ACCOUNT_START_STAGGER_MS = 15000;
const RECONNECT_DELAY_MS = 15000;            // 15s for first 10 attempts
const RECONNECT_LONG_DELAY_MS = 10 * 60 * 1000; // 10 min after that — retry forever

export class SessionManager {
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly reconnectingAccounts = new Set<string>();
  private readonly reconnectAttempts = new Map<string, number>();
  private readonly qrRotationCounts = new Map<string, number>();
  private isShuttingDown = false;
  private readonly store: VolumeSessionStore;
  private watchdogTimer: NodeJS.Timeout | null = null;
  // Chrome profiles live in /tmp (ephemeral). Only the small auth zip backups
  // are kept on the Railway persistent volume.
  private readonly chromeTmpPath = path.join(os.tmpdir(), 'wwebjs-sessions');

  constructor(
    private readonly sessionDataPath: string,
    private readonly accounts: BridgeAccountConfig[],
    private readonly messageHandler: MessageHandler,
    private readonly accountControlService: AccountControlService,
    private readonly logger: Logger,
  ) {
    // Session backups live in a sub-folder of the Railway volume so they
    // survive container restarts without lock-file conflicts.
    this.store = new VolumeSessionStore(path.join(sessionDataPath, 'backups'));
  }

  async start(): Promise<void> {
    for (const account of this.accounts) {
      if (!account.enabled) {
        this.sessions.set(account.id, {
          account,
          client: {} as Client,
          status: 'paused',
          lastEventAt: new Date().toISOString(),
          lastError: null,
          qrCode: null,
          pairingCode: null,
          pairingCodeGeneratedAt: null,
        });
        continue;
      }

      // Seed session as idle first so snapshot() is valid immediately.
      this.sessions.set(account.id, {
        account,
        client: {} as Client,
        status: 'idle',
        lastEventAt: new Date().toISOString(),
        lastError: null,
        qrCode: null,
        pairingCode: null,
        pairingCodeGeneratedAt: null,
      });

      // Auto-connect only if we have a stored backup zip for this account.
      // Accounts never QR-scanned have no backup and stay idle until the user
      // manually clicks Connect and scans a QR code.
      const hasSavedSession = this.store.hasBackup(account.id);
      if (!hasSavedSession) continue;

      // Stagger starts so Chromium instances don't all compete for RAM at once.
      const enabledAccounts = this.accounts.filter(a => a.enabled);
      const index = enabledAccounts.indexOf(account);
      setTimeout(() => {
        void this.createClient(account);
      }, index * ACCOUNT_START_STAGGER_MS);
    }

    // Watchdog: every 2 minutes verify every enabled, non-idle session is
    // alive and re-connect anything that slipped to degraded/disconnected
    // without triggering the normal reconnect path (e.g. silent process hang).
    this.watchdogTimer = setInterval(() => {
      void this.runWatchdog();
    }, 2 * 60 * 1000);

    // One-time migration: delete old Chrome profile dirs that were previously
    // written directly to the Railway volume. They can be gigabytes in size.
    this.cleanupOldVolumeProfileDirs();

    // Volume housekeeping: purge Chrome cache subdirs every 6 hours so the
    // Railway volume doesn't fill up with stale browser cache data.
    this.purgeChromeCache();
    setInterval(() => { this.purgeChromeCache(); }, 6 * 60 * 60 * 1000);
  }

  /**
   * Delete old RemoteAuth-* Chrome profile directories that were previously
   * written directly to the Railway volume before the /tmp migration.
   */
  private cleanupOldVolumeProfileDirs(): void {
    for (const account of this.accounts) {
      const oldProfileDir = path.join(this.sessionDataPath, `RemoteAuth-${account.id}`);
      const oldZip = path.join(this.sessionDataPath, `RemoteAuth-${account.id}.zip`);
      try {
        if (fs.existsSync(oldProfileDir)) {
          fs.rmSync(oldProfileDir, { recursive: true, force: true });
          this.logger.info({ accountId: account.id }, 'Cleaned up old Chrome profile dir from Railway volume');
        }
      } catch { /* non-fatal */ }
      try {
        if (fs.existsSync(oldZip)) {
          fs.rmSync(oldZip, { force: true });
          this.logger.info({ accountId: account.id }, 'Cleaned up old session zip from Railway volume root');
        }
      } catch { /* non-fatal */ }
    }
  }

  /**
   * Delete Chrome cache subdirs from the /tmp Chrome profiles.
   * These are regenerated by Chrome on next launch.
   */
  private purgeChromeCache(): void {
    const CACHE_SUBDIRS = ['Cache', 'Code Cache', 'GPUCache', 'blob_storage', 'DawnWebGPUCache'];
    for (const account of this.accounts) {
      if (!account.enabled) continue;
      const profileRoot = path.join(this.chromeTmpPath, `RemoteAuth-${account.id}`, 'Default');
      for (const sub of CACHE_SUBDIRS) {
        const target = path.join(profileRoot, sub);
        try {
          if (fs.existsSync(target)) {
            fs.rmSync(target, { recursive: true, force: true });
          }
        } catch { /* non-fatal */ }
      }
    }
  }

  async connectAccount(accountId: string): Promise<void> {
    const existing = this.sessions.get(accountId);
    // Only block if fully connected — if stuck in connecting, forceRestart handles it
    if (existing?.status === 'connected') {
      return;
    }

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) {
      throw new Error(`Unknown account: ${accountId}`);
    }

    if (!account.enabled) {
      throw new Error(`Account is disabled: ${accountId}`);
    }

    const shouldResetPersistedAuth =
      existing?.status === 'degraded' &&
      typeof existing.lastError === 'string' &&
      existing.lastError.toLowerCase().includes('initialisation failed');

    if (shouldResetPersistedAuth) {
      await this.resetPersistedAuth(accountId);
    }

    await this.createClient(account);
  }

  async cancelSession(accountId: string): Promise<void> {
    this.clearReconnect(accountId);
    this.reconnectingAccounts.delete(accountId);
    this.reconnectAttempts.delete(accountId);
    this.qrRotationCounts.delete(accountId);

    const session = this.sessions.get(accountId);
    if (session) {
      if (session.client && typeof session.client.destroy === 'function') {
        try { await session.client.destroy(); } catch { /* ignore */ }
      }
      session.status = 'idle';
      session.lastEventAt = new Date().toISOString();
      session.lastError = 'Session cancelled. Click Connect to try again.';
      session.qrCode = null;
      session.pairingCode = null;
      session.pairingCodeGeneratedAt = null;
    }
    this.logger.info({ accountId }, 'WhatsApp session cancelled — returned to idle');
  }

  async forceRestartAccount(accountId: string): Promise<void> {
    const existing = this.sessions.get(accountId);
    if (existing?.client && typeof (existing.client as any).destroy === 'function') {
      try { await (existing.client as any).destroy(); } catch { /* ignore */ }
    }
    this.sessions.delete(accountId);
    this.clearReconnect(accountId);

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error(`Unknown account: ${accountId}`);
    if (!account.enabled) throw new Error(`Account is disabled: ${accountId}`);

    await this.createClient(account);
  }

  snapshot(): SessionSnapshot[] {
    return Array.from(this.sessions.values()).map((session) => ({
      accountId: session.account.id,
      displayName: session.account.displayName,
      owner: session.account.owner ?? null,
      rolloutWave: session.account.rolloutWave ?? null,
      status: this.accountControlService.isPaused(session.account.id) ? 'paused' : session.status,
      lastEventAt: session.lastEventAt,
      lastError: session.lastError,
      hasQrCode: Boolean(session.qrCode),
      pairingCode: session.pairingCode,
      pairingCodeGeneratedAt: session.pairingCodeGeneratedAt,
    }));
  }

  getQrCode(accountId: string): string | null {
    return this.sessions.get(accountId)?.qrCode ?? null;
  }

  async requestPairingCode(accountId: string, phoneNumber: string): Promise<{ accountId: string; pairingCode: string; generatedAt: string }> {
    const session = this.sessions.get(accountId);
    if (!session) {
      throw new Error(`Unknown account: ${accountId}`);
    }

    if (session.status === 'connected') {
      throw new Error(`Session is already connected for account: ${accountId}`);
    }

    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (!normalizedPhoneNumber) {
      throw new Error('Phone number is required');
    }

    if (typeof session.client.requestPairingCode !== 'function') {
      throw new Error('Pairing code is not supported by the current bridge client');
    }

    await this.ensurePairingCodeCallback(session);

    const pairingCode = await session.client.requestPairingCode(normalizedPhoneNumber, true);
    const generatedAt = new Date().toISOString();
    session.status = 'needs_qr';
    session.lastEventAt = generatedAt;
    session.lastError = null;
    session.qrCode = null;
    session.pairingCode = pairingCode;
    session.pairingCodeGeneratedAt = generatedAt;

    this.logger.info({ accountId, normalizedPhoneNumber }, 'Pairing code requested for WhatsApp login');

    return {
      accountId,
      pairingCode,
      generatedAt,
    };
  }

  private async ensurePairingCodeCallback(session: ManagedSession): Promise<void> {
    const clientWithPage = session.client as Client & {
      pupPage?: {
        exposeFunction: (name: string, fn: (code: string) => Promise<string>) => Promise<void>;
        evaluate: <T>(pageFunction: (...args: unknown[]) => T | Promise<T>, ...args: unknown[]) => Promise<T>;
      };
    };

    const page = clientWithPage.pupPage;
    if (!page) {
      throw new Error(`Pairing code page is not ready for account: ${session.account.id}`);
    }

    const callbackName = 'onCodeReceivedEvent';
    const hasCallback = await page.evaluate((name) => {
      const callback = (window as typeof window & Record<string, unknown>)[name];
      return typeof callback === 'function';
    }, callbackName);

    if (hasCallback) {
      return;
    }

    try {
      await page.exposeFunction(callbackName, async (code: string) => {
        const emitter = session.client as Client & { emit?: (event: string, value: string) => boolean };
        emitter.emit?.('code', code);
        return code;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already exists')) {
        throw error;
      }
    }

    const callbackReady = await page.evaluate((name) => {
      const callback = (window as typeof window & Record<string, unknown>)[name];
      return typeof callback === 'function';
    }, callbackName);

    if (!callbackReady) {
      throw new Error(`Failed to initialize pairing code callback for account: ${session.account.id}`);
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    const activeSessions = Array.from(this.sessions.values()).filter((session) => session.client && typeof session.client.destroy === 'function');
    await Promise.all(activeSessions.map((session) => session.client.destroy()));
  }

  /**
   * Watchdog: runs every 2 minutes.
   * - Reconnects sessions stuck in "degraded" without a scheduled retry.
   * - Reconnects sessions in "idle" that still have a saved session backup
   *   (e.g. after the reconnect limit was hit and cancelSession was called,
   *   but the auth zip on the Railway volume is still valid).
   */
  private async runWatchdog(): Promise<void> {
    if (this.isShuttingDown) return;
    for (const session of this.sessions.values()) {
      const { id } = session.account;
      if (
        !session.account.enabled ||
        this.accountControlService.isPaused(id) ||
        this.reconnectingAccounts.has(id) ||
        this.reconnectTimers.has(id)
      ) continue;

      if (session.status === 'degraded') {
        this.logger.warn({ accountId: id }, 'Watchdog detected degraded session — scheduling reconnect');
        this.scheduleReconnect(id);
      } else if (session.status === 'idle' && this.store.hasBackup(id)) {
        // Session was cancelled (hit reconnect limit) but the auth zip is
        // still on the volume — try to restore it automatically.
        this.logger.info({ accountId: id }, 'Watchdog reviving idle session that has a saved backup');
        this.reconnectAttempts.delete(id);
        void this.createClient(session.account);
      }
    }
  }

  private async resetPersistedAuth(accountId: string): Promise<void> {
    this.clearReconnect(accountId);
    this.reconnectingAccounts.delete(accountId);
    this.reconnectAttempts.delete(accountId);
    this.qrRotationCounts.delete(accountId);

    const session = this.sessions.get(accountId);
    if (session?.client && typeof session.client.destroy === 'function') {
      try {
        await session.client.destroy();
      } catch {
        // ignore cleanup errors and continue resetting persisted auth
      }
    }

    const remoteAuthName = `RemoteAuth-${accountId}`;
    const sessionDir = path.join(this.chromeTmpPath, remoteAuthName);
    const sessionZip = path.join(this.chromeTmpPath, `${remoteAuthName}.zip`);

    this.store.deleteBackup(accountId);

    try {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    } catch {
      // already gone
    }

    try {
      fs.rmSync(sessionZip, { force: true });
    } catch {
      // already gone
    }

    this.logger.warn({ accountId }, 'Cleared persisted WhatsApp auth state before requesting a fresh QR');
  }

  private async createClient(account: BridgeAccountConfig): Promise<void> {
    const client = new Client({
      authStrategy: new SafeRemoteAuth({
        clientId: account.id,
        // Chrome profile lives in /tmp — ephemeral, never fills the volume.
        // Auth backup zips are written to the Railway volume via this.store.
        dataPath: this.chromeTmpPath,
        store: this.store,
        // Back up the session every 5 minutes while connected.
        backupSyncIntervalMs: 5 * 60 * 1000,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          // Prevent Chrome from filling the Railway volume with cache data.
          '--disk-cache-size=1',
          '--media-cache-size=1',
          '--aggressive-cache-discard',
        ],
      },
    });

    const session: ManagedSession = {
      account,
      client,
      status: 'connecting',
      lastEventAt: new Date().toISOString(),
      lastError: null,
      qrCode: null,
      pairingCode: null,
      pairingCodeGeneratedAt: null,
    };

    this.sessions.set(account.id, session);
    this.bindEvents(session);
    try {
      await client.initialize();
    } catch (error) {
      this.logger.error({ accountId: account.id, error }, 'Chromium initialization failed — scheduling reconnect');
      try { await client.destroy(); } catch { /* ignore */ }
      session.status = 'degraded';
      session.lastEventAt = new Date().toISOString();
      session.lastError = 'Session initialisation failed. Retrying automatically.';
      this.scheduleReconnect(account.id);
    }
  }

  private bindEvents(session: ManagedSession): void {
    const updateStatus = (status: SessionStatus, error?: unknown) => {
      session.status = status;
      session.lastEventAt = new Date().toISOString();
      session.lastError = error instanceof Error ? error.message : error ? String(error) : null;
      if (status !== 'needs_qr') {
        session.qrCode = null;
        session.pairingCode = null;
        session.pairingCodeGeneratedAt = null;
      }
    };

    session.client.on('qr', (qr) => {
      const rotations = (this.qrRotationCounts.get(session.account.id) ?? 0) + 1;
      this.qrRotationCounts.set(session.account.id, rotations);

      if (rotations > MAX_QR_ROTATIONS) {
        this.logger.warn({ accountId: session.account.id, rotations }, `QR rotated ${MAX_QR_ROTATIONS} times with no scan — cancelling session`);
        void this.cancelSession(session.account.id);
        return;
      }

      updateStatus('needs_qr');
      session.qrCode = qr;
      session.pairingCode = null;
      session.pairingCodeGeneratedAt = null;
      qrcode.generate(qr, { small: true });
      this.logger.info({ accountId: session.account.id, rotation: rotations, max: MAX_QR_ROTATIONS }, 'QR code generated for WhatsApp login');
    });

    session.client.on('code', (code) => {
      updateStatus('needs_qr');
      session.qrCode = null;
      session.pairingCode = code;
      session.pairingCodeGeneratedAt = new Date().toISOString();
      this.logger.info({ accountId: session.account.id }, 'Pairing code generated for WhatsApp login');
    });

    session.client.on('authenticated', () => {
      this.clearReconnect(session.account.id);
      this.reconnectAttempts.delete(session.account.id);
      this.qrRotationCounts.delete(session.account.id);
      updateStatus('connecting');
      this.logger.info({ accountId: session.account.id }, 'WhatsApp session authenticated');
    });

    session.client.on('ready', () => {
      this.clearReconnect(session.account.id);
      this.reconnectAttempts.delete(session.account.id);
      this.qrRotationCounts.delete(session.account.id);
      updateStatus('connected');
      this.logger.info({ accountId: session.account.id }, 'WhatsApp session ready');
    });

    session.client.on('auth_failure', (message) => {
      updateStatus('degraded', message);
      this.logger.error({ accountId: session.account.id, message }, 'WhatsApp authentication failure');
      this.scheduleReconnect(session.account.id);
    });

    session.client.on('disconnected', (reason) => {
      updateStatus('degraded', reason);
      this.logger.warn({ accountId: session.account.id, reason }, 'WhatsApp session disconnected');
      this.scheduleReconnect(session.account.id);
    });

    session.client.on('message', async (message) => {
      // Drop WhatsApp Status updates (status@broadcast) immediately — they are
      // not real messages and flood the event loop at hundreds per second.
      if (message.from === 'status@broadcast') return;

      try {
        if (this.accountControlService.isPaused(session.account.id)) {
          updateStatus('paused');
          this.logger.info({ accountId: session.account.id, messageId: message.id._serialized }, 'Skipped message because account is paused');
          return;
        }

        await this.messageHandler.handle(session.account, session.client, message);
        if (session.status === 'paused') {
          updateStatus('connected');
        }
      } catch (error) {
        updateStatus('degraded', error);
        this.logger.error({ accountId: session.account.id, messageId: message.id._serialized, error }, 'Failed to process inbound message');
      }
    });
  }

  private clearReconnect(accountId: string): void {
    const timer = this.reconnectTimers.get(accountId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(accountId);
    }
  }

  private scheduleReconnect(accountId: string): void {
    if (this.isShuttingDown || this.reconnectTimers.has(accountId) || this.reconnectingAccounts.has(accountId)) {
      return;
    }

    const session = this.sessions.get(accountId);
    if (!session || !session.account.enabled || this.accountControlService.isPaused(accountId)) {
      return;
    }

    const attempts = (this.reconnectAttempts.get(accountId) ?? 0) + 1;
    this.reconnectAttempts.set(accountId, attempts);

    // First MAX_FAST_RECONNECT_ATTEMPTS: retry quickly every 15s.
    // After that: switch to a long delay (10 min) and keep retrying forever.
    // We never permanently cancel — WhatsApp may accept the session again
    // after a backoff, and Railway restarts should always be recoverable.
    const delay = attempts <= MAX_FAST_RECONNECT_ATTEMPTS ? RECONNECT_DELAY_MS : RECONNECT_LONG_DELAY_MS;

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(accountId);
      void this.reconnectSession(accountId);
    }, delay);

    this.reconnectTimers.set(accountId, timer);
    this.logger.info(
      { accountId, attempt: attempts, delayMs: delay },
      attempts <= MAX_FAST_RECONNECT_ATTEMPTS
        ? 'Scheduled WhatsApp session reconnect (fast retry)'
        : 'Scheduled WhatsApp session reconnect (long backoff — will keep retrying)',
    );
  }

  private async reconnectSession(accountId: string): Promise<void> {
    const session = this.sessions.get(accountId);
    if (!session || this.isShuttingDown || this.reconnectingAccounts.has(accountId)) {
      return;
    }

    this.reconnectingAccounts.add(accountId);

    try {
      if (session.client && typeof session.client.destroy === 'function') {
        await session.client.destroy().catch(() => undefined);
      }

      await this.createClient(session.account);
      this.logger.info({ accountId }, 'Reinitialized WhatsApp session');
    } catch (error) {
      session.status = 'degraded';
      session.lastEventAt = new Date().toISOString();
      session.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error({ accountId, error }, 'Failed to reinitialize WhatsApp session');
      this.scheduleReconnect(accountId);
    } finally {
      this.reconnectingAccounts.delete(accountId);
    }
  }
}