import path from 'path';
import qrcode from 'qrcode-terminal';
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
};

export class SessionManager {
  private readonly sessions = new Map<string, ManagedSession>();

  constructor(
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
        });
        continue;
      }

      await this.createClient(account);
    }
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
    }));
  }

  getQrCode(accountId: string): string | null {
    return this.sessions.get(accountId)?.qrCode ?? null;
  }

  async shutdown(): Promise<void> {
    const activeSessions = Array.from(this.sessions.values()).filter((session) => session.client && typeof session.client.destroy === 'function');
    await Promise.all(activeSessions.map((session) => session.client.destroy()));
  }

  private async createClient(account: BridgeAccountConfig): Promise<void> {
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: account.id,
        dataPath: path.resolve(process.cwd(), 'src/sessions'),
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    const session: ManagedSession = {
      account,
      client,
      status: 'connecting',
      lastEventAt: new Date().toISOString(),
      lastError: null,
      qrCode: null,
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
      }
    };

    session.client.on('qr', (qr) => {
      updateStatus('needs_qr');
      session.qrCode = qr;
      qrcode.generate(qr, { small: true });
      this.logger.info({ accountId: session.account.id }, 'QR code generated for WhatsApp login');
    });

    session.client.on('authenticated', () => {
      updateStatus('connecting');
      this.logger.info({ accountId: session.account.id }, 'WhatsApp session authenticated');
    });

    session.client.on('ready', () => {
      updateStatus('connected');
      this.logger.info({ accountId: session.account.id }, 'WhatsApp session ready');
    });

    session.client.on('auth_failure', (message) => {
      updateStatus('degraded', message);
      this.logger.error({ accountId: session.account.id, message }, 'WhatsApp authentication failure');
    });

    session.client.on('disconnected', (reason) => {
      updateStatus('degraded', reason);
      this.logger.warn({ accountId: session.account.id, reason }, 'WhatsApp session disconnected');
    });

    session.client.on('message', async (message) => {
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
}