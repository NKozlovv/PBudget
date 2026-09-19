'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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
