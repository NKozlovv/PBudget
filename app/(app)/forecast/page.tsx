import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { burnRatesEUR, totalBalanceEUR, ytdAverages } from '@/lib/balance';
import { projectionSeries } from '@/lib/forecast/projection';
import { ForecastHero } from '@/components/forecast/ForecastHero';
import { type Horizon } from '@/components/forecast/HorizonToggle';
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
      <ForecastHero
        horizon={horizon}
        avgNet={ytd.avgNet}
        monthsElapsed={ytd.monthsElapsed}
        year={year}
        todayBalance={balanceNow}
        forwardBalance={forwardBalance}
        eoyBalance={eoyBalance}
        points={points}
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.05fr]">
        <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
          <CoachInsightCard
            balanceNow={balanceNow}
            avgNet={ytd.avgNet}
            savingsRate={ytd.savingsRate}
            now={today}
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
