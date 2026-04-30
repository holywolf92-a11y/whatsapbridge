import fs from 'fs';
import os from 'os';
import path from 'path';
import { Client, LocalAuth, RemoteAuth } from 'whatsapp-web.js';
import { loadConfig } from '../config/config';
import { createLogger } from '../utils/logger';
import { VolumeSessionStore } from '../services/volumeSessionStore';
import { FileBackedDedupeService } from '../services/dedupeService';
import { DeliveryService } from '../services/deliveryService';
import { classifyMedia } from '../handlers/cvDetector';

class SafeRemoteAuth extends RemoteAuth {
  async storeRemoteSession(options?: any): Promise<void> {
    try {
      const parentFn = (RemoteAuth.prototype as any).storeRemoteSession as (opts?: any) => Promise<void>;
      await parentFn.call(this, options);
    } catch {
      // Non-fatal during one-off backfill.
    }
  }
}

type CliOptions = {
  accountId: string;
  limitPerChat: number;
  maxChats: number;
  after: Date | null;
  before: Date | null;
  maxDeliveries: number | null;
  dryRun: boolean;
};

function parseArgs(argv: string[], defaultAccountId: string): CliOptions {
  const options: CliOptions = {
    accountId: defaultAccountId,
    limitPerChat: 200,
    maxChats: 200,
    after: null,
    before: null,
    maxDeliveries: null,
    dryRun: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--account' && next) {
      options.accountId = next;
      index += 1;
      continue;
    }

    if (arg === '--limit-per-chat' && next) {
      options.limitPerChat = Number.parseInt(next, 10) || options.limitPerChat;
      index += 1;
      continue;
    }

    if (arg === '--max-chats' && next) {
      options.maxChats = Number.parseInt(next, 10) || options.maxChats;
      index += 1;
      continue;
    }

    if (arg === '--after' && next) {
      const parsed = new Date(next);
      if (!Number.isNaN(parsed.getTime())) {
        options.after = parsed;
      }
      index += 1;
      continue;
    }

    if (arg === '--before' && next) {
      const parsed = new Date(next);
      if (!Number.isNaN(parsed.getTime())) {
        options.before = parsed;
      }
      index += 1;
      continue;
    }

    if (arg === '--max-deliveries' && next) {
      const parsed = Number.parseInt(next, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        options.maxDeliveries = parsed;
      }
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function isInboxChatId(chatId: string | undefined): boolean {
  const normalized = String(chatId || '').trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.endsWith('@broadcast')) return false;
  if (normalized.endsWith('@newsletter')) return false;
  if (normalized.endsWith('@g.us')) return false;
  return true;
}

function getBase64SizeBytes(base64Data: string): number {
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

async function waitForReady(client: Client, logger: ReturnType<typeof createLogger>, timeoutMs = 90_000): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`WhatsApp session did not become ready within ${timeoutMs}ms`));
    }, timeoutMs);

    const onReady = () => {
      cleanup();
      resolve();
    };

    const onAuthenticated = () => {
      logger.info('WhatsApp historical backfill session authenticated');
    };

    const onQr = () => {
      logger.warn('WhatsApp historical backfill session requires QR scan on this machine');
    };

    const onAuthFailure = (message: string) => {
      cleanup();
      reject(new Error(`WhatsApp auth failure: ${message}`));
    };

    const onDisconnected = (reason: string) => {
      cleanup();
      reject(new Error(`WhatsApp disconnected before ready: ${reason}`));
    };

    const cleanup = () => {
      clearTimeout(timer);
      client.removeListener('ready', onReady);
      client.removeListener('authenticated', onAuthenticated);
      client.removeListener('qr', onQr);
      client.removeListener('auth_failure', onAuthFailure);
      client.removeListener('disconnected', onDisconnected);
    };

    client.on('ready', onReady);
    client.on('authenticated', onAuthenticated);
    client.on('qr', onQr);
    client.on('auth_failure', onAuthFailure);
    client.on('disconnected', onDisconnected);
  });
}

async function initializeClient(client: Client, timeoutMs = 90_000): Promise<void> {
  await Promise.race([
    client.initialize(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`WhatsApp client.initialize() did not complete within ${timeoutMs}ms`));
      }, timeoutMs);
    }),
  ]);
}

async function fetchChatMessages(client: Client, chatId: string, limit: number): Promise<any[]> {
  const messageIds = await (client as any).pupPage.evaluate(async (serializedChatId: string, maxMessages: number) => {
    const runtime = window as any;
    const normalizeId = (candidate: any): string | null => {
      if (!candidate) return null;
      if (typeof candidate === 'string') return candidate;
      if (typeof candidate._serialized === 'string') return candidate._serialized;
      return null;
    };

    const msgFilter = (message: any) => !message.isNotification;
    const chats = runtime.Store.Chat.getModelsArray();
    const chat = chats.find((candidate: any) => normalizeId(candidate?.id) === serializedChatId) || null;
    if (!chat) {
      return [];
    }

    await runtime.Store.Cmd.openChatBottom({ chat });
    await new Promise((resolve) => setTimeout(resolve, 300));

    let messages = (chat.msgs?.getModelsArray?.() || []).filter(msgFilter);

    if (maxMessages > 0) {
      while (messages.length < maxMessages) {
        const loadedMessages = await runtime.Store.ConversationMsgs.loadEarlierMsgs(chat, chat.msgs);
        if (!loadedMessages || !loadedMessages.length) {
          break;
        }

        messages = [...loadedMessages.filter(msgFilter), ...messages];
      }

      if (messages.length > maxMessages) {
        messages.sort((left: any, right: any) => (left.t > right.t ? 1 : -1));
        messages = messages.splice(messages.length - maxMessages);
      }
    }

    return messages
      .map((message: any) => runtime.WWebJS.getMessageModel(message)?.id?._serialized || null)
      .filter(Boolean);
  }, chatId, limit);

  const hydratedMessages = await Promise.all(messageIds.map((messageId: string) => client.getMessageById(messageId)));
  return hydratedMessages.filter(Boolean);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const defaultAccountId = config.accounts.find((account) => account.enabled)?.id || 'whatsapp1';
  const options = parseArgs(process.argv.slice(2), defaultAccountId);
  const account = config.accounts.find((candidate) => candidate.id === options.accountId);

  if (!account) {
    throw new Error(`Unknown account: ${options.accountId}`);
  }

  const sessionStore = new VolumeSessionStore(path.join(config.sessionDataPath, 'backups'));
  const legacyLocalAuthPath = path.join(config.sessionDataPath, `session-${account.id}`);
  const hasRemoteAuthBackup = sessionStore.hasBackup(account.id);
  const hasLegacyLocalAuth = fs.existsSync(legacyLocalAuthPath);
  if (!hasRemoteAuthBackup && !hasLegacyLocalAuth) {
    throw new Error(`No saved WhatsApp session found for account ${account.id}`);
  }

  const isolatedDataPath = path.join(os.tmpdir(), `wa-backfill-${account.id}-${Date.now()}`);
  fs.rmSync(isolatedDataPath, { recursive: true, force: true });
  fs.mkdirSync(isolatedDataPath, { recursive: true });

  const dedupeService = new FileBackedDedupeService(config.dedupeStorePath);
  const deliveryService = new DeliveryService(config, logger);
  const authStrategy = hasRemoteAuthBackup
    ? new SafeRemoteAuth({
        clientId: account.id,
        dataPath: isolatedDataPath,
        store: sessionStore,
        backupSyncIntervalMs: 5 * 60 * 1000,
      })
    : new LocalAuth({
        clientId: account.id,
        dataPath: config.sessionDataPath,
      });

  logger.info({
    accountId: account.id,
    authMode: hasRemoteAuthBackup ? 'remote-auth' : 'local-auth',
  }, 'Using saved WhatsApp session for historical PDF backfill');

  const client = new Client({
    authStrategy,
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    },
  });

  logger.info({
    accountId: account.id,
    limitPerChat: options.limitPerChat,
    maxChats: options.maxChats,
    after: options.after?.toISOString() ?? null,
    before: options.before?.toISOString() ?? null,
    maxDeliveries: options.maxDeliveries,
    dryRun: options.dryRun,
  }, 'Starting historical PDF backfill scan');

  try {
    await initializeClient(client);
    await waitForReady(client, logger);

    const chats = await client.getChats();
    const candidateChats = chats
      .filter((chat) => isInboxChatId((chat as any).id?._serialized || (chat as any).id?.user || (chat as any).id))
      .sort((left: any, right: any) => Number(right.timestamp || 0) - Number(left.timestamp || 0))
      .slice(0, options.maxChats);

    let scannedMessages = 0;
    let matchedPdfMessages = 0;
    let deliveredMessages = 0;
    let skippedDuplicates = 0;
    let stoppedByDeliveryCap = false;

    for (const chat of candidateChats) {
      if (stoppedByDeliveryCap) {
        break;
      }

      let messages: any[] = [];
      const serializedChatId = (chat as any).id?._serialized || (chat as any).id?.user || (chat as any).id || null;

      try {
        if (!serializedChatId) {
          continue;
        }

        messages = await fetchChatMessages(client, serializedChatId, options.limitPerChat);
      } catch (error) {
        logger.warn({
          accountId: account.id,
          chatId: serializedChatId,
          error: error instanceof Error ? error.message : String(error),
        }, 'Skipping chat after fetchMessages failure during historical backfill');
        continue;
      }

      for (const message of messages as any[]) {
        if (stoppedByDeliveryCap) {
          break;
        }

        if (message.fromMe || !message.hasMedia) {
          continue;
        }

        if (options.after && Number(message.timestamp || 0) * 1000 < options.after.getTime()) {
          continue;
        }

        if (options.before && Number(message.timestamp || 0) * 1000 >= options.before.getTime()) {
          continue;
        }

        scannedMessages += 1;

        const messageDecision = dedupeService.registerMessage({
          accountId: account.id,
          messageId: message.id._serialized,
          from: message.from,
        });

        if (!messageDecision.accepted) {
          skippedDuplicates += 1;
          continue;
        }

        const media = await message.downloadMedia();
        if (!media) {
          continue;
        }

        const mimeType = String(media.mimetype || '').toLowerCase();
        const fileName = String(media.filename || '').toLowerCase();
        const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');
        if (!isPdf) {
          continue;
        }

        const detection = classifyMedia(media, message, config);
        if (detection.verdict === 'not_cv') {
          continue;
        }

        matchedPdfMessages += 1;

        const fileHash = dedupeService.computeHash(media.data);
        const fileDecision = dedupeService.registerFile({
          accountId: account.id,
          messageId: message.id._serialized,
          from: message.from,
          fileHash,
        });

        if (!fileDecision.accepted) {
          skippedDuplicates += 1;
          continue;
        }

        if (options.dryRun) {
          logger.info({
            accountId: account.id,
            messageId: message.id._serialized,
            from: message.from,
            fileName: media.filename,
            mimeType: media.mimetype,
            detection: detection.verdict,
          }, 'Dry-run matched historical PDF CV');
          continue;
        }

        if (options.maxDeliveries !== null && deliveredMessages >= options.maxDeliveries) {
          stoppedByDeliveryCap = true;
          logger.info({
            accountId: account.id,
            maxDeliveries: options.maxDeliveries,
          }, 'Stopping historical PDF backfill after reaching delivery cap');
          break;
        }

        await deliveryService.deliver({
          account,
          client,
          message,
          media,
          fileHash,
          fileSizeBytes: getBase64SizeBytes(media.data),
          detection,
          backfill: true,
        });
        deliveredMessages += 1;

        if (options.maxDeliveries !== null && deliveredMessages >= options.maxDeliveries) {
          stoppedByDeliveryCap = true;
          logger.info({
            accountId: account.id,
            maxDeliveries: options.maxDeliveries,
          }, 'Stopping historical PDF backfill after reaching delivery cap');
          break;
        }
      }
    }

    logger.info({
      accountId: account.id,
      scannedMessages,
      matchedPdfMessages,
      deliveredMessages,
      skippedDuplicates,
      stoppedByDeliveryCap,
      dryRun: options.dryRun,
    }, 'Historical PDF backfill scan completed');
  } finally {
    try {
      await client.destroy();
    } catch {
      // Ignore cleanup failures.
    }
    fs.rmSync(isolatedDataPath, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(message);
  process.exit(1);
});