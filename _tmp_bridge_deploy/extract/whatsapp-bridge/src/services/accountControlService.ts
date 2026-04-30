import fs from 'fs';

interface AccountControlState {
  pausedAccountIds: string[];
  updatedAt: string | null;
}

const DEFAULT_STATE: AccountControlState = {
  pausedAccountIds: [],
  updatedAt: null,
};

export class AccountControlService {
  constructor(private readonly controlPath: string) {}

  isPaused(accountId: string): boolean {
    return this.readState().pausedAccountIds.includes(accountId);
  }

  getState(): AccountControlState {
    return this.readState();
  }

  setPaused(accountId: string, paused: boolean): AccountControlState {
    const state = this.readState();
    const pausedSet = new Set(state.pausedAccountIds);

    if (paused) {
      pausedSet.add(accountId);
    } else {
      pausedSet.delete(accountId);
    }

    const nextState: AccountControlState = {
      pausedAccountIds: Array.from(pausedSet).sort(),
      updatedAt: new Date().toISOString(),
    };

    this.writeState(nextState);
    return nextState;
  }

  private readState(): AccountControlState {
    if (!fs.existsSync(this.controlPath)) {
      return DEFAULT_STATE;
    }

    const raw = fs.readFileSync(this.controlPath, 'utf8').trim();
    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<AccountControlState>;
    return {
      pausedAccountIds: Array.isArray(parsed.pausedAccountIds)
        ? parsed.pausedAccountIds.map((value) => String(value))
        : [],
      updatedAt: parsed.updatedAt ? String(parsed.updatedAt) : null,
    };
  }

  private writeState(state: AccountControlState): void {
    fs.writeFileSync(this.controlPath, JSON.stringify(state, null, 2));
  }
}