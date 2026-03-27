import qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';
import type { Logger } from 'pino';
import { Client, LocalAuth } from 'whatsapp-web.js';
import type { BridgeAccountConfig, ManagedSession, SessionStatus } from '../types';
import { MessageHandler } from '../handlers/messageHandler';
import { AccountControlService } from './accountControlService';

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

export class SessionManager {
  private readonly sessions = new Map<string, ManagedSession>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly reconnectingAccounts = new Set<string>();
  private isShuttingDown = false;

  constructor(
    private readonly sessionDataPath: string,
    private readonly accounts: BridgeAccountConfig[],
    private readonly messageHandler: MessageHandler,
    private readonly accountControlService: AccountControlService,
    private readonly logger: Logger,
  ) {}

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

      // Auto-connect enabled accounts one at a time with a stagger delay so
      // Chromium instances don't all compete for RAM at the same moment.
      const index = this.accounts.filter(a => a.enabled).indexOf(account);
      setTimeout(() => {
        void this.createClient(account);
      }, index * 8000);
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

    await this.createClient(account);
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
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    const activeSessions = Array.from(this.sessions.values()).filter((session) => session.client && typeof session.client.destroy === 'function');
    await Promise.all(activeSessions.map((session) => session.client.destroy()));
  }

  private async createClient(account: BridgeAccountConfig): Promise<void> {
    // Remove stale Chromium singleton lock files left on the volume after container
    // restarts — without this, Chromium refuses to start with Code 21 "profile in use".
    const profileDir = path.join(this.sessionDataPath, `session-${account.id}`);
    for (const lockFile of ['SingletonLock', 'SingletonCookie', 'SingletonSocket']) {
      const lockPath = path.join(profileDir, lockFile);
      try { fs.unlinkSync(lockPath); } catch { /* doesn't exist — fine */ }
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: account.id,
        dataPath: this.sessionDataPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-zygote',
          '--single-process',
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
          '--js-flags=--max-old-space-size=256',
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
    await client.initialize();
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
      updateStatus('needs_qr');
      session.qrCode = qr;
      session.pairingCode = null;
      session.pairingCodeGeneratedAt = null;
      qrcode.generate(qr, { small: true });
      this.logger.info({ accountId: session.account.id }, 'QR code generated for WhatsApp login');
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
      updateStatus('connecting');
      this.logger.info({ accountId: session.account.id }, 'WhatsApp session authenticated');
    });

    session.client.on('ready', () => {
      this.clearReconnect(session.account.id);
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

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(accountId);
      void this.reconnectSession(accountId);
    }, 10000);

    this.reconnectTimers.set(accountId, timer);
    this.logger.info({ accountId }, 'Scheduled WhatsApp session reconnect');
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