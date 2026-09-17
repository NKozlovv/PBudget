import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import { buildTrendMonths, categoryMonthlyTrend } from '@/lib/categories/monthlyTrend';
import { workingMonth } from '@/lib/dashboard/period';
import { yearOfDate } from '@/lib/date';
import { TrendTable } from '@/components/trends/TrendTable';
import { YearSelect } from '@/components/trends/YearSelect';
import { ExportButton } from '@/components/trends/ExportButton';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Trends · Theus' };

interface SearchParams {
  year?: string;
}

/**
 * A single calendar year's elapsed months — design_handoff_theus_rehaul
 * README "4. Trends": "eleven columns do not fit a ~860px pane, so the
 * table carries exactly what it needs: category, the elapsed months, and
 * the year total." Past years show all 12 months; the current year shows
 * Jan through the last completed month (workingMonth).
 */
export default async function TrendsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const budget = await getOrCreateUserBudget();
  const [expenseCats, allSubs, transactions] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listSubcategoriesForBudget(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const { year: workingYear, month: workingMonthIdx } = workingMonth(new Date());

  const expenseDates = transactions.filter((t) => t.type === 'expense').map((t) => t.date);
  const years = new Set<number>([workingYear]);
  for (const d of expenseDates) years.add(yearOfDate(d));
  const availableYears = [...years].sort((a, b) => b - a);

  const requestedYear = Number(sp.year);
  const year = availableYears.includes(requestedYear) ? requestedYear : workingYear;
  const endMonth = year === workingYear ? workingMonthIdx : 11;
  const visibleCount = endMonth + 1;

  // One extra leading month, purely as the first visible column's MoM
  // delta baseline.
  const months = buildTrendMonths(year, endMonth, visibleCount + 1);
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
  // Categories with zero activity across the *visible* year just add
  // noise — hide them rather than rendering a row of nothing but dashes.
  // (values[0] is the leading baseline month, not shown — skip it here so
  // a category active only in December of the prior year doesn't sneak in.)
  const rows = allRows.filter((r) => r.values.slice(1).some((v) => Math.abs(v) > 0.005));

  const first = visibleMonths[0];
  const last = visibleMonths[visibleMonths.length - 1];

  return (
    <>
      <PageHeader
        title="Trends"
        meta={
          first && last
            ? `${first.label} – ${last.label} · which expense categories are running above or below their own average this year`
            : undefined
        }
        actions={
          <>
            <YearSelect years={availableYears} selected={year} />
            <ExportButton rows={rows} months={months} visibleCount={visibleCount} year={year} />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <Legend hue="var(--in)" label="Below average" />
        <Legend hue="rgba(139,149,184,.6)" label="At average" />
        <Legend hue="var(--out)" label="Above average" />
      </div>

      <TrendTable rows={rows} months={months} visibleCount={visibleCount} />
    </>
  );
}

function Legend({ hue, label }: { hue: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink-soft">
      <span className="h-[10px] w-[10px] rounded-full" style={{ background: hue }} />
      {label}
    </span>
  );
}
