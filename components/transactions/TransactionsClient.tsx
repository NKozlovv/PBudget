'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/nav/PageHeader';
import { Icon } from '@/components/ui';
import { Filters, emptyTxFilters, type TxFilterValue } from './Filters';
import { StatStrip } from './StatStrip';
import { TransactionsTable } from './TransactionsTable';
import { AddTransactionButton } from './AddTransactionButton';
import { isUncategorised, UNCATEGORISED } from '@/lib/transactions/constants';
import { monthName } from '@/lib/date';
import type { Account, Category, Subcategory, Transaction } from '@/lib/supabase/types';

const PAGE_SIZE = 150;
const LOAD_MORE_STEP = 150;

function metaLine(months: Set<string>, count: number): string {
  const noun = count === 1 ? 'entry' : 'entries';
  if (months.size === 1) {
    const [ym] = [...months];
    const [yStr, mStr] = ym!.split('-');
    return `${count} ${noun} · ${monthName(Number(mStr) - 1)} ${yStr}`;
  }
  if (months.size > 1) return `${count} ${noun} · ${months.size} months`;
  return `${count} ${noun} · all time`;
}

/**
 * Owns filtering, sorting, and "load more" pagination entirely client-side
 * — the full transaction list for the budget is fetched once (server-side,
 * in the page component) and handed down here, so every filter/sort change
 * is a synchronous in-memory pass instead of a fresh server round trip.
 * With a budget's history running to a few thousand rows at most, filtering
 * that array is imperceptibly fast; the old URL-param-driven version paid
 * for a full Supabase re-fetch (accounts, categories, subcategories, the
 * whole transaction set again) on every single filter click, which is what
 * made filtering feel slow.
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
}) {
  const [filters, setFilters] = useState<TxFilterValue>(emptyTxFilters());
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

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const rows = allTransactions.filter((t) => {
      if (filters.types.size > 0 && !filters.types.has(t.type)) return false;
      if (filters.accounts.size > 0 && (!t.account_id || !filters.accounts.has(t.account_id))) {
        return false;
      }
      if (filters.categories.size > 0) {
        const matchesUncategorised = filters.categories.has(UNCATEGORISED) && isUncategorised(t.category);
        const matchesNamed = t.category != null && filters.categories.has(t.category);
        if (!matchesUncategorised && !matchesNamed) return false;
      }
      if (filters.subcategories.size > 0 && (!t.subcategory || !filters.subcategories.has(t.subcategory))) {
        return false;
      }
      if (filters.months.size > 0 && !filters.months.has(t.date.slice(0, 7))) return false;
      if (q && !(t.comment ?? '').toLowerCase().includes(q)) return false;
      return true;
    });

    const sign = filters.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      let cmp: number;
      if (filters.sort === 'amount') {
        cmp = a.amount - b.amount;
      } else {
        cmp = a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
        if (cmp === 0) cmp = a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0;
      }
      return cmp * sign;
    });
  }, [allTransactions, filters]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visible.length;

  return (
    <>
      <PageHeader
        kicker="Ledger"
        title="Transactions"
        meta={metaLine(filters.months, filtered.length)}
        actions={
          <>
            <Link
              href="/import"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-rule bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-hi transition-colors"
            >
              <Icon name="upload" size={13} className="text-ink-mute" />
              Import
            </Link>
            <AddTransactionButton />
          </>
        }
      />

      <div className="mt-6">
        <StatStrip transactions={filtered} budgetFxRate={budgetFxRate} />
      </div>

      <div className="mt-5">
        <Filters
          accounts={accounts}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          subcategories={subcategories}
          months={months}
          value={filters}
          onChange={updateFilters}
        />
      </div>

      <div className="mt-4">
        <TransactionsTable
          transactions={visible}
          accounts={accounts}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          subcategoriesByCategory={subcategoriesByCategory}
          mostUsedSubcategory={mostUsedSubcategory}
          budgetId={budgetId}
          budgetFxRate={budgetFxRate}
        />
      </div>

      {hasMore ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-[12px] text-ink-mute">
          <span>
            Showing {visible.length} of {filtered.length}
          </span>
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + LOAD_MORE_STEP)}
            className="rounded-[10px] border border-rule bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-hi transition-colors"
          >
            Load {Math.min(LOAD_MORE_STEP, filtered.length - visible.length)} more
          </button>
        </div>
      ) : null}
    </>
  );
}
