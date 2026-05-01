/**
 * Money formatting + EUR conversion.
 *
 * `txToEUR` mirrors the logic in legacy `index.html` (CLAUDE.md §9):
 * prefer the per-tx `fx_rate` if set, else fall back to the budget's
 * current rate. Display-only — never use this for storage.
 */

import type { Transaction } from '@/lib/supabase/types';

interface FormatOptions {
  decimals?: number;
  compact?: boolean;
  noSymbol?: boolean;
}

function formatAmount(n: number, opts: FormatOptions = {}): string {
  if (!Number.isFinite(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const decimals = opts.decimals ?? 2;
  if (opts.compact && abs >= 1000) {
    const v =
      abs >= 1_000_000 ? `${(abs / 1_000_000).toFixed(1)}M` : `${(abs / 1000).toFixed(1)}k`;
    return `${sign}${v}`;
  }
  return `${sign}${abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function fmtEUR(n: number, opts: FormatOptions = {}): string {
  return `${opts.noSymbol ? '' : '€'}${formatAmount(n, opts)}`;
}

export function fmtUSD(n: number, opts: FormatOptions = {}): string {
  return `${opts.noSymbol ? '' : '$'}${formatAmount(n, opts)}`;
}

export function fmtCurrency(n: number, currency: string, opts: FormatOptions = {}): string {
  if (currency === 'EUR') return fmtEUR(n, opts);
  if (currency === 'USD') return fmtUSD(n, opts);
  return formatAmount(n, opts);
}

/**
 * Convert a transaction amount to EUR.
 * - EUR transactions: amount as-is.
 * - USD transactions: prefer per-tx `fx_rate` (historical, set on import or
 *   on creation), else fall back to `fallbackRate` (the budget's live rate).
 *
 * Mirrors legacy `txToEUR()` in index.html line 953.
 */
export function txToEUR(tx: Transaction, fallbackRate: number): number {
  if (tx.currency === 'EUR') return tx.amount;
  const rate = tx.fx_rate != null && Number.isFinite(tx.fx_rate) && tx.fx_rate > 0 ? tx.fx_rate : fallbackRate;
  return tx.amount * rate;
}

/**
 * Sign-aware amount for balance impact.
 * - Expense → debit (-amount)
 * - Income → credit (+amount)
 * - Adjustment → amount as-is (sign already encoded; CLAUDE.md §8a:
 *   imported expense-block adjustments are stored negative, income-block
 *   adjustments stored positive).
 */
export function signedAmount(tx: Pick<Transaction, 'type' | 'amount'>): number {
  if (tx.type === 'expense') return -tx.amount;
  if (tx.type === 'income') return tx.amount;
  return tx.amount; // adjustment
}
