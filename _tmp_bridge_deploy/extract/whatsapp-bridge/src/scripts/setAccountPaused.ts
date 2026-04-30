import { loadConfig } from '../config/config';
import { AccountControlService } from '../services/accountControlService';

function main(): void {
  const action = process.argv[2];
  const accountId = process.argv[3];

  if ((action !== 'pause' && action !== 'resume') || !accountId) {
    process.stderr.write('Usage: npm run account:pause -- <accountId>\n');
    process.stderr.write('   or: npm run account:resume -- <accountId>\n');
    process.exit(1);
  }

  const config = loadConfig();
  const exists = config.accounts.some((account) => account.id === accountId);
  if (!exists) {
    process.stderr.write(`Unknown account id: ${accountId}\n`);
    process.exit(1);
  }

  const service = new AccountControlService(config.accountControlPath);
  const state = service.setPaused(accountId, action === 'pause');
  process.stdout.write(`${JSON.stringify({ action, accountId, state }, null, 2)}\n`);
}

main();