import { PageHeader } from '@/components/nav/PageHeader';
import { Mono } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { burnRatesEUR, totalBalanceEUR, ytdAverages } from '@/lib/balance';
import { projectionSeries } from '@/lib/forecast/projection';
import { ForecastHero } from '@/components/forecast/ForecastHero';
import { HorizonToggle, type Horizon } from '@/components/forecast/HorizonToggle';
import { PerCategoryOutlook } from '@/components/forecast/PerCategoryOutlook';
import { CoachInsightCard } from '@/components/forecast/CoachInsightCard';
import { BurnRateTable } from '@/components/forecast/BurnRateTable';

export const metadata = { title: 'Forecast · Theus' };

interface SearchParams {
  h?: string;
}

function parseHorizon(value: string | undefined): Horizon {
  const n = Number(value);
  return n === 6 || n === 12 || n === 24 ? n : 3;
}

export default async function ForecastPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const horizon = parseHorizon(sp.h);

  const budget = await getOrCreateUserBudget();
  const [accounts, transactions] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const ytd = ytdAverages({
    transactions,
    year,
    endMonth: month,
    fxRate: budget.fx_rate,
  });
  const balanceNow = totalBalanceEUR({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
  });

  const points = projectionSeries({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
    now: today,
    pastMonths: 12,
    forwardMonths: horizon,
    avgNet: ytd.avgNet,
  });

  const forwardBalance = balanceNow + ytd.avgNet * horizon;
  const eoyBalance = balanceNow + ytd.avgNet * ytd.monthsRemaining;

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
      <PageHeader
        title="Forecast"
        meta={`Projection based on ${ytd.monthsElapsed} ${
          ytd.monthsElapsed === 1 ? 'month' : 'months'
        } of history`}
        actions={<HorizonToggle current={horizon} />}
      />

      <div className="mt-6">
        <ForecastHero
          todayBalance={balanceNow}
          forwardBalance={forwardBalance}
          forwardMonths={horizon}
          eoyBalance={eoyBalance}
          points={points}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <PerCategoryOutlook rows={expenseBurn} limit={5} />
        <CoachInsightCard
          balanceNow={balanceNow}
          avgNet={ytd.avgNet}
          savingsRate={ytd.savingsRate}
          now={today}
        />
      </div>

      <section className="mt-10">
        <Mono className="mb-3 block">Burn rate · expense</Mono>
        <BurnRateTable
          title="Expense categories"
          subtitle={`${ytd.monthsElapsed} months of data · projection extends YTD pace`}
          rows={expenseBurn}
          monthsElapsed={ytd.monthsElapsed}
          emptyMessage="No expense data this year yet."
          totalsTone="neg"
        />
      </section>

      {incomeBurn.length > 0 ? (
        <section className="mt-8">
          <Mono className="mb-3 block">Income streams</Mono>
          <BurnRateTable
            title="Income categories"
            subtitle={`${ytd.monthsElapsed} months of data`}
            rows={incomeBurn}
            monthsElapsed={ytd.monthsElapsed}
            emptyMessage="No income data this year yet."
            totalsTone="pos"
          />
        </section>
      ) : null}
    </>
  );
}
