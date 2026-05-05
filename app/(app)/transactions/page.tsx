import { Suspense } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/nav/PageHeader';
import { Icon } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listMonthsWithTransactions, listTransactions } from '@/lib/data/transactions';
import { Filters } from '@/components/transactions/Filters';
import { StatStrip } from '@/components/transactions/StatStrip';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
import { AddTransactionButton } from '@/components/transactions/AddTransactionButton';
import { monthName, monthOfDate, yearOfDate } from '@/lib/date';
import type { TxType } from '@/lib/supabase/types';
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

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const budget = await getOrCreateUserBudget();
  const [accounts, expenseCats, incomeCats, subcategories, months, transactions] =
    await Promise.all([
      listAccounts(budget.id),
      listCategories(budget.id, 'expense'),
      listCategories(budget.id, 'income'),
      listSubcategoriesForBudget(budget.id),
      listMonthsWithTransactions(budget.id),
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
    ]);

  return (
    <>
      <PageHeader
        kicker="Ledger"
        title="Transactions"
        meta={metaLine(sp.month, transactions.length)}
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
        <StatStrip transactions={transactions} budgetFxRate={budget.fx_rate} />
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
          budgetId={budget.id}
          budgetFxRate={budget.fx_rate}
        />
      </div>
    </>
  );
}
