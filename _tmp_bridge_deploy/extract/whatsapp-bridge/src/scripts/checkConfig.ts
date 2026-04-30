import fs from 'fs';
import { loadConfig } from '../config/config';

function main(): void {
  const config = loadConfig();

  const summary = {
    nodeEnv: config.nodeEnv,
    bridgeMode: config.bridgeMode,
    healthPort: config.healthPort,
    destinationWhatsAppId: config.destinationWhatsAppId,
    backendUploadUrl: config.backendUploadUrl,
    dedupeStorePath: config.dedupeStorePath,
    dedupeStoreExists: fs.existsSync(config.dedupeStorePath),
    accountControlPath: config.accountControlPath,
    accountControlExists: fs.existsSync(config.accountControlPath),
    maxFileSizeBytes: config.maxFileSizeBytes,
    allowedMimeTypes: config.allowedMimeTypes,
    autoReplyEnabled: config.autoReplyEnabled,
    accounts: config.accounts.map((account) => ({
      id: account.id,
      displayName: account.displayName,
      enabled: account.enabled,
      owner: account.owner ?? null,
      rolloutWave: account.rolloutWave ?? null,
      allowedSenderCount: account.allowedSenders?.length ?? 0,
      blockedSenderCount: account.blockedSenders?.length ?? 0,
    })),
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

main();