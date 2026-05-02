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
  subcategory?: string;
  /** YYYY-MM — translates to a date range filter. */
  month?: string;
  /** ILIKE substring match on the comment column. */
  search?: string;
  /** Column to sort by. Defaults to date (then created_at). */
  sortBy?: TxSortField;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  /** Page offset (0-indexed). */
  offset?: number;
}

export type TxSortField = 'date' | 'amount' | 'type' | 'category' | 'comment';

export async function listTransactions(filters: ListTxFilters): Promise<Transaction[]> {
  const supabase = await createClient();
  let query = supabase.from('transactions').select('*').eq('budget_id', filters.budgetId);

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.subcategory) query = query.eq('subcategory', filters.subcategory);
  if (filters.accountId) query = query.eq('account_id', filters.accountId);
  if (filters.fromDate) query = query.gte('date', filters.fromDate);
  if (filters.toDate) query = query.lte('date', filters.toDate);
  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    const [yStr, mStr] = filters.month.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const start = `${filters.month}-01`;
    // Day 0 of next month = last day of current month.
    const last = new Date(y, m, 0);
    const end = `${y}-${String(m).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
    query = query.gte('date', start).lte('date', end);
  }
  if (filters.search && filters.search.trim()) {
    const escaped = filters.search.trim().replace(/[%_]/g, (c) => `\\${c}`);
    query = query.ilike('comment', `%${escaped}%`);
  }

  const sortBy = filters.sortBy ?? 'date';
  const ascending = (filters.sortDir ?? 'desc') === 'asc';
  query = query.order(sortBy, { ascending });
  if (sortBy !== 'date') query = query.order('date', { ascending: false });
  query = query.order('created_at', { ascending: false });

  if (filters.limit != null) {
    const offset = filters.offset ?? 0;
    query = query.range(offset, offset + filters.limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Transaction[];
}

/**
 * Distinct YYYY-MM strings present in a budget's transactions, newest first.
 * Used to populate the month filter dropdown.
 */
export async function listMonthsWithTransactions(budgetId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('transactions')
    .select('date')
    .eq('budget_id', budgetId)
    .order('date', { ascending: false });
  if (error) throw error;
  const seen = new Set<string>();
  for (const row of data ?? []) {
    const d = (row as { date: string }).date;
    if (typeof d === 'string' && d.length >= 7) seen.add(d.slice(0, 7));
  }
  return [...seen];
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
