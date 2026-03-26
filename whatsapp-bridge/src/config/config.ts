import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';
import type { BridgeAccountConfig, BridgeConfig, BridgeMode } from '../types';

dotenv.config();

const defaultHealthPort = process.env.PORT ? Number(process.env.PORT) : 4310;

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  LOG_LEVEL: z.string().default('info'),
  HEALTH_PORT: z.coerce.number().int().positive().default(defaultHealthPort),
  BRIDGE_MODE: z.enum(['meta-forward', 'backend-upload']).default('meta-forward'),
  API_WHATSAPP_NUMBER: z.string().optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
  ALLOWED_TYPES: z.string().default('application/pdf'),
  AUTO_REPLY_ENABLED: z
    .string()
    .default('false')
    .transform((value) => value.toLowerCase() === 'true'),
  AUTO_REPLY_MESSAGE: z.string().default('Your CV has been received. Thank you.'),
  DEDUP_STORE_PATH: z.string().default('./data/dedupe-store.json'),
  ACCOUNT_CONTROL_PATH: z.string().default('./data/account-controls.json'),
  BACKEND_UPLOAD_URL: z.string().optional(),
  BACKEND_UPLOAD_TOKEN: z.string().optional(),
  BRIDGE_ACCOUNTS_PATH: z.string().optional(),
  BRIDGE_ACCOUNTS: z.string().optional(),
});

function parseAccounts(raw: string): BridgeAccountConfig[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('BRIDGE_ACCOUNTS must be a JSON array');
  }

  return parsed.map((item, index) => {
    const candidate = item as Partial<BridgeAccountConfig>;
    if (!candidate.id || !candidate.displayName) {
      throw new Error(`BRIDGE_ACCOUNTS[${index}] must include id and displayName`);
    }

    return {
      id: String(candidate.id),
      displayName: String(candidate.displayName),
      enabled: candidate.enabled !== false,
      owner: candidate.owner ? String(candidate.owner) : undefined,
      rolloutWave: candidate.rolloutWave ? String(candidate.rolloutWave) : undefined,
      notes: candidate.notes ? String(candidate.notes) : undefined,
      allowedSenders: Array.isArray(candidate.allowedSenders)
        ? candidate.allowedSenders.map((value) => String(value))
        : undefined,
      blockedSenders: Array.isArray(candidate.blockedSenders)
        ? candidate.blockedSenders.map((value) => String(value))
        : undefined,
    };
  });
}

function loadAccounts(env: z.infer<typeof envSchema>): BridgeAccountConfig[] {
  if (env.BRIDGE_ACCOUNTS_PATH) {
    const configPath = path.isAbsolute(env.BRIDGE_ACCOUNTS_PATH)
      ? env.BRIDGE_ACCOUNTS_PATH
      : path.resolve(process.cwd(), env.BRIDGE_ACCOUNTS_PATH);
    const raw = fs.readFileSync(configPath, 'utf8');
    return parseAccounts(raw);
  }

  if (env.BRIDGE_ACCOUNTS) {
    return parseAccounts(env.BRIDGE_ACCOUNTS);
  }

  throw new Error('Either BRIDGE_ACCOUNTS_PATH or BRIDGE_ACCOUNTS must be configured');
}

function resolveStorePath(storePath: string): string {
  return path.isAbsolute(storePath) ? storePath : path.resolve(process.cwd(), storePath);
}

function ensureParentDirectory(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function loadConfig(): BridgeConfig {
  const env = envSchema.parse(process.env);
  const accounts = loadAccounts(env);
  const bridgeMode = env.BRIDGE_MODE as BridgeMode;
  const dedupeStorePath = resolveStorePath(env.DEDUP_STORE_PATH);
  const accountControlPath = resolveStorePath(env.ACCOUNT_CONTROL_PATH);

  ensureParentDirectory(dedupeStorePath);
  ensureParentDirectory(accountControlPath);

  if (bridgeMode === 'meta-forward' && !env.API_WHATSAPP_NUMBER) {
    throw new Error('API_WHATSAPP_NUMBER is required when BRIDGE_MODE=meta-forward');
  }

  if (bridgeMode === 'backend-upload' && !env.BACKEND_UPLOAD_URL) {
    throw new Error('BACKEND_UPLOAD_URL is required when BRIDGE_MODE=backend-upload');
  }

  return {
    nodeEnv: env.NODE_ENV,
    logLevel: env.LOG_LEVEL,
    healthPort: env.HEALTH_PORT,
    bridgeMode,
    destinationWhatsAppId: env.API_WHATSAPP_NUMBER ?? null,
    maxFileSizeBytes: Math.round(env.MAX_FILE_SIZE_MB * 1024 * 1024),
    allowedMimeTypes: env.ALLOWED_TYPES.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean),
    autoReplyEnabled: env.AUTO_REPLY_ENABLED,
    autoReplyMessage: env.AUTO_REPLY_MESSAGE,
    dedupeStorePath,
    accountControlPath,
    backendUploadUrl: env.BACKEND_UPLOAD_URL ?? null,
    backendUploadToken: env.BACKEND_UPLOAD_TOKEN ?? null,
    accounts,
  };
}