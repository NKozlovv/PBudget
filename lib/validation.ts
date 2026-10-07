/**
 * Runtime input checks for server actions. A server action is a public POST
 * endpoint: the TypeScript types on its arguments are erased at the network
 * boundary, so anything a caller sends has to be re-validated here.
 */

import type { Currency, TxType } from '@/lib/supabase/types';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Largest magnitude accepted for any money amount (well inside numeric/float range). */
export const MAX_AMOUNT = 1e11;
/** Category / subcategory / trip / account / budget names. */
export const MAX_LABEL = 120;
/** Free-text transaction comment. */
export const MAX_COMMENT = 500;

/** Strict YYYY-MM-DD that is also a real calendar date (rejects 2026-02-31). */
export function isIsoDate(v: unknown): v is string {
  if (typeof v !== 'string' || !ISO_DATE.test(v)) return false;
  const y = Number(v.slice(0, 4));
  const m = Number(v.slice(5, 7));
  const d = Number(v.slice(8, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID.test(v);
}

export function isTxType(v: unknown): v is TxType {
  return v === 'expense' || v === 'income' || v === 'adjustment';
}

export function isCurrency(v: unknown): v is Currency {
  return v === 'EUR' || v === 'USD';
}

/** A finite number within ±MAX_AMOUNT. */
export function isMoney(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= MAX_AMOUNT;
}

/** A string no longer than `max`. */
export function isShortText(v: unknown, max: number): v is string {
  return typeof v === 'string' && v.length <= max;
}
