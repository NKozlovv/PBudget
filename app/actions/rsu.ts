'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function addGrantAction(input: {
  budget_id: string;
  name: string;
  start_date: string;
  shares: number;
  months: number;
  every: number;
  cliff: number;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Give the grant a name.' };
  if (!DATE_RE.test(input.start_date)) return { ok: false, error: 'Pick the vesting start date.' };
  const shares = Math.floor(input.shares);
  if (!Number.isFinite(shares) || shares < 1) return { ok: false, error: 'Enter the total number of shares.' };
  if (!(input.months > 0) || !(input.every > 0)) return { ok: false, error: 'Invalid schedule.' };
  if (input.cliff < 0 || input.cliff >= input.months) {
    return { ok: false, error: 'Cliff must be shorter than the full duration.' };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('rsu_grants').insert({
      budget_id: input.budget_id,
      name,
      start_date: input.start_date,
      shares,
      months: input.months,
      every: input.every,
      cliff: input.cliff,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/rsu');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteGrantAction(input: { budget_id: string; id: string }): Promise<ActionResult> {
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
  if (!Number.isFinite(input.price) || input.price < 0) return { ok: false, error: 'Enter a valid price.' };
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
