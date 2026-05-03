import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { BudgetInvite, BudgetMember } from '@/lib/supabase/types';

export async function listBudgetMembers(budgetId: string): Promise<BudgetMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budget_members')
    .select('*')
    .eq('budget_id', budgetId);
  if (error) throw error;
  return (data ?? []) as BudgetMember[];
}

export async function listBudgetInvites(budgetId: string): Promise<BudgetInvite[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budget_invites')
    .select('*')
    .eq('budget_id', budgetId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as BudgetInvite[];
}

/**
 * Returns the user_id of the budget's owner, if any. Used to gate the
 * UI (only owners see invite + revoke controls).
 */
export async function getBudgetOwnerId(budgetId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('budgets')
    .select('owner_id')
    .eq('id', budgetId)
    .maybeSingle();
  if (error) return null;
  return (data?.owner_id as string) ?? null;
}
