import { accountBalanceEURAt, accountBalanceNativeAt } from '@/lib/balance';
import { dateToISO, eomDateStr, monthName } from '@/lib/date';
import type { Account, Transaction } from '@/lib/supabase/types';

export interface AccountSparkPoint {
  /** Short-month label e.g. `MAY` (uppercase). */
  label: string;
  /** Native-currency balance at month-end. */
  native: number;
  /** EUR-equivalent balance at month-end. */
  eur: number;
}

export interface AccountSummary {
  account: Account;
  /** Native current balance (account currency). */
  native: number;
  /** EUR-equivalent current balance. */
  eur: number;
  /** Native MTD delta (current minus balance at end of previous month). */
  deltaNative: number;
  /** EUR MTD delta (current EUR − previous month-end EUR). */
  deltaEUR: number;
  /** Last `count` month-end points, ending with the current month. */
  spark: AccountSparkPoint[];
}

/**
 * Per-account summary used by the Accounts page cards: native &
 * EUR balances now, MTD delta in both, and a `count`-month sparkline
 * series. `now` lets the caller control the "today" reference for
 * timezone-safe behavior.
 */
export function accountsSummary(args: {
  accounts: Account[];
  transactions: Transaction[];
  fxRate: number;
  now: Date;
  count: number;
}): AccountSummary[] {
  const { accounts, transactions, fxRate, now, count } = args;
  const today = dateToISO(now);
  const year = now.getFullYear();
  const month = now.getMonth();

  // End-of-previous-month for MTD delta baseline.
  const prevEom =
    month === 0 ? eomDateStr(year - 1, 11) : eomDateStr(year, month - 1);

  return accounts.map((account) => {
    const nativeNow = accountBalanceNativeAt({
      accountId: account.id,
      date: today,
      openingBalance: account.opening_balance,
      transactions,
    });
    const eurNow = accountBalanceEURAt({
      account,
      date: today,
      transactions,
      fxRate,
    });
    const nativePrev = accountBalanceNativeAt({
      accountId: account.id,
      date: prevEom,
      openingBalance: account.opening_balance,
      transactions,
    });
    const eurPrev = accountBalanceEURAt({
      account,
      date: prevEom,
      transactions,
      fxRate,
    });

    const spark: AccountSparkPoint[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const targetMonth = month - i;
      const eomDate = new Date(year, targetMonth + 1, 0);
      const iso = dateToISO(eomDate);
      const native = accountBalanceNativeAt({
        accountId: account.id,
        date: iso,
        openingBalance: account.opening_balance,
        transactions,
      });
      const eur = accountBalanceEURAt({
        account,
        date: iso,
        transactions,
        fxRate,
      });
      spark.push({
        label: monthName(eomDate.getMonth(), true).toUpperCase(),
        native,
        eur,
      });
    }

    return {
      account,
      native: nativeNow,
      eur: eurNow,
      deltaNative: nativeNow - nativePrev,
      deltaEUR: eurNow - eurPrev,
      spark,
    };
  });
}
