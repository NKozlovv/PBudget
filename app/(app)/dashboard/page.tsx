import { Card, CardHeader } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { createClient } from '@/lib/supabase/server';
import { IncomeSpendBars } from '@/components/charts/IncomeSpendBars';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { Greeting } from '@/components/dashboard/Greeting';
import { PeriodToggleClient } from '@/components/dashboard/PeriodToggleClient';
import { HeroBalanceTile } from '@/components/dashboard/HeroBalanceTile';
import { MonthKpiTile } from '@/components/dashboard/MonthKpiTile';
import { AccountsList, type AccountRow } from '@/components/dashboard/AccountsList';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { parsePeriod, monthLong, workingMonth } from '@/lib/dashboard/period';
import {
  totalBalanceEUR,
  monthTotalsEUR,
  lastNMonthsTotals,
  categorySpendEUR,
  accountsTrajectoryEUR,
  accountBalanceNativeAt,
  accountsCurrentEUR,
} from '@/lib/balance';
import { dateToISO } from '@/lib/date';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userName = deriveUserName(user?.user_metadata, user?.email);

  const budget = await getOrCreateUserBudget();
  const [accounts, allTx, recentTx] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
    listTransactions({ budgetId: budget.id, limit: 8 }),
  ]);

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

  // Per-month series (12 months ending at the working month)
  const last12 = lastNMonthsTotals({
    transactions: allTx,
    endYear: year,
    endMonth: month,
    count: 12,
    fxRate,
  });
  const incomeTrend = last12.map((m) => m.income);
  const expenseTrend = last12.map((m) => m.expense);

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
  const prevMonth = priorSix.at(-1);
  const prevIncome = prevMonth?.income ?? 0;
  const prevExpense = prevMonth?.expense ?? 0;

  // 12-month total-balance trajectory (sum across all accounts at each
  // month-end) — anchored to TODAY, since this is a real-time balance
  // chart, not a spend/income summary.
  const trajectory = accountsTrajectoryEUR({
    accounts,
    transactions: allTx,
    endYear: now.getFullYear(),
    endMonth: now.getMonth(),
    count: 12,
    fxRate,
  });
  const balanceSeries = trajectory.map((p) =>
    Object.values(p.balances).reduce((s, n) => s + n, 0),
  );
  const prevBalance =
    balanceSeries.length >= 2 ? (balanceSeries[balanceSeries.length - 2] ?? 0) : balanceEUR;

  // Category mix (working month).
  const catSlices = categorySpendEUR({ transactions: allTx, year, month, fxRate });
  const catTotal = catSlices.reduce((s, c) => s + c.value, 0);

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
      {/* Greeting + insight + period toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Greeting
          now={now}
          userName={userName}
          monthSpend={monthTotals.expense}
          avgMonthSpend={avgMonthSpend}
          monthLabel={monthLabel}
        />
        <PeriodToggleClient value={period} />
      </div>

      {/* Hero KPIs */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
        <HeroBalanceTile
          balance={balanceEUR}
          prevBalance={prevBalance}
          trend={balanceSeries}
          accountCount={accounts.length}
        />
        <MonthKpiTile
          label={`Income · ${monthLabel}`}
          amount={monthTotals.income}
          prevAmount={prevIncome}
          trend={incomeTrend}
          tone="pos"
          kind="income"
        />
        <MonthKpiTile
          label={`Spending · ${monthLabel}`}
          amount={monthTotals.expense}
          prevAmount={prevExpense}
          trend={expenseTrend}
          tone="neg"
          kind="spending"
        />
      </div>

      {/* Cashflow + Spending mix row */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader
            title="Cash flow"
            subtitle={
              <span className="text-[11px] text-ink-mute">Income vs spending · monthly</span>
            }
            right={
              <div className="flex items-center gap-3.5 text-[11px] text-ink-soft">
                <LegendDot color="var(--pos)">Income</LegendDot>
                <LegendDot color="var(--accent)">Spending</LegendDot>
              </div>
            }
          />
          <div className="mt-4">
            <IncomeSpendBars months={last12} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Spending mix"
            subtitle={
              <span className="text-[11px] text-ink-mute">
                {monthLabel} · {catSlices.length} categor{catSlices.length === 1 ? 'y' : 'ies'}
              </span>
            }
          />
          <div className="mt-4">
            <CategoryDonut
              data={catSlices}
              size={150}
              strokeWidth={20}
              centerLabel={catTotal > 0 ? `€${(catTotal / 1000).toFixed(1)}k` : '€0'}
              centerSublabel="total"
            />
          </div>
        </Card>
      </div>

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

