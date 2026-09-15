import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import { buildTrendMonths, categoryMonthlyTrend } from '@/lib/categories/monthlyTrend';
import { workingMonth } from '@/lib/dashboard/period';
import { TrendTable } from '@/components/trends/TrendTable';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Trends · Theus' };

const VISIBLE_MONTHS = 6;

export default async function TrendsPage() {
  const budget = await getOrCreateUserBudget();
  const [expenseCats, allSubs, transactions] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listSubcategoriesForBudget(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  // Anchored to the last completed month (see lib/dashboard/period.ts),
  // consistent with the Dashboard and Categories pages. One extra leading
  // month is fetched purely as the delta baseline for the first visible
  // column so every shown month gets a month-over-month color.
  const { year, month } = workingMonth(new Date());
  const months = buildTrendMonths(year, month, VISIBLE_MONTHS + 1);
  const visibleMonths = months.slice(1);

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of allSubs) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }

  const rows = categoryMonthlyTrend({
    categories: expenseCats,
    subcategoriesById,
    transactions,
    fxRate: budget.fx_rate,
    months,
    kind: 'expense',
  });

  const first = visibleMonths[0];
  const last = visibleMonths[visibleMonths.length - 1];

  return (
    <>
      <PageHeader
        kicker="Month by month"
        title="Trends"
        meta={first && last ? `${first.label} – ${last.label} · expense categories & subcategories` : undefined}
      />
      <div className="mt-6">
        <TrendTable rows={rows} months={months} visibleCount={VISIBLE_MONTHS} />
      </div>
    </>
  );
}
