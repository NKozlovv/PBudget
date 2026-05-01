import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Budget } from '@/lib/supabase/types';

const DEFAULT_FX_RATE = 1.05;
const DEFAULT_BUDGET_NAME = 'My Budget';

/** All budgets the signed-in user is a member of. */
export async function listBudgets(): Promise<Budget[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Budget[];
}

/**
 * Returns the user's first budget, creating a default one if they have none.
 * Mirrors `ensureBudget()` from legacy index.html line 4416.
 */
export async function getOrCreateUserBudget(): Promise<Budget> {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error('Not authenticated');
  }
  const userId = userData.user.id;

  const existing = await listBudgets();
  const first = existing[0];
  if (first) return first;

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
  // The trg_add_owner_as_member trigger inserts the membership row.
  return data as Budget;
}

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
