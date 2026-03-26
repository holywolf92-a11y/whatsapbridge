import fs from 'fs';
import crypto from 'crypto';
import type { DedupeDecision, DedupeRecord } from '../types';

interface DedupeStoreShape {
  records: DedupeRecord[];
}

export class FileBackedDedupeService {
  private readonly records = new Map<string, DedupeRecord>();

  constructor(private readonly storePath: string) {
    this.load();
  }

  computeHash(base64Data: string): string {
    return crypto.createHash('sha256').update(Buffer.from(base64Data, 'base64')).digest('hex');
  }

  registerMessage(params: {
    accountId: string;
    messageId: string;
    from: string;
  }): DedupeDecision {
    const key = this.buildMessageKey(params.accountId, params.messageId);
    if (this.records.has(key)) {
      return { accepted: false, reason: 'duplicate_message_id' };
    }

    this.records.set(key, {
      key,
      createdAt: new Date().toISOString(),
      accountId: params.accountId,
      messageId: params.messageId,
      from: params.from,
    });
    this.persist();

    return { accepted: true, reason: 'new_message_id' };
  }

  registerFile(params: {
    accountId: string;
    messageId: string;
    from: string;
    fileHash: string;
  }): DedupeDecision {
    const key = this.buildFileKey(params.from, params.fileHash);
    if (this.records.has(key)) {
      return { accepted: false, reason: 'duplicate_file_hash' };
    }

    this.records.set(key, {
      key,
      createdAt: new Date().toISOString(),
      accountId: params.accountId,
      messageId: params.messageId,
      from: params.from,
      fileHash: params.fileHash,
    });
    this.persist();

    return { accepted: true, reason: 'new_file_hash' };
  }

  stats() {
    return { totalRecords: this.records.size };
  }

  private buildMessageKey(accountId: string, messageId: string): string {
    return `message:${accountId}:${messageId}`;
  }

  private buildFileKey(from: string, fileHash: string): string {
    return `file:${from}:${fileHash}`;
  }

  private load(): void {
    if (!fs.existsSync(this.storePath)) {
      return;
    }

    const parsed = JSON.parse(fs.readFileSync(this.storePath, 'utf8')) as DedupeStoreShape;
    for (const record of parsed.records ?? []) {
      this.records.set(record.key, record);
    }
  }

  private persist(): void {
    const payload: DedupeStoreShape = { records: Array.from(this.records.values()) };
    fs.writeFileSync(this.storePath, JSON.stringify(payload, null, 2));
  }
}