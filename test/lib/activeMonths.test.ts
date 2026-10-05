import { describe, it, expect } from 'vitest';
import { activeMonthCount, activeWorkingMonth, monthsWithActivity } from '@/lib/activeMonths';
import { ytdAverages } from '@/lib/balance';
import type { Transaction } from '@/lib/supabase/types';

function tx(date: string, type: Transaction['type'], amount: number): Transaction {
  return {
    id: date + type + amount,
    budget_id: 'b1',
    date,
    type,
    amount,
    currency: 'EUR',
    fx_rate: null,
    category: null,
    subcategory: null,
    trip: null,
    account_id: 'a1',
    comment: null,
    created_by: 'u1',
    created_at: '',
    updated_at: '',
  } as Transaction;
}

const DATA = [
  tx('2026-07-03', 'expense', 100),
  tx('2026-07-10', 'income', 1000),
  tx('2026-08-15', 'expense', 300),
  tx('2026-08-20', 'income', 1000),
  // September: only a transfer — doesn't count as data.
  tx('2026-09-02', 'adjustment', -50),
];

describe('activeMonths', () => {
  it('ignores adjustments when finding months with data', () => {
    expect([...monthsWithActivity(DATA)].sort()).toEqual(['2026-07', '2026-08']);
  });

  it('counts only months with data', () => {
    expect(activeMonthCount(monthsWithActivity(DATA), 2026, 8)).toBe(2);
  });

  it('steps the working month back past empty months', () => {
    // Early October: calendar working month is September, which has no data yet.
    expect(activeWorkingMonth(new Date(2026, 9, 5), monthsWithActivity(DATA))).toEqual({ year: 2026, month: 7 });
  });

  it('keeps the calendar working month when it has data', () => {
    expect(activeWorkingMonth(new Date(2026, 8, 5), monthsWithActivity(DATA))).toEqual({ year: 2026, month: 7 });
  });

  it('falls back to the calendar month with no data at all', () => {
    expect(activeWorkingMonth(new Date(2026, 9, 5), new Set())).toEqual({ year: 2026, month: 8 });
  });

  it('YTD averages divide by months with data, not calendar months', () => {
    const ytd = ytdAverages({ transactions: DATA, year: 2026, endMonth: 8, fxRate: 1 });
    expect(ytd.monthsElapsed).toBe(2);
    expect(ytd.avgExpense).toBe(200);
    expect(ytd.avgIncome).toBe(1000);
    expect(ytd.monthsRemaining).toBe(3);
  });
});
