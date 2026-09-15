import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { UNCATEGORISED } from '@/lib/transactions/constants';
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

/**
 * PostgREST caps any single unbounded `select()` at a server-side default
 * (`db-max-rows`, 1000 unless the Supabase project changed it) — a request
 * for "all rows" that exceeds it comes back **truncated with no error**,
 * ordered by whatever `.order()` was applied. For a budget with >1000
 * transactions this was silently dropping the oldest ones (order is date
 * desc) from every aggregate in the app — account balances, dashboard
 * totals, category/forecast/trends history.
 *
 * Every "give me everything" call below now pages through explicitly, using
 * an exact row count fetched on the first page so the loop stops when it
 * has actually collected that many rows — not when "a page came back
 * shorter than asked for", which would itself be silently wrong if this
 * Supabase project's real per-request cap is below PAGE_SIZE (a short page
 * would then look identical to "no more data" and under-fetch again).
 */
const PAGE_SIZE = 1000;

export async function listTransactions(filters: ListTxFilters): Promise<Transaction[]> {
  const supabase = await createClient();

  function baseQuery(withCount: boolean) {
    let query = supabase
      .from('transactions')
      .select('*', withCount ? { count: 'exact' } : undefined)
      .eq('budget_id', filters.budgetId);
    if (filters.type) query = query.eq('type', filters.type);
    // Both import and manual entry normalize a blank category to NULL
    // (never ''), so a plain IS NULL check is all that's needed here —
    // simpler and safer than a hand-built .or() filter string.
    if (filters.category === UNCATEGORISED) query = query.is('category', null);
    else if (filters.category) query = query.eq('category', filters.category);
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
    return query;
  }

  // Caller wants a specific page — respect it as-is (already bounded).
  if (filters.limit != null) {
    const offset = filters.offset ?? 0;
    const { data, error } = await baseQuery(false).range(offset, offset + filters.limit - 1);
    if (error) throw error;
    return (data ?? []) as Transaction[];
  }

  // Caller wants everything — page through explicitly.
  const all: Transaction[] = [];
  let total: number | null = null;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error, count } = await baseQuery(offset === 0).range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Transaction[];
    all.push(...page);
    if (offset === 0) total = count ?? null;
    if (total != null ? all.length >= total : page.length < PAGE_SIZE) break;
  }
  return all;
}

/**
 * Distinct YYYY-MM strings present in a budget's transactions, newest first.
 * Used to populate the month filter dropdown.
 */
export async function listMonthsWithTransactions(budgetId: string): Promise<string[]> {
  const supabase = await createClient();
  const seen = new Set<string>();
  let total: number | null = null;
  let collected = 0;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('date', offset === 0 ? { count: 'exact' } : undefined)
      .eq('budget_id', budgetId)
      .order('date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ date: string }>;
    for (const row of page) {
      if (typeof row.date === 'string' && row.date.length >= 7) seen.add(row.date.slice(0, 7));
    }
    collected += page.length;
    if (offset === 0) total = count ?? null;
    if (total != null ? collected >= total : page.length < PAGE_SIZE) break;
  }
  return [...seen];
}

/**
 * Lightweight (category, subcategory) projection over every transaction in
 * the budget — used to compute "most-used subcategory per category" for the
 * Add-transaction form without pulling full transaction rows.
 */
export async function listCategorySubcategoryPairs(
  budgetId: string,
): Promise<Array<{ category: string | null; subcategory: string | null }>> {
  const supabase = await createClient();
  const all: Array<{ category: string | null; subcategory: string | null }> = [];
  let total: number | null = null;
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error, count } = await supabase
      .from('transactions')
      .select('category, subcategory', offset === 0 ? { count: 'exact' } : undefined)
      .eq('budget_id', budgetId)
      .not('subcategory', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    const page = (data ?? []) as Array<{ category: string | null; subcategory: string | null }>;
    all.push(...page);
    if (offset === 0) total = count ?? null;
    if (total != null ? all.length >= total : page.length < PAGE_SIZE) break;
  }
  return all;
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
