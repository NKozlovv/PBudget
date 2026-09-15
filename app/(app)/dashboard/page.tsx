import { Card, CardHeader } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { getAuthUser } from '@/lib/supabase/server';
import { IncomeSpendBars } from '@/components/charts/IncomeSpendBars';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { SavingsRateChart } from '@/components/charts/SavingsRateChart';
import type { TrendPoint } from '@/components/charts/TrendLineChart';
import { Greeting } from '@/components/dashboard/Greeting';
import { HeroBalanceTile } from '@/components/dashboard/HeroBalanceTile';
import { MonthKpiTile } from '@/components/dashboard/MonthKpiTile';
import { AccountsList, type AccountRow } from '@/components/dashboard/AccountsList';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { monthLong, workingMonth } from '@/lib/dashboard/period';
import {
  totalBalanceEUR,
  monthTotalsEUR,
  lastNMonthsTotals,
  burnRatesEUR,
  accountBalanceNativeAt,
  accountBalanceEURAt,
  accountsCurrentEUR,
  forecastYear,
  ytdAverages,
} from '@/lib/balance';
import { dateToISO, monthName } from '@/lib/date';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage() {
  const [user, budget] = await Promise.all([getAuthUser(), getOrCreateUserBudget()]);
  const userName = deriveUserName(user?.user_metadata, user?.email);

  const [accounts, allTx] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);
  // allTx is already sorted date desc, created_at desc (listTransactions'
  // default) — identical order to a separate limit:8 query, so slicing it
  // avoids a second full round trip for the same data.
  const recentTx = allTx.slice(0, 8);

  const now = new Date();
  // "This month" throughout the dashboard means the last COMPLETED
  // calendar month, not the in-progress one — the user reviews/fills in
  // the budget at month-end for the month that just ended. Account
  // balances (below) stay anchored to the true current date.
  const { year, month } = workingMonth(now);
  const fxRate = budget.fx_rate;

  // Hero numbers
  const balanceEUR = totalBalanceEUR({ accounts, transactions: allTx, fxRate });
  const monthTotals = monthTotalsEUR({ transactions: allTx, year, month, fxRate });

  // 6-month average expense (excluding the working month) for the insight subline.
  const last7 = lastNMonthsTotals({
    transactions: allTx,
    endYear: year,
    endMonth: month,
    count: 7,
    fxRate,
  });
  const priorSix = last7.slice(0, 6);
  const avgMonthSpend =
    priorSix.length > 0 ? priorSix.reduce((s, b) => s + b.expense, 0) / priorSix.length : 0;

  // "vs last month" delta: EOM(working month) vs EOM(the month before it) —
  // two fully-elapsed, real months. Comparing the *live* balance to last
  // month's close instead (as this used to) reads as stuck at "+€0" for
  // most of the month, since this app's users fill in transactions at
  // month-end (see workingMonth()) — until then there's simply nothing new
  // to diff against. This version is always meaningful and correctly signed
  // the moment last month's numbers are in.
  function eomBalanceEUR(y: number, m: number): number {
    const eom = new Date(y, m + 1, 0);
    return accounts.reduce(
      (s, a) => s + accountBalanceEURAt({ account: a, date: dateToISO(eom), transactions: allTx, fxRate }),
      0,
    );
  }
  const workingMonthEomBalance = eomBalanceEUR(year, month);
  const priorMonth = month === 0 ? 11 : month - 1;
  const priorMonthYear = month === 0 ? year - 1 : year;
  const priorMonthEomBalance = eomBalanceEUR(priorMonthYear, priorMonth);
  const monthDelta = workingMonthEomBalance - priorMonthEomBalance;
  const monthPct =
    priorMonthEomBalance !== 0 ? (monthDelta / Math.abs(priorMonthEomBalance)) * 100 : 0;
  const monthDeltaLabel = `${monthName(month, true)} vs ${monthName(priorMonth, true)}`;

  // Category mix — average monthly spend per category, year to date
  // (through the working month), not a single month's raw total. A single
  // month is noisy (one big one-off purchase can dominate the whole ring);
  // the YTD average is the more honest "where does my money typically go"
  // picture, and matches the "YTD avg" language already used on the
  // Categories page.
  const catBurnRates = burnRatesEUR({ transactions: allTx, year, endMonth: month, fxRate, kind: 'expense' });
  const catSlices = catBurnRates.map((r) => ({ name: r.name, value: r.avgMonthly }));
  const catTotal = catSlices.reduce((s, c) => s + c.value, 0);

  // Cash flow chart: full Jan–Dec of the current calendar year. Months
  // through the working month (last completed) are real; the rest —
  // including the in-progress current month, which usually has too little
  // data to plot honestly — are projected at the YTD average pace (same
  // logic the Forecast page uses). Falls back to "nothing actual yet" only
  // in the rare case the working month rolled into the previous year (i.e.
  // it's currently January).
  const cashFlowYear = now.getFullYear();
  const cashFlowEndMonth = year === cashFlowYear ? month : -1;
  const yearBuckets = forecastYear({
    transactions: allTx,
    year: cashFlowYear,
    endMonth: cashFlowEndMonth,
    fxRate,
  });

  // Hero tile charts: same Jan–Dec + forecast shape as the Cash flow
  // chart, just reshaped as {label, value, projected} for the more
  // compact TrendLineChart used inside the tiles. Income/Spending reuse
  // yearBuckets directly; Balance needs its own series (yearBuckets only
  // has income/expense, not running balance) — real month-end balances
  // through the working month, then extended forward from the last real
  // balance at the YTD average net-savings pace.
  const incomeSeries: TrendPoint[] = yearBuckets.map((b) => ({
    label: b.label,
    value: b.income,
    projected: b.projected,
  }));
  const spendingSeries: TrendPoint[] = yearBuckets.map((b) => ({
    label: b.label,
    value: b.expense,
    projected: b.projected,
  }));
  const ytd = ytdAverages({
    transactions: allTx,
    year: cashFlowYear,
    endMonth: cashFlowEndMonth,
    fxRate,
  });
  let lastActualBalance = balanceEUR;
  const balanceYearSeries: TrendPoint[] = Array.from({ length: 12 }, (_, m) => {
    const projected = m > cashFlowEndMonth;
    let value: number;
    if (!projected) {
      const eom = new Date(cashFlowYear, m + 1, 0);
      value = accounts.reduce(
        (s, a) => s + accountBalanceEURAt({ account: a, date: dateToISO(eom), transactions: allTx, fxRate }),
        0,
      );
      lastActualBalance = value;
    } else {
      value = lastActualBalance + ytd.avgNet * (m - cashFlowEndMonth);
    }
    return { label: monthName(m, true).toUpperCase(), value, projected };
  });
  // Balance projected forward to Dec 31 at the YTD average net-savings
  // pace — the last entry of the series above already *is* this number.
  const projectedEOY = balanceYearSeries[11]!.value;

  // "Saved this year" — real YTD income minus expenses, no projection.
  const savingsThisYear = ytd.totalNet;

  // Savings rate (avg): the simple average of each real month's own
  // (income − expense) / income — same figure the Savings rate card below
  // computes and labels "YTD avg", kept in sync by using the identical
  // filter/formula rather than deriving it a different way.
  const monthlySavingsRates = yearBuckets
    .filter((b) => !b.projected && b.income > 0)
    .map((b) => (b.income - b.expense) / b.income);
  const savingsRateAvg =
    monthlySavingsRates.length > 0
      ? monthlySavingsRates.reduce((s, v) => s + v, 0) / monthlySavingsRates.length
      : 0;

  // Per-account balances (native + EUR).
  const eurMap = accountsCurrentEUR({ accounts, transactions: allTx, fxRate });
  const today = dateToISO(now);
  const accountRows: AccountRow[] = accounts.map((a) => ({
    account: a,
    native: accountBalanceNativeAt({
      accountId: a.id,
      date: today,
      openingBalance: a.opening_balance,
      transactions: allTx,
    }),
    eur: eurMap.get(a.id) ?? 0,
  }));

  const monthLabel = monthLong(month);

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting + insight */}
      <Greeting
        now={now}
        userName={userName}
        monthSpend={monthTotals.expense}
        avgMonthSpend={avgMonthSpend}
        monthLabel={monthLabel}
      />

      {/* Hero KPIs */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <HeroBalanceTile
          balance={balanceEUR}
          monthDelta={monthDelta}
          monthPct={monthPct}
          monthDeltaLabel={monthDeltaLabel}
          savingsThisYear={savingsThisYear}
          savingsRateAvg={savingsRateAvg}
          projectedEOY={projectedEOY}
          series={balanceYearSeries}
          accountCount={accounts.length}
        />
        <MonthKpiTile label="Income" avgAmount={ytd.avgIncome} series={incomeSeries} tone="pos" />
        <MonthKpiTile
          label="Spending"
          avgAmount={ytd.avgExpense}
          series={spendingSeries}
          tone="neg"
        />
      </div>

      {/* Cashflow + Spending mix row */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Cash flow"
            subtitle={
              <span className="text-[11px] text-ink-mute">
                Income vs spending · {now.getFullYear()}, with a forecast for the months ahead
              </span>
            }
            right={
              <div className="flex items-center gap-3.5 text-[11px] text-ink-soft">
                <LegendDot color="var(--pos)">Income</LegendDot>
                <LegendDot color="var(--neg)">Spending</LegendDot>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
                  <span
                    className="h-2 w-2 rounded-sm border border-ink-mute"
                    style={{ borderStyle: 'dashed' }}
                  />
                  Projected
                </span>
              </div>
            }
          />
          <div className="mt-4">
            <IncomeSpendBars months={yearBuckets} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Spending mix"
            subtitle={
              <span className="text-[11px] text-ink-mute">
                YTD average · {catSlices.length} categor{catSlices.length === 1 ? 'y' : 'ies'}
              </span>
            }
          />
          <div className="mt-4">
            <CategoryDonut
              data={catSlices}
              size={150}
              strokeWidth={20}
              centerLabel={catTotal > 0 ? `€${(catTotal / 1000).toFixed(1)}k` : '€0'}
              centerSublabel="avg / month"
            />
          </div>
        </Card>
      </div>

      {/* Savings rate — how much of income was kept each month, YTD */}
      <Card>
        <CardHeader
          title="Savings rate"
          subtitle={
            <span className="text-[11px] text-ink-mute">
              (income − spending) ÷ income, by month · {now.getFullYear()} YTD
            </span>
          }
        />
        <div className="mt-4">
          {yearBuckets.filter((b) => !b.projected && b.income > 0).length >= 2 ? (
            <SavingsRateChart buckets={yearBuckets} />
          ) : (
            <p className="text-[12px] text-ink-mute">Not enough data yet.</p>
          )}
        </div>
      </Card>

      {/* Accounts + Recent activity row */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <AccountsList rows={accountRows} />
        <RecentActivityList transactions={recentTx} accounts={accounts} now={now} />
      </div>
    </div>
  );
}

function LegendDot({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      {children}
    </span>
  );
}

function deriveUserName(metadata: unknown, email: string | null | undefined): string {
  const meta = (metadata && typeof metadata === 'object' ? metadata : {}) as Record<
    string,
    unknown
  >;
  const full = typeof meta.full_name === 'string' ? meta.full_name : null;
  const name = typeof meta.name === 'string' ? meta.name : null;
  const candidate = full ?? name;
  if (candidate) {
    const first = candidate.trim().split(/\s+/)[0];
    if (first) return first;
  }
  if (email) {
    const local = email.split('@')[0] ?? '';
    const cleaned = local.split(/[._\-+]/)[0] ?? local;
    if (cleaned) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return 'there';
}

