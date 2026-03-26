import type { Logger } from 'pino';
import type { Client, Message } from 'whatsapp-web.js';
import type { BridgeAccountConfig } from '../types';
import { MediaHandler } from './mediaHandler';

export class MessageHandler {
  constructor(
    private readonly mediaHandler: MediaHandler,
    private readonly logger: Logger,
  ) {}

  async handle(account: BridgeAccountConfig, client: Client, message: Message): Promise<void> {
    if (message.fromMe) {
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