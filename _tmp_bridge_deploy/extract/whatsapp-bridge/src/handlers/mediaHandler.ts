import type { Logger } from 'pino';
import type { Client, Message } from 'whatsapp-web.js';
import type { BridgeAccountConfig, BridgeConfig } from '../types';
import { classifyMedia } from './cvDetector';
import { retry } from '../utils/retry';
import { FileBackedDedupeService } from '../services/dedupeService';
import { DeliveryService } from '../services/deliveryService';

function getBase64SizeBytes(base64Data: string): number {
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  return Math.floor((base64Data.length * 3) / 4) - padding;
}

export class MediaHandler {
  constructor(
    private readonly config: BridgeConfig,
    private readonly dedupeService: FileBackedDedupeService,
    private readonly deliveryService: DeliveryService,
    private readonly logger: Logger,
  ) {}

  async handle(account: BridgeAccountConfig, client: Client, message: Message): Promise<void> {
    const messageDecision = this.dedupeService.registerMessage({
      accountId: account.id,
      messageId: message.id._serialized,
      from: message.from,
    });

    if (!messageDecision.accepted) {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, reason: messageDecision.reason }, 'Skipped duplicate message');
      return;
    }

    const media = await retry(3, async () => {
      const downloaded = await message.downloadMedia();
      if (!downloaded) {
        throw new Error('downloadMedia returned empty result');
      }
      return downloaded;
    });

    const fileSizeBytes = getBase64SizeBytes(media.data);
    if (fileSizeBytes > this.config.maxFileSizeBytes) {
      this.logger.warn({ accountId: account.id, messageId: message.id._serialized, fileSizeBytes }, 'Skipped media larger than configured limit');
      return;
    }

    const mimeType = String(media.mimetype ?? '').toLowerCase();
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, mimeType }, 'Skipped media with unsupported mime type');
      return;
    }

    const detection = classifyMedia(media, message, this.config);
    if (detection.verdict === 'not_cv') {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, reasons: detection.reasons }, 'Skipped media classified as not CV');
      return;
    }

    const fileHash = this.dedupeService.computeHash(media.data);
    const fileDecision = this.dedupeService.registerFile({
      accountId: account.id,
      messageId: message.id._serialized,
      from: message.from,
      fileHash,
    });

    if (!fileDecision.accepted) {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, fileHash, reason: fileDecision.reason }, 'Skipped duplicate file');
      return;
    }

    await this.deliveryService.deliver({
      account,
      client,
      message,
      media,
      fileHash,
      fileSizeBytes,
      detection,
    });

    if (this.config.autoReplyEnabled) {
      await message.reply(this.config.autoReplyMessage);
    }
  }
}