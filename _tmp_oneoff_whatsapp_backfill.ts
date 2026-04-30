import fs from 'fs';
import path from 'path';
import { Client, RemoteAuth } from 'whatsapp-web.js';
import { loadConfig } from '/app/src/config/config';
import { createLogger } from '/app/src/utils/logger';
import { VolumeSessionStore } from '/app/src/services/volumeSessionStore';
import { FileBackedDedupeService } from '/app/src/services/dedupeService';
import { classifyMedia } from '/app/src/handlers/cvDetector';

class SafeRemoteAuth extends RemoteAuth {
  async storeRemoteSession(options?: unknown): Promise<void> {
    try {
      const parentFn = (RemoteAuth.prototype as any).storeRemoteSession as (opts?: unknown) => Promise<void>;
      await parentFn.call(this, options);
    } catch {
      // Ignore RemoteAuth backup sync failures during one-off execution.
    }
  }
}

type CliOptions = {
  accountId: string;
  limitPerChat: number;
  maxChats: number;
  after: Date | null;
  dryRun: boolean;
};

function parseArgs(argv: string[], defaultAccountId: string): CliOptions {
  const options: CliOptions = {
    accountId: defaultAccountId,
    limitPerChat: 1000,
    maxChats: Number.MAX_SAFE_INTEGER,
    after: new Date('2024-01-01T00:00:00.000Z'),
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
  return true;
}

function getBase64SizeBytes(base64Data: string): number {
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

function loadExistingDedupeKeys(storePath: string): Set<string> {
  if (!fs.existsSync(storePath)) {
    return new Set<string>();
  }

  const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8')) as { records?: Array<{ key?: string }> };
  return new Set((parsed.records ?? []).map((record) => String(record.key || '')).filter(Boolean));
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
      logger.warn('WhatsApp historical backfill session unexpectedly requested a QR');
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

async function deliverToConfiguredDestination(params: {
  config: ReturnType<typeof loadConfig>;
  logger: ReturnType<typeof createLogger>;
  account: ReturnType<typeof loadConfig>['accounts'][number];
  client: Client;
  message: any;
  media: any;
  fileHash: string;
  fileSizeBytes: number;
  detection: ReturnType<typeof classifyMedia>;
}): Promise<void> {
  const { config, logger, account, client, message, media, fileHash, fileSizeBytes, detection } = params;

  if (config.bridgeMode === 'meta-forward') {
    const destination = config.destinationWhatsAppId;
    if (!destination) {
      throw new Error('Destination WhatsApp ID is not configured');
    }

    const originalTimestamp = message.timestamp
      ? new Date(message.timestamp * 1000).toISOString()
      : new Date().toISOString();
    const caption = [
      '[FALISHA_BRIDGE]',
      `bridge_account=${account.id}`,
      `bridge_label=${account.displayName}`,
      `original_sender=${message.from ?? 'unknown'}`,
      `original_message_id=${message.id._serialized}`,
      `original_timestamp=${originalTimestamp}`,
      `detection=${detection.verdict}`,
      `file_hash=${fileHash}`,
      'backfill=true',
    ].join('\n');

    const result = await client.sendMessage(destination, media, { caption });
    logger.info({
      mode: 'meta-forward',
      destination,
      sourceMessageId: message.id._serialized,
      outboundMessageId: result.id._serialized,
    }, 'Delivered historical media to Meta destination');
    return;
  }

  if (!config.backendUploadUrl) {
    throw new Error('Backend upload URL is not configured');
  }

  const binary = Buffer.from(media.data, 'base64');
  const form = new FormData();
  form.append('file', new Blob([binary], { type: media.mimetype }), media.filename ?? 'upload.bin');
  form.append('bridgeAccountId', account.id);
  form.append('bridgeAccountName', account.displayName);
  form.append('originalSenderPhone', message.from ?? 'unknown');
  form.append('originalMessageId', message.id._serialized);
  form.append('originalTimestamp', new Date(message.timestamp * 1000).toISOString());
  form.append('fileHash', fileHash);
  form.append('fileSizeBytes', String(fileSizeBytes));
  form.append('mimeType', media.mimetype);
  form.append('fileName', media.filename ?? 'upload.bin');
  form.append('detectionVerdict', detection.verdict);
  form.append('backfill', 'true');

  const response = await fetch(config.backendUploadUrl, {
    method: 'POST',
    headers: config.backendUploadToken
      ? { Authorization: `Bearer ${config.backendUploadToken}` }
      : undefined,
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Backend upload failed with ${response.status}: ${body}`);
  }

  const json = (await response.json()) as { id?: string };
  logger.info({
    mode: 'backend-upload',
    sourceMessageId: message.id._serialized,
    responseId: json.id ?? null,
  }, 'Uploaded historical media to backend');
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

  const backupsDir = path.join(config.sessionDataPath, 'backups');
  const sessionStore = new VolumeSessionStore(backupsDir);
  if (!sessionStore.hasBackup(account.id)) {
    throw new Error(`No RemoteAuth backup zip found for account ${account.id} in ${backupsDir}`);
  }

  const isolatedDataPath = path.join('/tmp', `wa-backfill-${account.id}-${Date.now()}`);
  fs.rmSync(isolatedDataPath, { recursive: true, force: true });
  fs.mkdirSync(isolatedDataPath, { recursive: true });

  const dedupeService = new FileBackedDedupeService(config.dedupeStorePath);
  const existingDedupeKeys = options.dryRun ? loadExistingDedupeKeys(config.dedupeStorePath) : null;
  const client = new Client({
    authStrategy: new SafeRemoteAuth({
      clientId: account.id,
      dataPath: isolatedDataPath,
      store: sessionStore,
      backupSyncIntervalMs: 5 * 60 * 1000,
    }),
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
    after: options.after?.toISOString() ?? null,
    dryRun: options.dryRun,
    isolatedDataPath,
    limitPerChat: options.limitPerChat,
    maxChats: options.maxChats,
  }, 'Starting one-off WhatsApp historical backfill');

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
    let skippedNonPdf = 0;
    let skippedNotCv = 0;

    for (const chat of candidateChats) {
      const messages = await (chat as any).fetchMessages({ limit: options.limitPerChat });

      for (const message of messages as any[]) {
        if (message.fromMe || !message.hasMedia) {
          continue;
        }

        if (options.after && Number(message.timestamp || 0) * 1000 < options.after.getTime()) {
          continue;
        }

        scannedMessages += 1;
        const messageKey = `message:${account.id}:${message.id._serialized}`;
        if (existingDedupeKeys?.has(messageKey)) {
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
          skippedNonPdf += 1;
          continue;
        }

        const detection = classifyMedia(media, message, config);
        if (detection.verdict === 'not_cv') {
          skippedNotCv += 1;
          continue;
        }

        matchedPdfMessages += 1;
        const fileHash = dedupeService.computeHash(media.data);
        const fileKey = `file:${message.from}:${fileHash}`;
        if (existingDedupeKeys?.has(fileKey)) {
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
          deliveredMessages += 1;
          continue;
        }

        const messageDecision = dedupeService.registerMessage({
          accountId: account.id,
          messageId: message.id._serialized,
          from: message.from,
        });
        if (!messageDecision.accepted) {
          skippedDuplicates += 1;
          continue;
        }

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

        await deliverToConfiguredDestination({
          config,
          logger,
          account,
          client,
          message,
          media,
          fileHash,
          fileSizeBytes: getBase64SizeBytes(media.data),
          detection,
        });
        deliveredMessages += 1;
      }
    }

    logger.info({
      accountId: account.id,
      dryRun: options.dryRun,
      scannedMessages,
      matchedPdfMessages,
      deliveredMessages,
      skippedDuplicates,
      skippedNonPdf,
      skippedNotCv,
      totalChats: chats.length,
      processedChats: candidateChats.length,
    }, 'One-off WhatsApp historical backfill completed');
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