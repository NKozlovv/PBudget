import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { countTransactions, listTransactions } from '@/lib/data/transactions';
import { Card, CardHeader, Mono, Num, Pill, Button } from '@/components/ui';
import { PageHeader } from '@/components/nav/PageHeader';
import { IncomeSpendBars } from '@/components/charts/IncomeSpendBars';
import { CategoryDonut } from '@/components/charts/CategoryDonut';
import { fmtCurrency, fmtEUR, txToEUR, signedAmount } from '@/lib/money';
import { dateDisplay } from '@/lib/date';
import {
  totalBalanceEUR,
  monthTotalsEUR,
  lastNMonthsTotals,
  categorySpendEUR,
} from '@/lib/balance';
import { categoryColor } from '@/lib/categoryColor';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, txCount, allTx, recentTx] = await Promise.all([
    listAccounts(budget.id),
    countTransactions(budget.id),
    listTransactions({ budgetId: budget.id }),
    listTransactions({ budgetId: budget.id, limit: 8 }),
  ]);

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const balanceEUR = totalBalanceEUR({ accounts, transactions: allTx, fxRate: budget.fx_rate });
  const monthTotals = monthTotalsEUR({
    transactions: allTx,
    year,
    month,
    fxRate: budget.fx_rate,
  });
  const last6 = lastNMonthsTotals({
    transactions: allTx,
    endYear: year,
    endMonth: month,
    count: 6,
    fxRate: budget.fx_rate,
  });
  const catSlices = categorySpendEUR({
    transactions: allTx,
    year,
    month,
    fxRate: budget.fx_rate,
  });

  const dateKicker = today.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageHeader
        kicker={dateKicker}
        title="Overview"
        tagline="money understood."
        actions={<Button>+ Add transaction</Button>}
      />

      {/* Hero balance + KPI strip */}
      <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <HeroBalance value={balanceEUR} budgetName={budget.name} txCount={txCount} />
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
          <KpiCard label="Income · this month" value={fmtEUR(monthTotals.income)} tone="pos" />
          <KpiCard label="Spend · this month" value={fmtEUR(monthTotals.expense)} tone="neg" />
          <KpiCard
            label="Net · this month"
            value={fmtEUR(monthTotals.net)}
            tone={monthTotals.net >= 0 ? 'pos' : 'neg'}
          />
        </div>
      </div>

      {/* Charts row: IncomeSpendBars + CategoryDonut */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="Income vs Spend"
            subtitle={<Mono size="xs">last 6 months</Mono>}
            right={
              <div className="flex items-center gap-3">
                <LegendDot color="var(--pos)" label="income" />
                <LegendDot color="var(--accent)" label="spend" />
              </div>
            }
          />
          <div className="mt-5">
            <IncomeSpendBars months={last6} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Spend by category"
            subtitle={<Mono size="xs">this month</Mono>}
            right={
              catSlices.length > 0 ? (
                <Mono size="xs">{catSlices.length} categories</Mono>
              ) : null
            }
          />
          <div className="mt-5">
            <CategoryDonut data={catSlices} />
          </div>
        </Card>
      </div>

      {/* Recent transactions */}
      <Section
        title="Recent transactions"
        right={
          <Mono size="xs">
            showing {recentTx.length} of {txCount}
          </Mono>
        }
      >
        {recentTx.length === 0 ? (
          <Empty>No transactions yet.</Empty>
        ) : (
          <Card padded={false} className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rule">
                  <Th className="w-[110px]">Date</Th>
                  <Th>Description</Th>
                  <Th>Category</Th>
                  <Th className="w-[110px]">Type</Th>
                  <Th align="right" className="w-[140px]">
                    Amount
                  </Th>
                  <Th align="right" className="w-[120px]">
                    EUR
                  </Th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((t) => {
                  const eur = txToEUR(t, budget.fx_rate);
                  const signed = signedAmount({ type: t.type, amount: eur });
                  const tone = signed > 0 ? 'pos' : signed < 0 ? 'neg' : 'mute';
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-rule/60 last:border-0 hover:bg-bg-soft/50 transition-colors"
                    >
                      <Td>
                        <Num size={12} tone="mute">
                          {dateDisplay(t.date).toUpperCase()}
                        </Num>
                      </Td>
                      <Td className="text-ink">{t.comment || '—'}</Td>
                      <Td>
                        {t.category ? (
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2 w-2 shrink-0 rounded-sm"
                              style={{ background: categoryColor(t.category) }}
                            />
                            <span className="text-[13px] text-ink-soft">{t.category}</span>
                          </span>
                        ) : (
                          <span className="text-ink-mute">—</span>
                        )}
                      </Td>
                      <Td>
                        <Pill
                          variant={
                            t.type === 'income'
                              ? 'pos'
                              : t.type === 'adjustment'
                                ? 'accent'
                                : 'outline'
                          }
                        >
                          {t.type}
                        </Pill>
                      </Td>
                      <Td align="right">
                        <Num size={14} weight={500} tone="soft">
                          {fmtCurrency(t.amount, t.currency)}
                        </Num>
                      </Td>
                      <Td align="right">
                        <Num size={15} weight={600} tone={tone}>
                          {fmtEUR(signed)}
                        </Num>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </Section>
    </>
  );
}

function HeroBalance({
  value,
  budgetName,
  txCount,
}: {
  value: number;
  budgetName: string;
  txCount: number;
}) {
  const [whole, cents] = formatHero(value);
  return (
    <Card className="p-7 lg:p-8">
      <div className="flex items-baseline justify-between">
        <Mono>Total balance</Mono>
        <Mono size="xs">
          {budgetName} · {txCount} tx
        </Mono>
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
      <p className="mt-3 text-[12px] text-ink-mute">
        Sum of account openings + all transactions, converted to EUR.
      </p>
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

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <Card padded={false} className="px-6 py-10 text-center text-sm text-ink-mute">
      {children}
    </Card>
  );
}

function Th({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th
      className={`px-4 py-3 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <td className={`px-4 py-3 text-sm ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );
}

function formatHero(n: number): [string, string] {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(n);
  const [w, c] = abs.toFixed(2).split('.');
  const wWith = sign + (w ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return [wWith, `.${c ?? '00'}`];
}
