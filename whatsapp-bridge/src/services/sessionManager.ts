import fs from 'fs';
import path from 'path';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
  normalizeMessageContent,
  Browsers,
  DisconnectReason,
  type WASocket,
  type WAMessage,
  type WAMessageContent,
  type ConnectionState,
} from '@whiskeysockets/baileys';
import type { Logger } from 'pino';
import type {
  BridgeAccountConfig,
  BridgeClient,
  BridgeInboundMessage,
  BridgeMedia,
  SessionStatus,
} from '../types';
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

interface BaileysSession {
  account: BridgeAccountConfig;
  sock: WASocket | null;
  client: BridgeClient;
  status: SessionStatus;
  lastEventAt: string | null;
  lastError: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  pairingCodeGeneratedAt: string | null;
}

const MAX_FAST_RECONNECT_ATTEMPTS = 10;          // first N attempts: short delay
const MAX_QR_ROTATIONS = 10;
const ACCOUNT_START_STAGGER_MS = 3000;           // light stagger so we don't hit WA all at once
const RECONNECT_DELAY_MS = 15000;                // 15s for first 10 attempts
const RECONNECT_LONG_DELAY_MS = 10 * 60 * 1000;  // 10 min after that — retry forever
const CONNECTING_STUCK_MS = 5 * 60 * 1000;       // 5 min in 'connecting' → force restart
const PAIRING_WS_WARMUP_MS = 3000;               // let the socket open before requesting a pairing code

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Normalise a destination value (phone number or JID) to a Baileys user JID. */
function normalizeJid(value: string): string {
  const trimmed = value.trim();
  if (trimmed.endsWith('@g.us') || trimmed.endsWith('@s.whatsapp.net') || trimmed.endsWith('@newsletter')) {
    return trimmed;
  }
  const user = (trimmed.includes('@') ? trimmed.split('@')[0] : trimmed).replace(/\D/g, '');
  return `${user}@s.whatsapp.net`;
}

/** Baileys messageTimestamp may be number | Long | undefined → unix seconds. */
function coerceTimestamp(value: WAMessage['messageTimestamp']): number {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toNumber?: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : Math.floor(Date.now() / 1000);
}

function extractBody(content: WAMessageContent | null | undefined): string {
  if (!content) return '';
  return (
    content.conversation ||
    content.extendedTextMessage?.text ||
    content.documentMessage?.caption ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    ''
  );
}

/**
 * SessionManager — Baileys transport.
 *
 * Replaces the previous whatsapp-web.js / headless-Chrome implementation. Each
 * account is a lightweight WebSocket session (no browser), so RAM per account
 * drops from ~1 GB+ to a few tens of MB and the persistent volume only holds
 * small JSON auth files (no Chrome profile/cache that fills the disk).
 *
 * The public surface (start/snapshot/getQrCode/requestPairingCode/connectAccount/
 * forceRestartAccount/cancelSession/shutdown) is unchanged so the HTTP server and
 * the existing scan UI keep working exactly as before.
 */
export class SessionManager {
  private readonly sessions = new Map<string, BaileysSession>();
  private readonly reconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly reconnectingAccounts = new Set<string>();
  private readonly reconnectAttempts = new Map<string, number>();
  private readonly qrRotationCounts = new Map<string, number>();
  private isShuttingDown = false;
  private watchdogTimer: NodeJS.Timeout | null = null;
  private readonly baileysRoot: string;
  // Baileys is far less chatty than wwebjs; keep its internal logging quiet.
  private readonly baileysLogger = pino({ level: process.env.BAILEYS_LOG_LEVEL ?? 'error' });

  constructor(
    private readonly sessionDataPath: string,
    private readonly accounts: BridgeAccountConfig[],
    private readonly messageHandler: MessageHandler,
    private readonly accountControlService: AccountControlService,
    private readonly logger: Logger,
  ) {
    // Multi-file auth state lives under the Railway volume; tiny JSON files only.
    this.baileysRoot = path.join(sessionDataPath, 'baileys');
    fs.mkdirSync(this.baileysRoot, { recursive: true });
  }

  async start(): Promise<void> {
    const enabledAccounts = this.accounts.filter((a) => a.enabled);

    for (const account of this.accounts) {
      this.seedSession(account, account.enabled ? 'idle' : 'paused');

      if (!account.enabled) continue;

      // Auto-connect only accounts that already have stored credentials.
      // Never-linked accounts stay idle until the user clicks Connect and scans.
      if (!this.hasCreds(account.id)) continue;

      const index = enabledAccounts.indexOf(account);
      setTimeout(() => {
        void this.createClient(account);
      }, index * ACCOUNT_START_STAGGER_MS);
    }

    // Watchdog: revive degraded/idle-with-creds sessions and unstick hangs.
    this.watchdogTimer = setInterval(() => {
      void this.runWatchdog();
    }, 2 * 60 * 1000);
  }

  private seedSession(account: BridgeAccountConfig, status: SessionStatus): BaileysSession {
    const existing = this.sessions.get(account.id);
    if (existing) return existing;
    const session: BaileysSession = {
      account,
      sock: null,
      client: { sendMessage: async () => ({ id: { _serialized: '' } }) },
      status,
      lastEventAt: new Date().toISOString(),
      lastError: null,
      qrCode: null,
      pairingCode: null,
      pairingCodeGeneratedAt: null,
    };
    this.sessions.set(account.id, session);
    return session;
  }

  private authDir(accountId: string): string {
    return path.join(this.baileysRoot, accountId);
  }

  private hasCreds(accountId: string): boolean {
    try {
      return fs.existsSync(path.join(this.authDir(accountId), 'creds.json'));
    } catch {
      return false;
    }
  }

  private buildClient(sock: WASocket): BridgeClient {
    return {
      sendMessage: async (chatId, media, options) => {
        const jid = normalizeJid(chatId);
        const buffer = Buffer.from(media.data, 'base64');
        const sent = await sock.sendMessage(jid, {
          document: buffer,
          mimetype: media.mimetype || 'application/octet-stream',
          fileName: media.filename || 'document',
          caption: options?.caption,
        });
        return { id: { _serialized: sent?.key?.id ?? '' } };
      },
    };
  }

  private async createClient(account: BridgeAccountConfig): Promise<void> {
    // Tear down any existing socket first so repeated connect/pairing/reconnect
    // calls can never leak an orphaned WebSocket or its event listeners.
    const previous = this.sessions.get(account.id);
    if (previous?.sock) {
      try { previous.sock.end(undefined); } catch { /* ignore */ }
      previous.sock = null;
    }

    const authDir = this.authDir(account.id);
    fs.mkdirSync(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    let version: [number, number, number] | undefined;
    try {
      ({ version } = await fetchLatestBaileysVersion());
    } catch {
      // Offline / fetch failed — fall back to the version bundled with Baileys.
    }

    const sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.baileysLogger),
      },
      logger: this.baileysLogger,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false,
      browser: Browsers.ubuntu('Chrome'),
      generateHighQualityLinkPreview: false,
    });

    const session = this.seedSession(account, 'connecting');
    session.sock = sock;
    session.client = this.buildClient(sock);
    session.status = 'connecting';
    session.lastEventAt = new Date().toISOString();
    session.lastError = null;

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => {
      void this.onConnectionUpdate(account, update);
    });
    sock.ev.on('messages.upsert', (event) => {
      void this.onMessagesUpsert(account, sock, event);
    });
  }

  private async onConnectionUpdate(
    account: BridgeAccountConfig,
    update: Partial<ConnectionState>,
  ): Promise<void> {
    const session = this.sessions.get(account.id);
    if (!session) return;

    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const rotations = (this.qrRotationCounts.get(account.id) ?? 0) + 1;
      this.qrRotationCounts.set(account.id, rotations);

      if (rotations > MAX_QR_ROTATIONS) {
        this.logger.warn({ accountId: account.id, rotations }, `QR rotated ${MAX_QR_ROTATIONS} times with no scan — cancelling session`);
        await this.cancelSession(account.id);
        return;
      }

      session.status = 'needs_qr';
      session.qrCode = qr;
      session.pairingCode = null;
      session.pairingCodeGeneratedAt = null;
      session.lastEventAt = new Date().toISOString();
      try { qrcode.generate(qr, { small: true }); } catch { /* terminal QR is best-effort */ }
      this.logger.info({ accountId: account.id, rotation: rotations, max: MAX_QR_ROTATIONS }, 'QR code generated for WhatsApp login');
    }

    if (connection === 'connecting' && session.status !== 'needs_qr') {
      session.status = 'connecting';
      session.lastEventAt = new Date().toISOString();
    }

    if (connection === 'open') {
      this.clearReconnect(account.id);
      this.reconnectAttempts.delete(account.id);
      this.qrRotationCounts.delete(account.id);
      session.status = 'connected';
      session.qrCode = null;
      session.pairingCode = null;
      session.pairingCodeGeneratedAt = null;
      session.lastError = null;
      session.lastEventAt = new Date().toISOString();
      this.logger.info({ accountId: account.id }, 'WhatsApp session ready');
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)?.output?.statusCode;
      session.lastEventAt = new Date().toISOString();

      if (statusCode === DisconnectReason.loggedOut) {
        // Credentials were invalidated (unlinked on the phone). Clear auth and
        // go idle — the user must scan a fresh QR. Do NOT keep reconnecting.
        this.logger.warn({ accountId: account.id }, 'WhatsApp logged out — clearing auth, awaiting fresh QR scan');
        await this.resetPersistedAuth(account.id);
        session.sock = null;
        session.status = 'idle';
        session.qrCode = null;
        session.pairingCode = null;
        session.pairingCodeGeneratedAt = null;
        session.lastError = 'Logged out on phone. Click Connect and scan the QR again.';
        return;
      }

      if (statusCode === DisconnectReason.restartRequired) {
        // Normal handshake step right after a scan/pair — reconnect immediately.
        this.logger.info({ accountId: account.id }, 'Restart required after login — reconnecting immediately');
        session.status = 'connecting';
        void this.reconnectSession(account.id);
        return;
      }

      session.status = 'degraded';
      session.lastError = `Connection closed (code: ${statusCode ?? 'unknown'})`;
      this.logger.warn({ accountId: account.id, statusCode }, 'WhatsApp session disconnected');
      this.scheduleReconnect(account.id);
    }
  }

  private async onMessagesUpsert(
    account: BridgeAccountConfig,
    sock: WASocket,
    event: { messages: WAMessage[]; type: string },
  ): Promise<void> {
    // 'notify' = newly received realtime messages. Ignore history/append syncs.
    if (event.type !== 'notify') return;

    const session = this.sessions.get(account.id);
    if (!session) return;

    for (const raw of event.messages) {
      try {
        if (!raw.message) continue;
        const remoteJid = raw.key.remoteJid;
        if (!remoteJid || remoteJid === 'status@broadcast') continue;
        if (raw.key.fromMe) continue;

        if (this.accountControlService.isPaused(account.id)) {
          session.status = 'paused';
          this.logger.info({ accountId: account.id, messageId: raw.key.id }, 'Skipped message because account is paused');
          continue;
        }

        const message = this.adaptMessage(sock, raw, remoteJid);
        await this.messageHandler.handle(account, session.client, message);
        if (session.status === 'paused') session.status = 'connected';
      } catch (error) {
        // A processing error is not a connection failure — log and keep going.
        this.logger.error({ accountId: account.id, messageId: raw.key.id, error: error instanceof Error ? error.message : String(error) }, 'Failed to process inbound message');
      }
    }
  }

  /** Adapt a raw Baileys message into the transport-agnostic shape handlers expect. */
  private adaptMessage(sock: WASocket, raw: WAMessage, remoteJid: string): BridgeInboundMessage {
    const content = normalizeMessageContent(raw.message);
    const docNode = content?.documentMessage;
    const imgNode = content?.imageMessage;
    const vidNode = content?.videoMessage;
    const mediaNode = docNode ?? imgNode ?? vidNode ?? null;

    const serialized = `${raw.key.fromMe ? 'true' : 'false'}_${remoteJid}_${raw.key.id ?? ''}`;
    const logger = this.baileysLogger;

    return {
      id: { _serialized: serialized },
      from: remoteJid,
      body: extractBody(content),
      fromMe: Boolean(raw.key.fromMe),
      hasMedia: Boolean(mediaNode),
      timestamp: coerceTimestamp(raw.messageTimestamp),
      downloadMedia: async (): Promise<BridgeMedia | null> => {
        if (!mediaNode) return null;
        // Pass the normalised content so wrapped (caption/ephemeral) docs download cleanly.
        const dlMessage = { key: raw.key, message: content } as WAMessage;
        const buffer = (await downloadMediaMessage(
          dlMessage,
          'buffer',
          {},
          { logger, reuploadRequest: sock.updateMediaMessage },
        )) as Buffer;
        if (!buffer || buffer.length === 0) return null;
        return {
          data: buffer.toString('base64'),
          mimetype: String(mediaNode.mimetype ?? 'application/octet-stream'),
          filename: docNode?.fileName ?? undefined,
        };
      },
      reply: async (text: string): Promise<unknown> => {
        return sock.sendMessage(remoteJid, { text }, { quoted: raw });
      },
    };
  }

  async connectAccount(accountId: string): Promise<void> {
    const existing = this.sessions.get(accountId);
    if (existing?.status === 'connected') return;

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error(`Unknown account: ${accountId}`);
    if (!account.enabled) throw new Error(`Account is disabled: ${accountId}`);

    await this.createClient(account);
  }

  async requestPairingCode(accountId: string, phoneNumber: string): Promise<{ accountId: string; pairingCode: string; generatedAt: string }> {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error(`Unknown account: ${accountId}`);
    if (!account.enabled) throw new Error(`Account is disabled: ${accountId}`);

    const existing = this.sessions.get(accountId);
    if (existing?.status === 'connected') {
      throw new Error(`Session is already connected for account: ${accountId}`);
    }

    const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');
    if (!normalizedPhoneNumber) {
      throw new Error('Phone number is required');
    }

    // Start a fresh socket, let its WebSocket warm up, then request the code.
    await this.createClient(account);
    const session = this.sessions.get(accountId);
    const sock = session?.sock;
    if (!session || !sock) {
      throw new Error(`Failed to start session for pairing: ${accountId}`);
    }
    if (sock.authState.creds.registered) {
      throw new Error(`Session is already registered for account: ${accountId}`);
    }

    await sleep(PAIRING_WS_WARMUP_MS);
    const pairingCode = await sock.requestPairingCode(normalizedPhoneNumber);
    const generatedAt = new Date().toISOString();
    session.status = 'needs_qr';
    session.lastEventAt = generatedAt;
    session.lastError = null;
    session.qrCode = null;
    session.pairingCode = pairingCode;
    session.pairingCodeGeneratedAt = generatedAt;

    this.logger.info({ accountId, normalizedPhoneNumber }, 'Pairing code requested for WhatsApp login');
    return { accountId, pairingCode, generatedAt };
  }

  async forceRestartAccount(accountId: string): Promise<void> {
    const existing = this.sessions.get(accountId);
    if (existing?.sock) {
      try { existing.sock.end(undefined); } catch { /* ignore */ }
      existing.sock = null;
    }
    this.clearReconnect(accountId);

    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) throw new Error(`Unknown account: ${accountId}`);
    if (!account.enabled) throw new Error(`Account is disabled: ${accountId}`);

    await this.createClient(account);
  }

  async cancelSession(accountId: string): Promise<void> {
    this.clearReconnect(accountId);
    this.reconnectingAccounts.delete(accountId);
    this.reconnectAttempts.delete(accountId);
    this.qrRotationCounts.delete(accountId);

    const session = this.sessions.get(accountId);
    if (session) {
      if (session.sock) {
        try { session.sock.end(undefined); } catch { /* ignore */ }
        session.sock = null;
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

  private async resetPersistedAuth(accountId: string): Promise<void> {
    this.clearReconnect(accountId);
    this.reconnectingAccounts.delete(accountId);
    this.reconnectAttempts.delete(accountId);
    this.qrRotationCounts.delete(accountId);

    const session = this.sessions.get(accountId);
    if (session?.sock) {
      try { session.sock.end(undefined); } catch { /* ignore */ }
      session.sock = null;
    }

    try {
      fs.rmSync(this.authDir(accountId), { recursive: true, force: true });
    } catch {
      // already gone
    }
    this.logger.warn({ accountId }, 'Cleared persisted WhatsApp auth state before requesting a fresh QR');
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

    for (const session of this.sessions.values()) {
      if (session.sock) {
        try { session.sock.end(undefined); } catch { /* ignore */ }
      }
    }
  }

  /**
   * Watchdog: runs every 2 minutes.
   * - Reconnects sessions stuck in "degraded" without a scheduled retry.
   * - Revives "idle" sessions that still have stored credentials (e.g. after a
   *   transient cancel) so a connected number self-heals after a restart.
   * - Force-restarts sessions wedged in "connecting".
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
      } else if (session.status === 'idle' && !session.sock && this.hasCreds(id)) {
        this.logger.info({ accountId: id }, 'Watchdog reviving idle session that has stored credentials');
        this.reconnectAttempts.delete(id);
        void this.createClient(session.account);
      } else if (session.status === 'connecting' && session.lastEventAt) {
        const stuckMs = Date.now() - new Date(session.lastEventAt).getTime();
        if (stuckMs > CONNECTING_STUCK_MS) {
          this.logger.warn({ accountId: id, stuckMs }, 'Watchdog detected session stuck in connecting — forcing restart');
          session.status = 'degraded';
          session.lastEventAt = new Date().toISOString();
          session.lastError = 'Stuck in connecting state — forcing restart';
          this.scheduleReconnect(id);
        }
      }
    }
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

    // First N attempts retry quickly; after that switch to a long delay and
    // keep retrying forever — WhatsApp may accept the session again later.
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
      if (session.sock) {
        try { session.sock.end(undefined); } catch { /* ignore */ }
        session.sock = null;
      }

      const account = this.accounts.find((a) => a.id === accountId);
      if (!account || !account.enabled || this.accountControlService.isPaused(accountId)) {
        return;
      }

      await this.createClient(account);
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
