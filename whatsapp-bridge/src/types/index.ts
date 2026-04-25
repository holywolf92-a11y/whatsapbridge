import type { Client, Message, MessageMedia } from 'whatsapp-web.js';

export type BridgeMode = 'meta-forward' | 'backend-upload';
export type SessionStatus = 'idle' | 'needs_qr' | 'connecting' | 'connected' | 'degraded' | 'paused';
export type DetectionVerdict = 'likely_cv' | 'possible_cv' | 'not_cv';

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
  client: Client;
  message: Message;
  media: MessageMedia;
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
  client: Client;
  status: SessionStatus;
  lastEventAt: string | null;
  lastError: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  pairingCodeGeneratedAt: string | null;
}