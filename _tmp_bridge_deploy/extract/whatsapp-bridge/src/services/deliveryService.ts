import type { Logger } from 'pino';
import type { BridgeConfig, DeliveryPayload, DeliveryResult } from '../types';

export class DeliveryService {
  constructor(
    private readonly config: BridgeConfig,
    private readonly logger: Logger,
  ) {}

  async deliver(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (this.config.bridgeMode === 'meta-forward') {
      return this.forwardToWhatsApp(payload);
    }

    return this.uploadToBackend(payload);
  }

  private async forwardToWhatsApp(payload: DeliveryPayload): Promise<DeliveryResult> {
    const destination = this.config.destinationWhatsAppId;
    if (!destination) {
      throw new Error('Destination WhatsApp ID is not configured');
    }

    const originalTimestamp = payload.message.timestamp
      ? new Date(payload.message.timestamp * 1000).toISOString()
      : new Date().toISOString();
    const caption = [
      '[FALISHA_BRIDGE]',
      `bridge_account=${payload.account.id}`,
      `bridge_label=${payload.account.displayName}`,
      `original_sender=${payload.message.from ?? 'unknown'}`,
      `original_message_id=${payload.message.id._serialized}`,
      `original_timestamp=${originalTimestamp}`,
      `detection=${payload.detection.verdict}`,
      `file_hash=${payload.fileHash}`,
      `backfill=${payload.backfill === true ? 'true' : 'false'}`,
    ].join('\n');

    const result = await payload.client.sendMessage(destination, payload.media, { caption });

    this.logger.info({
      mode: 'meta-forward',
      destination,
      sourceMessageId: payload.message.id._serialized,
      outboundMessageId: result.id._serialized,
    }, 'Delivered media to Meta destination');

    return {
      mode: 'meta-forward',
      externalId: result.id._serialized,
    };
  }

  private async uploadToBackend(payload: DeliveryPayload): Promise<DeliveryResult> {
    if (!this.config.backendUploadUrl) {
      throw new Error('Backend upload URL is not configured');
    }

    const binary = Buffer.from(payload.media.data, 'base64');
    const form = new FormData();
    form.append('file', new Blob([binary], { type: payload.media.mimetype }), payload.media.filename ?? 'upload.bin');
    form.append('bridgeAccountId', payload.account.id);
    form.append('bridgeAccountName', payload.account.displayName);
    form.append('originalSenderPhone', payload.message.from ?? 'unknown');
    form.append('originalMessageId', payload.message.id._serialized);
    form.append('originalTimestamp', new Date(payload.message.timestamp * 1000).toISOString());
    form.append('fileHash', payload.fileHash);
    form.append('fileSizeBytes', String(payload.fileSizeBytes));
    form.append('mimeType', payload.media.mimetype);
    form.append('fileName', payload.media.filename ?? 'upload.bin');
    form.append('detectionVerdict', payload.detection.verdict);
    form.append('backfill', payload.backfill === true ? 'true' : 'false');

    const response = await fetch(this.config.backendUploadUrl, {
      method: 'POST',
      headers: this.config.backendUploadToken
        ? { Authorization: `Bearer ${this.config.backendUploadToken}` }
        : undefined,
      body: form,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Backend upload failed with ${response.status}: ${body}`);
    }

    const json = (await response.json()) as { id?: string };
    this.logger.info({
      mode: 'backend-upload',
      sourceMessageId: payload.message.id._serialized,
      responseId: json.id ?? null,
    }, 'Uploaded media to backend');

    return {
      mode: 'backend-upload',
      externalId: json.id ?? null,
    };
  }
}