import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/nav/PageHeader';
import { Icon } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import {
  listCategorySubcategoryPairs,
  listMonthsWithTransactions,
  listTransactions,
} from '@/lib/data/transactions';
import { Filters } from '@/components/transactions/Filters';
import { StatStrip } from '@/components/transactions/StatStrip';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton';
import { monthName, monthOfDate, yearOfDate } from '@/lib/date';
import {
  mostUsedSubcategoryByCategory,
  subcategoriesByCategoryName,
} from '@/lib/categories/formOptions';
import type { TxType, Subcategory } from '@/lib/supabase/types';
import type { TxSortField } from '@/lib/data/transactions';

export const metadata = { title: 'Transactions · Theus' };

interface SearchParams {
  type?: string;
  category?: string;
  subcategory?: string;
  account?: string;
  month?: string;
  q?: string;
  sort?: string;
  dir?: string;
  limit?: string;
}

const DEFAULT_PAGE_SIZE = 150;
const LOAD_MORE_STEP = 150;
const MAX_LIMIT = 5000;

function parseLimit(raw: string | undefined): number {
  const n = raw ? Number(raw) : DEFAULT_PAGE_SIZE;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(n), MAX_LIMIT);
}

function parseType(value: string | undefined): TxType | undefined {
  return value === 'expense' || value === 'income' || value === 'adjustment' ? value : undefined;
}

const SORT_FIELDS: TxSortField[] = ['date', 'amount', 'type', 'category', 'comment'];

function parseSort(value: string | undefined): TxSortField | undefined {
  return value && (SORT_FIELDS as string[]).includes(value)
    ? (value as TxSortField)
    : undefined;
}

function parseDir(value: string | undefined): 'asc' | 'desc' | undefined {
  return value === 'asc' || value === 'desc' ? value : undefined;
}

function metaLine(month: string | undefined, count: number): string {
  const noun = count === 1 ? 'entry' : 'entries';
  if (month) {
    const yr = yearOfDate(`${month}-01`);
    const mo = monthOfDate(`${month}-01`);
    return `${count} ${noun} · ${monthName(mo)} ${yr}`;
  }
  return `${count} ${noun} · all time`;
}

/** Builds a `Load N more` href that bumps `limit` while keeping every other filter param. */
function loadMoreHref(sp: SearchParams, nextLimit: number): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === 'limit' || !v) continue;
    params.set(k, v);
  }
  params.set('limit', String(nextLimit));
  return `/transactions?${params.toString()}`;
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const budget = await getOrCreateUserBudget();
  const limit = parseLimit(sp.limit);
  const [accounts, expenseCats, incomeCats, subcategories, months, filteredTransactions, subPairs] =
    await Promise.all([
      listAccounts(budget.id),
      listCategories(budget.id, 'expense'),
      listCategories(budget.id, 'income'),
      listSubcategoriesForBudget(budget.id),
      listMonthsWithTransactions(budget.id),
      // Unlimited — the stat strip needs true totals for the full filtered
      // set, not just the page being rendered. Only the *rendered* rows are
      // capped (below), which is what was actually making the list heavy.
      listTransactions({
        budgetId: budget.id,
        type: parseType(sp.type),
        accountId: sp.account || undefined,
        category: sp.category || undefined,
        subcategory: sp.subcategory || undefined,
        month: sp.month || undefined,
        search: sp.q || undefined,
        sortBy: parseSort(sp.sort),
        sortDir: parseDir(sp.dir),
      }),
      listCategorySubcategoryPairs(budget.id),
    ]);

  const totalCount = filteredTransactions.length;
  const transactions = filteredTransactions.slice(0, limit);
  const hasMore = totalCount > transactions.length;

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of subcategories) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }
  const subcategoriesByCategory = subcategoriesByCategoryName(
    [...expenseCats, ...incomeCats],
    subcategoriesById,
  );
  const mostUsedSubcategory = mostUsedSubcategoryByCategory(subPairs);

  return (
    <>
      <PageHeader
        kicker="Ledger"
        title="Transactions"
        meta={metaLine(sp.month, totalCount)}
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
        <StatStrip transactions={filteredTransactions} budgetFxRate={budget.fx_rate} />
      </div>

      <div className="mt-5">
        <Suspense fallback={null}>
          <Filters
            accounts={accounts}
            expenseCats={expenseCats}
            incomeCats={incomeCats}
            subcategories={subcategories}
            months={months}
          />
        </Suspense>
      </div>

      <div className="mt-4">
        <TransactionsTable
          transactions={transactions}
          accounts={accounts}
          expenseCats={expenseCats}
          incomeCats={incomeCats}
          subcategoriesByCategory={subcategoriesByCategory}
          mostUsedSubcategory={mostUsedSubcategory}
          budgetId={budget.id}
          budgetFxRate={budget.fx_rate}
        />
      </div>

      {hasMore ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-[12px] text-ink-mute">
          <span>
            Showing {transactions.length} of {totalCount}
          </span>
          <Link
            href={loadMoreHref(sp, limit + LOAD_MORE_STEP)}
            className="rounded-[10px] border border-rule bg-surface px-3.5 py-2 text-[13px] font-medium text-ink hover:bg-surface-hi transition-colors"
          >
            Load {Math.min(LOAD_MORE_STEP, totalCount - transactions.length)} more
          </Link>
        </div>
      ) : null}
    </>
  );
}
