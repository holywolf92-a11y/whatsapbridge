export type BridgeMode = 'meta-forward' | 'backend-upload';
export type SessionStatus = 'idle' | 'needs_qr' | 'connecting' | 'connected' | 'degraded' | 'paused';
export type DetectionVerdict = 'likely_cv' | 'possible_cv' | 'not_cv';

/**
 * Transport-agnostic media object. Produced by the session transport
 * (Baileys) and consumed by the CV detector / delivery service. The shape
 * intentionally mirrors the subset of whatsapp-web.js's MessageMedia that the
 * handlers used, so the proven detection/delivery logic stays unchanged.
 */
export interface BridgeMedia {
  data: string; // base64-encoded bytes
  mimetype: string;
  filename?: string;
}

/**
 * Transport-agnostic inbound message. The transport layer adapts a raw
 * Baileys message into this shape; handlers depend only on these fields.
 */
export interface BridgeInboundMessage {
  id: { _serialized: string };
  from: string;
  body: string;
  fromMe: boolean;
  hasMedia: boolean;
  timestamp: number; // unix seconds
  downloadMedia(): Promise<BridgeMedia | null>;
  reply(text: string): Promise<unknown>;
}

/**
 * Transport-agnostic outbound client. Only sendMessage (used by the
 * meta-forward delivery path) is required by the handlers.
 */
export interface BridgeClient {
  sendMessage(
    chatId: string,
    content: BridgeMedia,
    options?: { caption?: string },
  ): Promise<{ id: { _serialized: string } }>;
}

export interface BridgeAccountConfig {
  id: string;
  displayName: string;
  enabled: boolean;
  owner?: string;
  rolloutWave?: string;
  notes?: string;
  allowedSenders?: string[];
  blockedSenders?: string[];
}

export interface BridgeConfig {
  nodeEnv: string;
  logLevel: string;
  healthPort: number;
  sessionDataPath: string;
  bridgeMode: BridgeMode;
  destinationWhatsAppId: string | null;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  dedupeStorePath: string;
  accountControlPath: string;
  backendUploadUrl: string | null;
  backendUploadToken: string | null;
  accounts: BridgeAccountConfig[];
}

export interface DetectionResult {
  verdict: DetectionVerdict;
  reasons: string[];
  normalizedFileName: string;
  mimeType: string;
}

export interface DeliveryPayload {
  account: BridgeAccountConfig;
  client: BridgeClient;
  message: BridgeInboundMessage;
  media: BridgeMedia;
  fileHash: string;
  fileSizeBytes: number;
  detection: DetectionResult;
  backfill?: boolean;
}

export interface DeliveryResult {
  mode: BridgeMode;
  externalId: string | null;
}

export interface DedupeDecision {
  accepted: boolean;
  reason: string;
}

export interface DedupeRecord {
  key: string;
  createdAt: string;
  accountId: string;
  messageId: string;
  from: string;
  fileHash?: string;
}

export interface ManagedSession {
  account: BridgeAccountConfig;
  client: BridgeClient;
  status: SessionStatus;
  lastEventAt: string | null;
  lastError: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  pairingCodeGeneratedAt: string | null;
}
