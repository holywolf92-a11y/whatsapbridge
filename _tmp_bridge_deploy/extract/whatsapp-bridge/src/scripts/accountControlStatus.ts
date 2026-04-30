import { loadConfig } from '../config/config';
import { AccountControlService } from '../services/accountControlService';

function main(): void {
  const config = loadConfig();
  const service = new AccountControlService(config.accountControlPath);
  const state = service.getState();

  const summary = config.accounts.map((account) => ({
    id: account.id,
    displayName: account.displayName,
    owner: account.owner ?? null,
    rolloutWave: account.rolloutWave ?? null,
    enabled: account.enabled,
    paused: state.pausedAccountIds.includes(account.id),
  }));

  process.stdout.write(`${JSON.stringify({ controlPath: config.accountControlPath, updatedAt: state.updatedAt, accounts: summary }, null, 2)}\n`);
}

main();