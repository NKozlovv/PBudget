import { dateToISO, dayOfDate, monthOfDate, monthName, yearOfDate } from '@/lib/date';
import { signedAmount, txToEUR } from '@/lib/money';
import type { Transaction } from '@/lib/supabase/types';

export interface TxDayGroup {
  date: string;
  label: string;
  totalEUR: number;
  items: Transaction[];
}

/**
 * Group transactions by date in their existing order. Caller is
 * responsible for sorting first. Each group's totalEUR is the signed
 * sum (income +, expense −, adjustment as-stored) in budget currency.
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  budgetFxRate: number,
  now: Date,
): TxDayGroup[] {
  const today = dateToISO(now);
  const yesterday = dateToISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const todayYear = yearOfDate(today);

  const groups: TxDayGroup[] = [];
  let current: TxDayGroup | null = null;

  for (const tx of transactions) {
    if (!current || current.date !== tx.date) {
      current = {
        date: tx.date,
        label: dayLabel(tx.date, today, yesterday, todayYear),
        totalEUR: 0,
        items: [],
      };
      groups.push(current);
    }
    current.items.push(tx);
    current.totalEUR += signedAmount({ type: tx.type, amount: txToEUR(tx, budgetFxRate) });
  }
  return groups;
}

function dayLabel(iso: string, today: string, yesterday: string, todayYear: number): string {
  if (iso === today) return `Today · ${dayOfDate(iso)} ${monthName(monthOfDate(iso), true)}`;
  if (iso === yesterday)
    return `Yesterday · ${dayOfDate(iso)} ${monthName(monthOfDate(iso), true)}`;
  const y = yearOfDate(iso);
  return `${dayOfDate(iso)} ${monthName(monthOfDate(iso), true)}${y !== todayYear ? ` ${y}` : ''}`;
}
