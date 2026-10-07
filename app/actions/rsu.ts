'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_LABEL, isIsoDate, isMoney, isShortText, isUuid } from '@/lib/validation';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

type GrantInput = {
  budget_id: string;
  name: string;
  start_date: string;
  shares: number;
  months: number;
  every: number;
  cliff: number;
  grant_price: number | null;
};

/** Shared by add and update. Returns the cleaned row or an error message. */
type CleanGrant =
  | { ok: true; row: Omit<GrantInput, "budget_id"> }
  | { ok: false; error: string };

function cleanGrant(input: GrantInput): CleanGrant {
  if (!isUuid(input.budget_id)) return { ok: false, error: 'Invalid budget.' };
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) return { ok: false, error: 'Give the grant a name.' };
  if (!isShortText(name, MAX_LABEL)) return { ok: false, error: 'Grant name is too long.' };
  if (!isIsoDate(input.start_date)) return { ok: false, error: 'Pick the vesting start date.' };
  const shares = Math.floor(input.shares);
  if (!Number.isFinite(shares) || shares < 1 || shares > 1e9) return { ok: false, error: 'Enter the total number of shares.' };
  // The vest schedule is expanded in a loop (lib/rsu/calc.ts), so these must stay small: an
  // unbounded `months` would hang the page for every member of the budget.
  if (!Number.isInteger(input.months) || !Number.isInteger(input.every) || !Number.isInteger(input.cliff)) {
    return { ok: false, error: 'Invalid schedule.' };
  }
  if (input.months < 1 || input.months > 600 || input.every < 1 || input.every > input.months) {
    return { ok: false, error: 'Invalid schedule.' };
  }
  if (input.cliff < 0 || input.cliff >= input.months) {
    return { ok: false, error: 'Cliff must be shorter than the full duration.' };
  }
  if (input.grant_price != null && (!isMoney(input.grant_price) || input.grant_price < 0)) {
    return { ok: false, error: 'Enter a valid price at grant.' };
  }
  return {
    ok: true,
    row: {
      name,
      start_date: input.start_date,
      shares,
      months: input.months,
      every: input.every,
      cliff: input.cliff,
      grant_price: input.grant_price,
    },
  };
}

export async function addGrantAction(input: GrantInput): Promise<ActionResult> {
  const c = cleanGrant(input);
  if (!c.ok) return { ok: false, error: c.error };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('rsu_grants').insert({ budget_id: input.budget_id, ...c.row });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/rsu');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function updateGrantAction(input: GrantInput & { id: string }): Promise<ActionResult> {
  if (!isUuid(input.id)) return { ok: false, error: 'Invalid grant.' };
  const c = cleanGrant(input);
  if (!c.ok) return { ok: false, error: c.error };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('rsu_grants')
      .update(c.row)
      .eq('budget_id', input.budget_id)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/rsu');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteGrantAction(input: { budget_id: string; id: string }): Promise<ActionResult> {
  if (!isUuid(input.budget_id) || !isUuid(input.id)) return { ok: false, error: 'Invalid grant.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('rsu_grants')
      .delete()
      .eq('budget_id', input.budget_id)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/rsu');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function setSharePriceAction(input: { budget_id: string; price: number }): Promise<ActionResult> {
  if (!isUuid(input.budget_id)) return { ok: false, error: 'Invalid budget.' };
  if (!isMoney(input.price) || input.price < 0) return { ok: false, error: 'Enter a valid price.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('rsu_settings')
      .upsert(
        { budget_id: input.budget_id, share_price: input.price, updated_at: new Date().toISOString() },
        { onConflict: 'budget_id' },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath('/rsu');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
