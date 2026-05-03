'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_BUDGET_COOKIE } from '@/lib/data/budgets';
import type { Currency } from '@/lib/supabase/types';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const COOKIE_OPTS = {
  httpOnly: false,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

function bumpAllPaths() {
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/accounts');
  revalidatePath('/categories');
  revalidatePath('/forecast');
  revalidatePath('/import');
}

export async function createBudgetAction(input: {
  name: string;
  base_currency: Currency;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Name is required.' };
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };
    const { data, error } = await supabase
      .from('budgets')
      .insert({
        name,
        owner_id: userData.user.id,
        fx_rate: 1.05,
        base_currency: input.base_currency,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    // Auto-switch to the new budget.
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BUDGET_COOKIE, data.id as string, COOKIE_OPTS);
    bumpAllPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function renameBudgetAction(input: {
  id: string;
  name: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Name is required.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('budgets').update({ name }).eq('id', input.id);
    if (error) return { ok: false, error: error.message };
    bumpAllPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/**
 * Delete a budget. Refuses if it's the user's only one (every user
 * needs at least one budget).
 *
 * If the deleted budget was the active one, clears the active-budget
 * cookie so the next request falls back to the first remaining budget.
 *
 * NOTE: this leans on Postgres FK cascade rules to clean up
 * dependent rows (accounts, categories, subcategories, transactions,
 * budget_members, budget_invites). If any of those FKs are restrict-on-delete
 * the user will see the underlying error message and can react.
 */
export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: budgets, error: listErr } = await supabase.from('budgets').select('id');
    if (listErr) return { ok: false, error: listErr.message };
    if (!budgets || budgets.length <= 1) {
      return {
        ok: false,
        error: 'Can\'t delete your only budget. Create another first.',
      };
    }

    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };

    const cookieStore = await cookies();
    const active = cookieStore.get(ACTIVE_BUDGET_COOKIE)?.value;
    if (active === id) cookieStore.delete(ACTIVE_BUDGET_COOKIE);
    bumpAllPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function setActiveBudgetAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    // RLS will refuse the select if the user isn't a member — use that
    // as the membership check.
    const { data, error } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: 'Not a member of that budget.' };

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BUDGET_COOKIE, id, COOKIE_OPTS);
    bumpAllPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
