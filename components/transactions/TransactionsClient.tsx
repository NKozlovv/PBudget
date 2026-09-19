'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/nav/PageHeader';
import { Filters, emptyTxFilters, type TxFilterValue } from './Filters';
import { StatStrip } from './StatStrip';
import { TransactionsTable } from './TransactionsTable';
import { AddTransactionButton } from './AddTransactionButton';
import { UNCATEGORISED, isUncategorised } from '@/lib/transactions/constants';
import type { Account, Category, Subcategory, Transaction } from '@/lib/supabase/types';

const PAGE_SIZE = 150;
const LOAD_MORE_STEP = 150;

/**
 * Owns filtering, sorting, and "load more" pagination entirely client-side
 * — the full transaction list for the budget is fetched once (server-side,
 * in the page component) and handed down here, so every filter change is a
 * synchronous in-memory pass instead of a fresh server round trip.
 */
export function TransactionsClient({
  allTransactions,
  accounts,
  expenseCats,
  incomeCats,
  subcategories,
  subcategoriesByCategory,
  mostUsedSubcategory,
  budgetId,
  budgetFxRate,
  periodLabel,
}: {
  allTransactions: Transaction[];
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategories: Subcategory[];
  subcategoriesByCategory: Record<string, string[]>;
  mostUsedSubcategory: Record<string, string>;
  budgetId: string;
  budgetFxRate: number;
  /** e.g. "August 2026" — the last completed month, for the header subtitle. */
  periodLabel: string;
}) {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TxFilterValue>(() => {
    const initial = emptyTxFilters();
    const account = searchParams.get('account');
    if (account) initial.account = account;
    return initial;
  });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  function updateFilters(next: TxFilterValue) {
    setFilters(next);
    setVisibleCount(PAGE_SIZE);
  }

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTransactions) {
      if (typeof t.date === 'string' && t.date.length >= 7) set.add(t.date.slice(0, 7));
    }
    return [...set].sort().reverse();
  }, [allTransactions]);

  // The full transaction list is already in the browser (see this
  // component's own doc comment), so distinct trip names for the Trip
  // field's autocomplete come from it directly — no extra query needed.
  const existingTrips = useMemo(() => {
    const set = new Set<string>();
    for (const t of allTransactions) {
      const trip = (t.trip ?? '').trim();
      if (trip) set.add(trip);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allTransactions]);

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const rows = allTransactions.filter((t) => {
      if (filters.type !== 'All' && t.type !== filters.type) return false;
      if (filters.account !== 'All' && t.account_id !== filters.account) return false;
      if (filters.category !== 'All') {
        const matchesUncategorised = filters.category === UNCATEGORISED && isUncategorised(t.category);
        const matchesNamed = t.category === filters.category;
        if (!matchesUncategorised && !matchesNamed) return false;
      }
      if (filters.subcategory !== 'All' && t.subcategory !== filters.subcategory) return false;
      if (filters.month !== 'All' && t.date.slice(0, 7) !== filters.month) return false;
      if (q && !(t.comment ?? '').toLowerCase().includes(q)) return false;
      return true;
    });

    return [...rows].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.created_at < b.created_at ? 1 : -1;
    });
  }, [allTransactions, filters]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  return (
    <>
      <PageHeader
        title="Transactions"
        meta={`${filtered.length} record${filtered.length === 1 ? '' : 's'} · ${periodLabel}`}
        actions={<AddTransactionButton />}
      />

      <StatStrip transactions={filtered} budgetFxRate={budgetFxRate} />

      <Filters
        accounts={accounts}
        expenseCats={expenseCats}
        incomeCats={incomeCats}
        subcategories={subcategories}
        months={months}
        value={filters}
        onChange={updateFilters}
        shown={filtered.length}
        total={allTransactions.length}
      />

      <TransactionsTable
        transactions={visible}
        accounts={accounts}
        expenseCats={expenseCats}
        incomeCats={incomeCats}
        subcategoriesByCategory={subcategoriesByCategory}
        mostUsedSubcategory={mostUsedSubcategory}
        existingTrips={existingTrips}
        budgetId={budgetId}
        budgetFxRate={budgetFxRate}
      />

      {hasMore ? (
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
            className="rounded-full border border-white/90 bg-white/[0.72] px-[18px] py-[10px] text-[13px] font-semibold text-ink backdrop-blur-xl transition-colors duration-200 hover:bg-white"
          >
            Load {Math.min(LOAD_MORE_STEP, filtered.length - visible.length)} more
          </button>
        </div>
      ) : null}
    </>
  );
}
