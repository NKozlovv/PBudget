import { Suspense } from 'react';
import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listMonthsWithTransactions, listTransactions } from '@/lib/data/transactions';
import { Filters } from '@/components/transactions/Filters';
import { TransactionsTable } from '@/components/transactions/TransactionsTable';
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
        kicker="all activity"
        title="Transactions"
        meta={`${transactions.length} matching ${
          transactions.length === 1 ? 'transaction' : 'transactions'
        } · click any cell to edit · click a header to sort`}
      />

      <div className="mt-8">
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

      <div className="mt-6">
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
