import type { Logger } from 'pino';
import type { Client, Message } from 'whatsapp-web.js';
import type { BridgeAccountConfig } from '../types';
import { MediaHandler } from './mediaHandler';

function isInboxChatId(chatId: string | undefined): boolean {
  const normalized = String(chatId || '').trim().toLowerCase();
  if (!normalized) return false;

  if (normalized.endsWith('@broadcast')) return false;
  if (normalized.endsWith('@g.us')) return false;
  if (normalized.endsWith('@newsletter')) return false;

  return true;
}

export class MessageHandler {
  constructor(
    private readonly mediaHandler: MediaHandler,
    private readonly logger: Logger,
  ) {}

  async handle(account: BridgeAccountConfig, client: Client, message: Message): Promise<void> {
    if (message.fromMe) {
      return;
    }

    if (!isInboxChatId(message.from)) {
      // Keep at debug level — non-inbox messages (groups, broadcasts) are very
      // frequent and logging them at info floods the container at scale.
      this.logger.debug({
        accountId: account.id,
        messageId: message.id._serialized,
        from: message.from,
      }, 'Skipped non-inbox WhatsApp message');
      return;
    }

    if (Array.isArray(account.blockedSenders) && account.blockedSenders.includes(message.from)) {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, from: message.from }, 'Skipped blocked sender');
      return;
    }

    if (Array.isArray(account.allowedSenders) && account.allowedSenders.length > 0 && !account.allowedSenders.includes(message.from)) {
      this.logger.info({ accountId: account.id, messageId: message.id._serialized, from: message.from }, 'Skipped sender outside pilot allowlist');
      return;
    }

    if (!message.hasMedia) {
      return;
    }

    this.logger.info({ accountId: account.id, messageId: message.id._serialized, from: message.from }, 'Processing inbound media message');

    await this.mediaHandler.handle(account, client, message);
  }
}