import { PageHeader } from '@/components/nav/PageHeader';
import { Card, CardHeader, Mono, Num } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import {
  burnRatesEUR,
  forecastYear,
  totalBalanceEUR,
  ytdAverages,
} from '@/lib/balance';
import { ForecastBars } from '@/components/charts/ForecastBars';
import { BurnRateTable } from '@/components/forecast/BurnRateTable';
import { fmtEUR } from '@/lib/money';

export const metadata = { title: 'Forecast · Theus' };

export default async function ForecastPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, transactions] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const ytd = ytdAverages({ transactions, year, endMonth: month, fxRate: budget.fx_rate });
  const buckets = forecastYear({ transactions, year, endMonth: month, fxRate: budget.fx_rate });
  const balanceNow = totalBalanceEUR({ accounts, transactions, fxRate: budget.fx_rate });
  const projectedEOYBalance = balanceNow + ytd.avgNet * ytd.monthsRemaining;

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
        kicker="projection"
        title="Forecast"
        meta={`At your current pace · ${ytd.monthsElapsed}/12 months elapsed · ${ytd.monthsRemaining} remaining.`}
      />

      {/* Hero — projected EOY balance + savings rate */}
      <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <HeroProjection
          balanceNow={balanceNow}
          projectedEOY={projectedEOYBalance}
          monthsRemaining={ytd.monthsRemaining}
          avgNet={ytd.avgNet}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <KpiCard
            label="Avg income · mo"
            value={fmtEUR(ytd.avgIncome, { decimals: 0 })}
            tone="pos"
          />
          <KpiCard
            label="Avg spend · mo"
            value={fmtEUR(ytd.avgExpense, { decimals: 0 })}
            tone="neg"
          />
          <KpiCard
            label="Savings rate · proj"
            value={`${Math.round(ytd.savingsRate * 100)}%`}
            tone={ytd.savingsRate >= 0 ? 'pos' : 'neg'}
          />
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader
            title="Income vs Spend · year view"
            subtitle={
              <Mono size="xs">
                solid = actual · hatched = projected at YTD pace
              </Mono>
            }
            right={
              <div className="flex items-center gap-3">
                <LegendDot color="var(--pos)" label="income" />
                <LegendDot color="var(--accent)" label="spend" />
              </div>
            }
          />
          <div className="mt-5">
            <ForecastBars buckets={buckets} />
          </div>
          <YearSummary ytd={ytd} />
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-[15px] font-semibold tracking-tight mb-4">Burn rate · expense</h2>
        <BurnRateTable
          title="Expense categories"
          subtitle={`${ytd.monthsElapsed} months of data`}
          rows={expenseBurn}
          monthsElapsed={ytd.monthsElapsed}
          emptyMessage="No expense data this year yet."
          totalsTone="neg"
        />
      </section>

      {incomeBurn.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-[15px] font-semibold tracking-tight mb-4">Income streams</h2>
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

      <p className="mt-10 max-w-2xl text-sm text-ink-soft leading-relaxed">
        Projection extends your year-to-date monthly average across the remaining months.
        Doesn't account for one-off events (bonuses, big purchases). Treat as a pace check,
        not a contract.
      </p>
    </>
  );
}

function HeroProjection({
  balanceNow,
  projectedEOY,
  monthsRemaining,
  avgNet,
}: {
  balanceNow: number;
  projectedEOY: number;
  monthsRemaining: number;
  avgNet: number;
}) {
  const delta = projectedEOY - balanceNow;
  const deltaTone = delta >= 0 ? 'pos' : 'neg';
  const [whole, cents] = formatHero(projectedEOY);
  return (
    <Card className="p-7 lg:p-8">
      <div className="flex items-baseline justify-between">
        <Mono>Projected EOY balance</Mono>
        <Mono size="xs">in {monthsRemaining} months</Mono>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-ink-mute text-base">€</span>
        <Num size={56} weight={600} letterSpacing="-0.04em">
          {whole}
        </Num>
        <Num size={22} weight={500} tone="mute">
          {cents}
        </Num>
      </div>
      <div className="mt-3 flex items-baseline gap-3">
        <Num size={13} weight={600} tone={deltaTone}>
          {delta >= 0 ? '↗' : '↘'} {fmtEUR(delta, { decimals: 0 })}
        </Num>
        <span className="text-[12px] text-ink-mute">
          vs. today (€{Math.round(balanceNow).toLocaleString('en-US')}) · avg{' '}
          {fmtEUR(avgNet, { decimals: 0 })}/mo net.
        </span>
      </div>
    </Card>
  );
}

function KpiCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'pos' | 'neg' | 'default';
}) {
  return (
    <Card className="p-5">
      <Mono size="xs">{label}</Mono>
      <div className="mt-2">
        <Num size={28} weight={600} tone={tone === 'default' ? 'default' : tone}>
          {value}
        </Num>
      </div>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
      <Mono size="xs">{label}</Mono>
    </span>
  );
}

function YearSummary({
  ytd,
}: {
  ytd: ReturnType<typeof ytdAverages>;
}) {
  return (
    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-rule pt-5">
      <SummaryCell label="YTD income" value={fmtEUR(ytd.totalIncome, { decimals: 0 })} sub={`proj ${fmtEUR(ytd.projectedIncome, { decimals: 0 })}`} tone="pos" />
      <SummaryCell label="YTD spend" value={fmtEUR(ytd.totalExpense, { decimals: 0 })} sub={`proj ${fmtEUR(ytd.projectedExpense, { decimals: 0 })}`} tone="neg" />
      <SummaryCell
        label="YTD net"
        value={fmtEUR(ytd.totalNet, { decimals: 0 })}
        sub={`proj ${fmtEUR(ytd.projectedNet, { decimals: 0 })}`}
        tone={ytd.totalNet >= 0 ? 'pos' : 'neg'}
      />
    </div>
  );
}

function SummaryCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'pos' | 'neg';
}) {
  return (
    <div>
      <Mono size="xs">{label}</Mono>
      <div className="mt-1.5">
        <Num size={20} weight={600} tone={tone}>
          {value}
        </Num>
      </div>
      <p className="mt-0.5 text-[11px] text-ink-mute">{sub}</p>
    </div>
  );
}

function formatHero(n: number): [string, string] {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const [w, c] = abs.toFixed(2).split('.');
  const wWith = sign + (w ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [wWith, `.${c ?? '00'}`];
}
