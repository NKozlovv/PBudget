import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import {
  listCategories,
  listSubcategoriesForBudget,
} from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import {
  categoriesSummary,
  subcategoriesSummary,
  type SubcategorySummary,
} from '@/lib/categories/summary';
import { CategoriesClient } from '@/components/categories/CategoriesClient';
import { AddCategoryButton } from '@/components/categories/AddCategoryButton';
import { monthName } from '@/lib/date';
import { workingMonth } from '@/lib/dashboard/period';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Categories · Theus' };

export default async function CategoriesPage() {
  const budget = await getOrCreateUserBudget();
  const [expenseCats, incomeCats, allSubs, transactions] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
    listSubcategoriesForBudget(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  // "This month" here means the last completed calendar month — see
  // lib/dashboard/period.ts#workingMonth.
  const { year, month } = workingMonth(new Date());

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of allSubs) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }

  const expense = categoriesSummary({
    categories: expenseCats,
    subcategoriesById,
    transactions,
    fxRate: budget.fx_rate,
    kind: 'expense',
    year,
    month,
  });
  const income = categoriesSummary({
    categories: incomeCats,
    subcategoriesById,
    transactions,
    fxRate: budget.fx_rate,
    kind: 'income',
    year,
    month,
  });

  // Pre-compute per-category subcategory summaries so the drill-down modal
  // can render without re-fetching transactions client-side.
  const subSummariesByCatId: Record<string, SubcategorySummary[]> = {};
  for (const c of expenseCats) {
    subSummariesByCatId[c.id] = subcategoriesSummary({
      category: c,
      subcategories: subcategoriesById[c.id] ?? [],
      transactions,
      fxRate: budget.fx_rate,
      kind: 'expense',
      year,
      month,
    });
  }
  for (const c of incomeCats) {
    subSummariesByCatId[c.id] = subcategoriesSummary({
      category: c,
      subcategories: subcategoriesById[c.id] ?? [],
      transactions,
      fxRate: budget.fx_rate,
      kind: 'income',
      year,
      month,
    });
  }

  const totalCount = expenseCats.length + incomeCats.length;

  return (
    <>
      <PageHeader
        kicker="Where it goes"
        title="Categories"
        meta={`${monthName(month)} ${year} · ${totalCount} ${
          totalCount === 1 ? 'category' : 'categories'
        } tracked`}
        actions={<AddCategoryButton />}
      />

      <div className="mt-6">
        <CategoriesClient
          budgetId={budget.id}
          expense={expense}
          income={income}
          subSummariesByCatId={subSummariesByCatId}
        />
      </div>
    </>
  );
}
