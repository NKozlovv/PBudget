import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Transaction, TxType } from '@/lib/supabase/types';

export interface ListTxFilters {
  budgetId: string;
  type?: TxType;
  category?: string;
  accountId?: string;
  /** Inclusive YYYY-MM-DD lower bound. */
  fromDate?: string;
  /** Inclusive YYYY-MM-DD upper bound. */
  toDate?: string;
  limit?: number;
  /** Page offset (0-indexed). */
  offset?: number;
}

export async function listTransactions(filters: ListTxFilters): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase.from('transactions').select('*').eq('budget_id', filters.budgetId);

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.accountId) query = query.eq('account_id', filters.accountId);
  if (filters.fromDate) query = query.gte('date', filters.fromDate);
  if (filters.toDate) query = query.lte('date', filters.toDate);

  query = query.order('date', { ascending: false }).order('created_at', { ascending: false });

  if (filters.limit != null) {
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

export async function countTransactions(budgetId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('budget_id', budgetId);
  if (error) throw error;
  return count ?? 0;
}
