'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getHistoricalRate } from '@/lib/fx';
import { TRAVEL_CATEGORY, enforceTripRule } from '@/lib/transactions/constants';
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

function bumpPaths() {
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

export async function createTransactionAction(input: TxInput): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...enforceTripRule(input),
        fx_rate: input.currency === 'USD' ? (input.fx_rate ?? (await getHistoricalRate(input.date))) : null,
        created_by: userData.user.id,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
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
 * optional fee expense — same shape the legacy app wrote, so balances pick
 * it up with no special-casing and it never counts as income/spend.
 */
export async function createTransferAction(input: TransferInput): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };
    if (input.from_account_id === input.to_account_id) {
      return { ok: false, error: 'Pick two different accounts.' };
    }
    const amount = Math.abs(input.amount);
    if (!Number.isFinite(amount) || amount === 0) return { ok: false, error: 'Amount must be non-zero.' };

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
    if (!rate || !Number.isFinite(rate) || rate <= 0) return { ok: false, error: 'Enter an exchange rate.' };
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
    const rows = [
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
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function updateTransactionAction(
  id: string,
  patch: Partial<Omit<TxInput, 'budget_id'>>,
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').update(enforceTripRule(patch)).eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function bulkDeleteTransactionsAction(ids: string[]): Promise<ActionResult> {
  if (ids.length === 0) return { ok: true, data: undefined };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('transactions').delete().in('id', ids);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function bulkUpdateTransactionsAction(
  ids: string[],
  patch: Partial<Omit<TxInput, 'budget_id'>>,
): Promise<ActionResult> {
  if (ids.length === 0) return { ok: true, data: undefined };
  try {
    const supabase = await createClient();
    const finalPatch = enforceTripRule(patch);
    let query = supabase.from('transactions').update(finalPatch).in('id', ids);
    // Setting `trip` without also setting `category` (bulk "tag with a
    // trip" on transactions that are already Travel) is the one case
    // enforceTripRule can't cover — it only fires when `category` itself is
    // part of the patch. Scope the update to Travel rows in that case, so
    // any non-Travel row among `ids` (a stale selection, say) is simply
    // left untouched by this update rather than mistagged.
    if ('trip' in finalPatch && !('category' in finalPatch)) {
      query = query.eq('category', TRAVEL_CATEGORY);
    }
    const { error } = await query;
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
