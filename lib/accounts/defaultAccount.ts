import type { Account } from '@/lib/supabase/types';

/**
 * Default account for the Add-transaction form: the EUR "Cash" account,
 * per user preference (most day-to-day entries are cash spend). Falls
 * back to the first account (existing `listAccounts` ordering) when no
 * such account exists.
 */
export function pickDefaultAccount(accounts: Account[]): Account | undefined {
  if (accounts.length === 0) return undefined;
  const cashEur = accounts.find((a) => a.currency === 'EUR' && /cash/i.test(a.name));
  return cashEur ?? accounts[0];
}
