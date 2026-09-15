import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { UNCATEGORISED, isUncategorised } from '@/lib/transactions/constants';
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
  const matchUncategorised = filters.category === UNCATEGORISED;

  function baseQuery(withCount: boolean) {
    let query = supabase
      .from('transactions')
      .select('*', withCount ? { count: 'exact' } : undefined)
      .eq('budget_id', filters.budgetId);
    if (filters.type) query = query.eq('type', filters.type);
    // "Uncategorised" isn't just NULL here — some of this budget's data has
    // literal text like "Uncategorized" stored as a real category value
    // (carried over from the original spreadsheet). Matching that reliably
    // needs an OR across is-null and a couple of case variants, which isn't
    // something worth hand-building as a raw PostgREST filter string with
    // no live Postgres to test it against — instead this case skips the
    // SQL-level category filter entirely and is matched in JS below, after
    // fetching everything that matches the other filters.
    if (!matchUncategorised && filters.category) query = query.eq('category', filters.category);
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

  async function fetchAll(): Promise<Transaction[]> {
    // First page tells us the exact total (see the doc comment above), so
    // every remaining page's offset is already known — fire them all at
    // once instead of awaiting one page at a time. For a budget with
    // several thousand transactions this turns N sequential round trips
    // into 1, which was the single biggest latency cost on every page that
    // loads a full budget's history (i.e. nearly every page in the app).
    const first = await baseQuery(true).range(0, PAGE_SIZE - 1);
    if (first.error) throw first.error;
    const firstPage = (first.data ?? []) as Transaction[];
    const total = first.count;

    if (total == null) {
      // Defensive fallback: PostgREST didn't return a count even though
      // `{ count: 'exact' }` was requested. Rather than guess how many
      // more pages to fetch in parallel, fall back to the original
      // sequential loop that stops on a short page — see this file's top
      // comment on why silent under-fetching here is the one thing this
      // function must never risk.
      const all = [...firstPage];
      if (firstPage.length === PAGE_SIZE) {
        for (let offset = PAGE_SIZE; ; offset += PAGE_SIZE) {
          const { data, error } = await baseQuery(false).range(offset, offset + PAGE_SIZE - 1);
          if (error) throw error;
          const page = (data ?? []) as Transaction[];
          all.push(...page);
          if (page.length < PAGE_SIZE) break;
        }
      }
      return all;
    }

    if (firstPage.length >= total) return firstPage;

    const remainingOffsets: number[] = [];
    for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) remainingOffsets.push(offset);
    const rest = await Promise.all(
      remainingOffsets.map(async (offset) => {
        const { data, error } = await baseQuery(false).range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        return (data ?? []) as Transaction[];
      }),
    );
    return [firstPage, ...rest].flat();
  }

  if (matchUncategorised) {
    const filtered = (await fetchAll()).filter((t) => isUncategorised(t.category));
    if (filters.limit != null) {
      const offset = filters.offset ?? 0;
      return filtered.slice(offset, offset + filters.limit);
    }
    return filtered;
  }

  // Caller wants a specific page — respect it as-is (already bounded).
  if (filters.limit != null) {
    const offset = filters.offset ?? 0;
    const { data, error } = await baseQuery(false).range(offset, offset + filters.limit - 1);
    if (error) throw error;
    return (data ?? []) as Transaction[];
  }

  return fetchAll();
}

/**
 * Distinct YYYY-MM strings present in a budget's transactions, newest first.
 * Used to populate the month filter dropdown.
 */
export async function listMonthsWithTransactions(budgetId: string): Promise<string[]> {
  const supabase = await createClient();
  const seen = new Set<string>();

  function page(offset: number, withCount: boolean) {
    return supabase
      .from('transactions')
      .select('date', withCount ? { count: 'exact' } : undefined)
      .eq('budget_id', budgetId)
      .order('date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
  }
  function absorb(rows: Array<{ date: string }>) {
    for (const row of rows) {
      if (typeof row.date === 'string' && row.date.length >= 7) seen.add(row.date.slice(0, 7));
    }
  }

  const first = await page(0, true);
  if (first.error) throw first.error;
  const firstRows = (first.data ?? []) as Array<{ date: string }>;
  absorb(firstRows);
  const total = first.count;

  if (total == null) {
    // See listTransactions()'s fetchAll() for why an unexpectedly-missing
    // count falls back to a sequential, short-page-terminated loop instead
    // of guessing how many more pages to fetch in parallel.
    if (firstRows.length === PAGE_SIZE) {
      for (let offset = PAGE_SIZE; ; offset += PAGE_SIZE) {
        const { data, error } = await page(offset, false);
        if (error) throw error;
        const rows = (data ?? []) as Array<{ date: string }>;
        absorb(rows);
        if (rows.length < PAGE_SIZE) break;
      }
    }
    return [...seen];
  }

  if (firstRows.length < total) {
    const remainingOffsets: number[] = [];
    for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) remainingOffsets.push(offset);
    await Promise.all(
      remainingOffsets.map(async (offset) => {
        const { data, error } = await page(offset, false);
        if (error) throw error;
        absorb((data ?? []) as Array<{ date: string }>);
      }),
    );
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
  type Pair = { category: string | null; subcategory: string | null };

  function page(offset: number, withCount: boolean) {
    return supabase
      .from('transactions')
      .select('category, subcategory', withCount ? { count: 'exact' } : undefined)
      .eq('budget_id', budgetId)
      .not('subcategory', 'is', null)
      .range(offset, offset + PAGE_SIZE - 1);
  }

  const first = await page(0, true);
  if (first.error) throw first.error;
  const firstPage = (first.data ?? []) as Pair[];
  const total = first.count;

  if (total == null) {
    // See listTransactions()'s fetchAll() for why an unexpectedly-missing
    // count falls back to a sequential, short-page-terminated loop instead
    // of guessing how many more pages to fetch in parallel.
    const all = [...firstPage];
    if (firstPage.length === PAGE_SIZE) {
      for (let offset = PAGE_SIZE; ; offset += PAGE_SIZE) {
        const { data, error } = await page(offset, false);
        if (error) throw error;
        const rows = (data ?? []) as Pair[];
        all.push(...rows);
        if (rows.length < PAGE_SIZE) break;
      }
    }
    return all;
  }

  if (firstPage.length >= total) return firstPage;

  const remainingOffsets: number[] = [];
  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) remainingOffsets.push(offset);
  const rest = await Promise.all(
    remainingOffsets.map(async (offset) => {
      const { data, error } = await page(offset, false);
      if (error) throw error;
      return (data ?? []) as Pair[];
    }),
  );
  return [firstPage, ...rest].flat();
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
