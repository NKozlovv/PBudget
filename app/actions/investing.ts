'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { SavedPlan } from '@/lib/data/investing';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function addLotAction(input: {
  budget_id: string;
  type: 'buy' | 'open';
  date: string;
  shares: number;
  price: number;
  fee: number;
}): Promise<ActionResult> {
  if (!(input.shares > 0)) return { ok: false, error: 'Enter how many shares.' };
  if (!(input.price > 0)) {
    return {
      ok: false,
      error: input.type === 'open' ? 'Enter your average price per share.' : 'Enter the price you paid per share.',
    };
  }
  if (!Number.isFinite(input.fee) || input.fee < 0) return { ok: false, error: 'Fees can’t be negative.' };
  if (!DATE_RE.test(input.date) || input.date > todayISO()) return { ok: false, error: 'Date can’t be in the future.' };

  try {
    const supabase = await createClient();
    if (input.type === 'open') {
      const { count, error: cErr } = await supabase
        .from('investment_lots')
        .select('id', { count: 'exact', head: true })
        .eq('budget_id', input.budget_id)
        .eq('type', 'open');
      if (cErr) return { ok: false, error: cErr.message };
      if ((count ?? 0) > 0) {
        return { ok: false, error: 'You already have an opening position. Remove it in History to replace it.' };
      }
    }
    const { error } = await supabase.from('investment_lots').insert({
      budget_id: input.budget_id,
      type: input.type,
      date: input.date,
      shares: input.shares,
      price: input.price,
      fee: input.fee,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath('/investing');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function updateLotAction(input: {
  budget_id: string;
  id: string;
  date: string;
  shares: number;
  price: number;
  fee: number;
}): Promise<ActionResult> {
  if (!(input.shares > 0)) return { ok: false, error: 'Enter how many shares.' };
  if (!(input.price > 0)) return { ok: false, error: 'Enter the price per share.' };
  if (!Number.isFinite(input.fee) || input.fee < 0) return { ok: false, error: 'Fees can’t be negative.' };
  if (!DATE_RE.test(input.date) || input.date > todayISO()) return { ok: false, error: 'Date can’t be in the future.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('investment_lots')
      .update({ date: input.date, shares: input.shares, price: input.price, fee: input.fee })
      .eq('budget_id', input.budget_id)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/investing');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteLotAction(input: { budget_id: string; id: string }): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('investment_lots')
      .delete()
      .eq('budget_id', input.budget_id)
      .eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath('/investing');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function savePlanAction(input: { budget_id: string; plan: SavedPlan }): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('investment_plans')
      .upsert(
        { budget_id: input.budget_id, plan: input.plan, updated_at: new Date().toISOString() },
        { onConflict: 'budget_id' },
      );
    if (error) return { ok: false, error: error.message };
    // No revalidatePath: the client already holds this state, and a refresh
    // on every slider tick would refetch the price history for nothing.
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
