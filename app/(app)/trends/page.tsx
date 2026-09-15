import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import { buildTrendMonths, categoryMonthlyTrend } from '@/lib/categories/monthlyTrend';
import { workingMonth } from '@/lib/dashboard/period';
import { monthOfDate, yearOfDate } from '@/lib/date';
import { TrendTable } from '@/components/trends/TrendTable';
import { TrendsSummary } from '@/components/trends/TrendsSummary';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Trends · Theus' };

/** Safety cap so a stray mis-dated transaction can't blow the table out to
 * thousands of columns — 10 years is generous for a personal budget. */
const MAX_MONTHS = 120;
/** Floor even with no history at all, so the table never looks broken. */
const MIN_MONTHS = 6;

export default async function TrendsPage() {
  const budget = await getOrCreateUserBudget();
  const [expenseCats, allSubs, transactions] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listSubcategoriesForBudget(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  // Anchored to the last completed month (see lib/dashboard/period.ts),
  // consistent with the Dashboard and Categories pages.
  const { year, month } = workingMonth(new Date());

  // "All the months" — span from the earliest expense transaction through
  // the working month, not a fixed recent window. One extra leading month
  // is fetched purely as the delta baseline for the first visible column.
  const expenseDates = transactions.filter((t) => t.type === 'expense').map((t) => t.date);
  let visibleCount = MIN_MONTHS;
  if (expenseDates.length > 0) {
    let earliest = expenseDates[0]!;
    for (const d of expenseDates) if (d < earliest) earliest = d;
    const span = (year - yearOfDate(earliest)) * 12 + (month - monthOfDate(earliest)) + 1;
    visibleCount = Math.min(Math.max(span, MIN_MONTHS), MAX_MONTHS);
  }
  const months = buildTrendMonths(year, month, visibleCount + 1);
  const visibleMonths = months.slice(1);

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of allSubs) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }

  const allRows = categoryMonthlyTrend({
    categories: expenseCats,
    subcategoriesById,
    transactions,
    fxRate: budget.fx_rate,
    months,
    kind: 'expense',
  });
  // Categories with zero activity across the whole shown window just add
  // noise — hide them rather than rendering a row of nothing but dashes.
  const rows = allRows.filter((r) => r.values.some((v) => Math.abs(v) > 0.005));

  const lastIdx = months.length - 1;
  const prevIdx = months.length - 2;
  const latestTotal = rows.reduce((s, r) => s + (r.values[lastIdx] ?? 0), 0);
  const priorTotal = rows.reduce((s, r) => s + (r.values[prevIdx] ?? 0), 0);
  const pctChange = priorTotal > 0.005 ? ((latestTotal - priorTotal) / priorTotal) * 100 : null;

  const first = visibleMonths[0];
  const last = visibleMonths[visibleMonths.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        kicker="Month by month"
        title="Trends"
        meta={
          first && last
            ? `${first.label} – ${last.label} · expense categories & subcategories`
            : undefined
        }
      />

      <TrendsSummary
        categoryCount={rows.length}
        latestMonthLabel={last?.label ?? 'Latest'}
        latestTotal={latestTotal}
        pctChange={pctChange}
        monthCount={visibleMonths.length}
      />

      <TrendTable rows={rows} months={months} visibleCount={visibleCount} />
    </div>
  );
}
