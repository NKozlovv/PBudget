import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { createClient, getAuthUser } from '@/lib/supabase/server';
import type { Budget } from '@/lib/supabase/types';

const DEFAULT_FX_RATE = 1.05;
const DEFAULT_BUDGET_NAME = 'My Budget';
export const ACTIVE_BUDGET_COOKIE = 'theus.active-budget';

/**
 * All budgets the signed-in user is a member of, oldest first. Cached
 * per-request (`cache()`) — the `(app)` layout and most pages under it
 * each call this (directly, or via `getOrCreateUserBudget()` below), and
 * without memoization that was a fresh query per call site on every
 * navigation for an answer that can't change mid-request.
 */
export const listBudgets = cache(async (): Promise<Budget[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Budget[];
});

/**
 * Returns the user's active budget. Resolution:
 *   1. Cookie `theus.active-budget` — if its id resolves to a budget the
 *      user can read (RLS-gated), use it.
 *   2. Else fall back to the first budget the user is a member of.
 *   3. Else create a default "My Budget" and use that.
 *
 * Replaces the legacy single-budget `ensureBudget()` once Chunk 12 lands.
 * The function name is preserved for backwards compatibility with the
 * many callers across `app/(app)/*`.
 *
 * Cached per-request (`cache()`) — nearly every page calls this itself
 * *in addition to* the `(app)` layout already resolving it for the
 * sidebar, so without memoization every navigation paid for it twice
 * (each a `getUser()` round trip plus a `listBudgets()` query).
 */
export const getOrCreateUserBudget = cache(async (): Promise<Budget> => {
  const supabase = await createClient();
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Not authenticated');
  }
  const userId = user.id;

  const all = await listBudgets();

  // 1. Cookie hit
  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_BUDGET_COOKIE)?.value;
  if (activeId) {
    const found = all.find((b) => b.id === activeId);
    if (found) return found;
  }

  // 2. Fall back to first
  if (all.length > 0) {
    return all[0]!;
  }

  // 3. Bootstrap a default
  const { data, error } = await supabase
    .from('budgets')
    .insert({
      name: DEFAULT_BUDGET_NAME,
      owner_id: userId,
      fx_rate: DEFAULT_FX_RATE,
      base_currency: 'EUR',
    })
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
});

export async function updateBudget(
  id: string,
  patch: Partial<Pick<Budget, 'name' | 'fx_rate' | 'base_currency'>>,
): Promise<Budget> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Budget;
}
