'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getHistoricalRate } from '@/lib/fx';
import { TRAVEL_CATEGORY, enforceTripRule } from '@/lib/transactions/constants';
import {
  MAX_COMMENT,
  MAX_LABEL,
  isCurrency,
  isIsoDate,
  isMoney,
  isShortText,
  isTxType,
  isUuid,
} from '@/lib/validation';
import type { Currency, TxType } from '@/lib/supabase/types';

export interface TxInput {
  budget_id: string;
  date: string;
  type: TxType;
  amount: number;
  currency: Currency;
  account_id: string | null;
  category: string | null;
  subcategory: string | null;
  trip: string | null;
  comment: string | null;
  /** USD→EUR rate on `date`. Filled in server-side for USD rows when omitted. */
  fx_rate?: number | null;
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

type TxPatch = Partial<Omit<TxInput, 'budget_id'>>;
type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Rows per `.in('id', …)` request — keeps the PostgREST URL well under proxy limits. */
const BULK_CHUNK = 100;

function bumpPaths() {
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

/**
 * Copies only the known transaction columns out of a client-supplied object
 * and validates each one that is present. The `patch` a caller sends goes
 * straight into `.update()` / `.insert()`, so anything not allow-listed here
 * (`budget_id`, `created_by`, `id`, …) must never get through.
 */
function sanitizeTxPatch(raw: unknown): { ok: true; value: TxPatch } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Invalid transaction.' };
  const r = raw as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(r, k);
  const out: Record<string, unknown> = {};

  if (has('date')) {
    if (!isIsoDate(r.date)) return { ok: false, error: 'Invalid date.' };
    out.date = r.date;
  }
  if (has('type')) {
    if (!isTxType(r.type)) return { ok: false, error: 'Invalid type.' };
    out.type = r.type;
  }
  if (has('amount')) {
    if (!isMoney(r.amount)) return { ok: false, error: 'Invalid amount.' };
    out.amount = r.amount;
  }
  if (has('currency')) {
    if (!isCurrency(r.currency)) return { ok: false, error: 'Invalid currency.' };
    out.currency = r.currency;
  }
  if (has('account_id')) {
    if (r.account_id !== null && !isUuid(r.account_id)) return { ok: false, error: 'Invalid account.' };
    out.account_id = r.account_id;
  }
  for (const key of ['category', 'subcategory', 'trip'] as const) {
    if (!has(key)) continue;
    const v = r[key];
    if (v !== null && !isShortText(v, MAX_LABEL)) return { ok: false, error: `Invalid ${key}.` };
    out[key] = v;
  }
  if (has('comment')) {
    if (r.comment !== null && !isShortText(r.comment, MAX_COMMENT)) return { ok: false, error: 'Comment is too long.' };
    out.comment = r.comment;
  }
  if (has('fx_rate')) {
    const v = r.fx_rate;
    if (v !== null && !(typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 1e6)) {
      return { ok: false, error: 'Invalid exchange rate.' };
    }
    out.fx_rate = v;
  }
  return { ok: true, value: out as TxPatch };
}

/**
 * RLS only checks that the caller belongs to the row's budget — it does not
 * stop a row in budget A from pointing at an account in budget B when the
 * caller is a member of both. Re-attaching a transaction to another budget's
 * account would silently skew both budgets' balances.
 */
async function accountMatchesTransactions(supabase: Supabase, accountId: string, txIds: string[]): Promise<boolean> {
  const { data: acc } = await supabase.from('accounts').select('budget_id').eq('id', accountId).maybeSingle();
  if (!acc) return false;
  for (let i = 0; i < txIds.length; i += BULK_CHUNK) {
    const { count, error } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .in('id', txIds.slice(i, i + BULK_CHUNK))
      .neq('budget_id', acc.budget_id as string);
    if (error || (count ?? 0) > 0) return false;
  }
  return true;
}

function failure(err: unknown): { ok: false; error: string } {
  return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
}

export async function createTransactionAction(input: TxInput): Promise<ActionResult<{ id: string }>> {
  try {
    if (!isUuid(input?.budget_id)) return { ok: false, error: 'Invalid budget.' };
    const clean = sanitizeTxPatch(input);
    if (!clean.ok) return clean;
    const tx = clean.value;
    if (!tx.date || !tx.type || tx.amount === undefined || !tx.currency) {
      return { ok: false, error: 'Date, type, amount and currency are required.' };
    }

    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    if (tx.account_id) {
      const { data: acc } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', tx.account_id)
        .eq('budget_id', input.budget_id)
        .maybeSingle();
      if (!acc) return { ok: false, error: 'Account not found in this budget.' };
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...enforceTripRule(tx),
        budget_id: input.budget_id,
        fx_rate: tx.currency === 'USD' ? (tx.fx_rate ?? (await getHistoricalRate(tx.date))) : null,
        created_by: userData.user.id,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return failure(err);
  }
}

export interface TransferInput {
  budget_id: string;
  date: string;
  from_account_id: string;
  to_account_id: string;
  /** Positive amount leaving the from-account, in its own currency. */
  amount: number;
  /** Units of the to-account's currency per 1 of the from-account's. Only used across currencies. */
  rate: number | null;
  /** Optional fee, in the to-account's currency, booked as an expense under Bills → Fees. */
  fee: number | null;
  comment: string | null;
}

/**
 * A transfer is two `adjustment` rows (debit from, credit to) plus an
 * optional fee expense, so balances pick
 * it up with no special-casing and it never counts as income/spend.
 */
export async function createTransferAction(input: TransferInput): Promise<ActionResult> {
  try {
    if (!isUuid(input?.budget_id) || !isUuid(input.from_account_id) || !isUuid(input.to_account_id)) {
      return { ok: false, error: 'Invalid account.' };
    }
    if (!isIsoDate(input.date)) return { ok: false, error: 'Invalid date.' };
    if (input.comment !== null && !isShortText(input.comment, MAX_COMMENT)) {
      return { ok: false, error: 'Comment is too long.' };
    }
    if (input.fee !== null && !isMoney(input.fee)) return { ok: false, error: 'Invalid fee.' };

    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };
    if (input.from_account_id === input.to_account_id) {
      return { ok: false, error: 'Pick two different accounts.' };
    }
    if (!isMoney(input.amount)) return { ok: false, error: 'Invalid amount.' };
    const amount = Math.abs(input.amount);
    if (amount === 0) return { ok: false, error: 'Amount must be non-zero.' };

    const { data: accs, error: accErr } = await supabase
      .from('accounts')
      .select('id, name, currency')
      .eq('budget_id', input.budget_id)
      .in('id', [input.from_account_id, input.to_account_id]);
    if (accErr) return { ok: false, error: accErr.message };
    const from = accs?.find((a) => a.id === input.from_account_id);
    const to = accs?.find((a) => a.id === input.to_account_id);
    if (!from || !to) return { ok: false, error: 'Account not found.' };

    const crossCurrency = from.currency !== to.currency;
    const rate = crossCurrency ? input.rate : 1;
    if (!rate || !Number.isFinite(rate) || rate <= 0 || rate > 1e6) return { ok: false, error: 'Enter an exchange rate.' };
    const toAmount = Math.round(amount * rate * 100) / 100;

    // Keep the pair's fx_rates consistent with the user's own rate rather
    // than fetching a market rate for each leg.
    let fxFrom: number | null = null;
    let fxTo: number | null = null;
    if (from.currency === 'USD' && to.currency === 'EUR') fxFrom = rate;
    else if (from.currency === 'EUR' && to.currency === 'USD') fxTo = 1 / rate;
    else {
      if (from.currency === 'USD') fxFrom = await getHistoricalRate(input.date);
      if (to.currency === 'USD') fxTo = await getHistoricalRate(input.date);
    }

    const label = input.comment?.trim() || `${from.name} → ${to.name}`;
    const base = { budget_id: input.budget_id, date: input.date, trip: null, created_by: userData.user.id };
    const rows: Array<Record<string, string | number | null>> = [
      { ...base, type: 'adjustment', amount: -amount, currency: from.currency, fx_rate: fxFrom, category: 'Adjustment', subcategory: null, account_id: from.id, comment: label },
      { ...base, type: 'adjustment', amount: toAmount, currency: to.currency, fx_rate: fxTo, category: 'Adjustment', subcategory: null, account_id: to.id, comment: label },
    ];
    if (input.fee && input.fee > 0) {
      rows.push({
        ...base, type: 'expense', amount: input.fee, currency: to.currency,
        fx_rate: to.currency === 'USD' ? (fxTo ?? (await getHistoricalRate(input.date))) : null,
        category: 'Bills', subcategory: 'Fees', account_id: to.id, comment: `${label} — fee`,
      });
    }
    const { error } = await supabase.from('transactions').insert(rows);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    revalidatePath('/accounts');
    return { ok: true, data: undefined };
  } catch (err) {
    return failure(err);
  }
}

export async function updateTransactionAction(id: string, patch: TxPatch): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, error: 'Invalid transaction.' };
    const clean = sanitizeTxPatch(patch);
    if (!clean.ok) return clean;

    const supabase = await createClient();
    if (clean.value.account_id && !(await accountMatchesTransactions(supabase, clean.value.account_id, [id]))) {
      return { ok: false, error: 'Account not found in this budget.' };
    }
    const { error } = await supabase.from('transactions').update(enforceTripRule(clean.value)).eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return failure(err);
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, error: 'Invalid transaction.' };
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return failure(err);
  }
}

export async function bulkDeleteTransactionsAction(ids: string[]): Promise<ActionResult> {
  if (!Array.isArray(ids) || !ids.every(isUuid)) return { ok: false, error: 'Invalid selection.' };
  if (ids.length === 0) return { ok: true, data: undefined };
  try {
    const supabase = await createClient();
    for (let i = 0; i < ids.length; i += BULK_CHUNK) {
      const { error } = await supabase.from('transactions').delete().in('id', ids.slice(i, i + BULK_CHUNK));
      if (error) return { ok: false, error: error.message };
    }
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return failure(err);
  }
}

export async function bulkUpdateTransactionsAction(ids: string[], patch: TxPatch): Promise<ActionResult> {
  if (!Array.isArray(ids) || !ids.every(isUuid)) return { ok: false, error: 'Invalid selection.' };
  if (ids.length === 0) return { ok: true, data: undefined };
  const clean = sanitizeTxPatch(patch);
  if (!clean.ok) return clean;
  try {
    const supabase = await createClient();
    if (clean.value.account_id && !(await accountMatchesTransactions(supabase, clean.value.account_id, ids))) {
      return { ok: false, error: 'Account not found in this budget.' };
    }
    const finalPatch = enforceTripRule(clean.value);
    // Setting `trip` without also setting `category` (bulk "tag with a
    // trip" on transactions that are already Travel) is the one case
    // enforceTripRule can't cover — it only fires when `category` itself is
    // part of the patch. Scope the update to Travel rows in that case, so
    // any non-Travel row among `ids` (a stale selection, say) is simply
    // left untouched by this update rather than mistagged.
    const travelOnly = 'trip' in finalPatch && !('category' in finalPatch);
    for (let i = 0; i < ids.length; i += BULK_CHUNK) {
      let query = supabase.from('transactions').update(finalPatch).in('id', ids.slice(i, i + BULK_CHUNK));
      if (travelOnly) query = query.eq('category', TRAVEL_CATEGORY);
      const { error } = await query;
      if (error) return { ok: false, error: error.message };
    }
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return failure(err);
  }
}
