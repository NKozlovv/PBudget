import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { accountBalanceEURAt, burnRatesEUR, totalBalanceEUR, ytdAverages } from '@/lib/balance';
import { projectionSeries } from '@/lib/forecast/projection';
import { workingMonth } from '@/lib/dashboard/period';
import { dateToISO } from '@/lib/date';
import { ForecastHero } from '@/components/forecast/ForecastHero';
import { PerCategoryOutlook } from '@/components/forecast/PerCategoryOutlook';
import { CoachInsightCard } from '@/components/forecast/CoachInsightCard';
import { BurnRateTable } from '@/components/forecast/BurnRateTable';

export const metadata = { title: 'Forecast · Theus' };

export default async function ForecastPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, transactions] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const now = new Date();
  // "Average monthly net" / the EOY projection are anchored to the working
  // month (last completed calendar month, CLAUDE.md §8f) — the same basis
  // Overview's own EOY projection uses — so the two screens agree instead
  // of Forecast counting partial current-month activity Overview doesn't.
  const { year, month } = workingMonth(now);

  const ytd = ytdAverages({
    transactions,
    year,
    endMonth: month,
    fxRate: budget.fx_rate,
  });

  // Real-time balance, for the one KPI that's a snapshot rather than a
  // monthly summary — §8f's account-balance exception.
  const balanceNow = totalBalanceEUR({ accounts, transactions, fxRate: budget.fx_rate });

  function eomBalanceEUR(y: number, m: number): number {
    const eom = new Date(y, m + 1, 0);
    return accounts.reduce(
      (s, a) => s + accountBalanceEURAt({ account: a, date: dateToISO(eom), transactions, fxRate: budget.fx_rate }),
      0,
    );
  }
  const lastActualBalance = eomBalanceEUR(year, month);
  const monthsRemaining = 11 - month;

  const points = projectionSeries({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
    year,
    month,
    pastMonths: 12,
    forwardMonths: monthsRemaining,
    avgNet: ytd.avgNet,
  });

  const eoyBalance = lastActualBalance + ytd.avgNet * monthsRemaining;

  const expenseBurn = burnRatesEUR({
    transactions,
    year,
    endMonth: month,
    fxRate: budget.fx_rate,
    kind: 'expense',
  });
  const incomeBurn = burnRatesEUR({
    transactions,
    year,
    endMonth: month,
    fxRate: budget.fx_rate,
    kind: 'income',
  });

  return (
    <>
      <ForecastHero
        avgNet={ytd.avgNet}
        monthsElapsed={ytd.monthsElapsed}
        year={year}
        todayBalance={balanceNow}
        eoyBalance={eoyBalance}
        points={points}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
          <CoachInsightCard
            balanceNow={balanceNow}
            avgNet={ytd.avgNet}
            savingsRate={ytd.savingsRate}
            now={now}
          />
          <PerCategoryOutlook rows={expenseBurn} limit={5} />
        </section>

        <section className="glass flex flex-col gap-6 !rounded-[34px] p-[24px] px-[26px]">
          <BurnRateTable
            title="Expense burn rate"
            subtitle={`Every expense category, ${year} to date.`}
            head="Category"
            rows={expenseBurn}
            monthsElapsed={ytd.monthsElapsed}
            emptyMessage="No expense data this year yet."
            totalsTone="neg"
          />
          {incomeBurn.length > 0 ? (
            <BurnRateTable
              title="Income sources"
              subtitle="Hidden entirely when no income rows exist."
              head="Source"
              rows={incomeBurn}
              monthsElapsed={ytd.monthsElapsed}
              emptyMessage="No income data this year yet."
              totalsTone="pos"
            />
          ) : null}
        </section>
      </div>
    </>
  );
}
