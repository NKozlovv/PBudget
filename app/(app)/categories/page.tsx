import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import {
  listCategories,
  listSubcategoriesForBudget,
} from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import { categoryTotalsByKindEUR } from '@/lib/balance';
import { CategoriesPanel } from '@/components/categories/CategoriesPanel';
import { fmtEUR } from '@/lib/money';
import { eomDateStr } from '@/lib/date';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Categories · Theus' };

export default async function CategoriesPage() {
  const budget = await getOrCreateUserBudget();
  const [expense, income, allSubs, transactions] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
    listSubcategoriesForBudget(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastOfMonth = eomDateStr(year, month);
  const firstOfYear = `${year}-01-01`;
  const lastOfYear = `${year}-12-31`;

  const expenseMonth = categoryTotalsByKindEUR({
    transactions,
    fxRate: budget.fx_rate,
    kind: 'expense',
    range: { fromDate: firstOfMonth, toDate: lastOfMonth },
  });
  const expenseYTD = categoryTotalsByKindEUR({
    transactions,
    fxRate: budget.fx_rate,
    kind: 'expense',
    range: { fromDate: firstOfYear, toDate: lastOfYear },
  });
  const incomeMonth = categoryTotalsByKindEUR({
    transactions,
    fxRate: budget.fx_rate,
    kind: 'income',
    range: { fromDate: firstOfMonth, toDate: lastOfMonth },
  });
  const incomeYTD = categoryTotalsByKindEUR({
    transactions,
    fxRate: budget.fx_rate,
    kind: 'income',
    range: { fromDate: firstOfYear, toDate: lastOfYear },
  });

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of allSubs) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }

  const totalExpenseThisMonth = sum(expenseMonth.perCategory);
  const totalIncomeThisMonth = sum(incomeMonth.perCategory);

  return (
    <>
      <PageHeader
        kicker="taxonomy"
        title="Categories"
        meta={`${expense.length} expense · ${income.length} income · ${fmtEUR(
          totalExpenseThisMonth,
          { decimals: 0 },
        )} spent / ${fmtEUR(totalIncomeThisMonth, { decimals: 0 })} earned this month.`}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <CategoriesPanel
          budgetId={budget.id}
          kind="expense"
          title="Expense"
          categories={expense}
          subcategoriesById={subcategoriesById}
          totalsThisMonth={Object.fromEntries(expenseMonth.perCategory)}
          totalsYTD={Object.fromEntries(expenseYTD.perCategory)}
          subTotalsYTD={Object.fromEntries(expenseYTD.perSubcategory)}
        />
        <CategoriesPanel
          budgetId={budget.id}
          kind="income"
          title="Income"
          categories={income}
          subcategoriesById={subcategoriesById}
          totalsThisMonth={Object.fromEntries(incomeMonth.perCategory)}
          totalsYTD={Object.fromEntries(incomeYTD.perCategory)}
          subTotalsYTD={Object.fromEntries(incomeYTD.perSubcategory)}
        />
      </div>
    </>
  );
}

function sum(map: Map<string, number>): number {
  let s = 0;
  for (const v of map.values()) s += v;
  return s;
}
