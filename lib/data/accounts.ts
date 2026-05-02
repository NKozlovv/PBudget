import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Account } from '@/lib/supabase/types';

export async function listAccounts(budgetId: string): Promise<Account[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('budget_id', budgetId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Account[];
}
