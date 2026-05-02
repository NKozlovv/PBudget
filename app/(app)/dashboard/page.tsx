import { createClient } from '@/lib/supabase/server';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories } from '@/lib/data/categories';
import { countTransactions, listTransactions } from '@/lib/data/transactions';
import { Card, Mono, Num, Pill } from '@/components/ui';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { fmtCurrency, fmtEUR, txToEUR, signedAmount } from '@/lib/money';
import { dateDisplay } from '@/lib/date';
import { totalBalanceEUR, monthTotalsEUR } from '@/lib/balance';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const budget = await getOrCreateUserBudget();
  const [accounts, expenseCats, incomeCats, txCount, allTx, recentTx] = await Promise.all([
    listAccounts(budget.id),
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
    countTransactions(budget.id),
    listTransactions({ budgetId: budget.id }), // for hero + month totals
    listTransactions({ budgetId: budget.id, limit: 8 }),
  ]);

  const today = new Date();
  const balanceEUR = totalBalanceEUR({ accounts, transactions: allTx, fxRate: budget.fx_rate });
  const month = monthTotalsEUR({
    transactions: allTx,
    year: today.getFullYear(),
    month: today.getMonth(),
    fxRate: budget.fx_rate,
  });

  return (
    <main className="min-h-screen px-10 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-end justify-between border-b border-rule pb-6">
          <div>
            <Mono>03 · data layer wired</Mono>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 font-display italic text-xl text-ink-mute">
              {user?.email ?? 'money understood.'}
            </p>
          </div>
          <SignOutButton />
        </header>

        {/* Hero balance + KPI strip */}
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <HeroBalance value={balanceEUR} budgetName={budget.name} txCount={txCount} />
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <KpiCard label="Income · this month" value={fmtEUR(month.income)} tone="pos" />
            <KpiCard label="Spend · this month" value={fmtEUR(month.expense)} tone="neg" />
            <KpiCard label="Net · this month" value={fmtEUR(month.net)} tone={month.net >= 0 ? 'pos' : 'neg'} />
          </div>
        </div>

        <Section title="Recent transactions" right={<Mono size="xs">showing {recentTx.length} of {txCount}</Mono>}>
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
                    <Th align="right" className="w-[140px]">Amount</Th>
                    <Th align="right" className="w-[120px]">EUR</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((t) => {
                    const eur = txToEUR(t, budget.fx_rate);
                    const signed = signedAmount({ type: t.type, amount: eur });
                    const tone = signed > 0 ? 'pos' : signed < 0 ? 'neg' : 'mute';
                    return (
                      <tr key={t.id} className="border-b border-rule/60 last:border-0 hover:bg-bg-soft/50 transition-colors">
                        <Td>
                          <Num size={12} family="mono" tone="mute">
                            {dateDisplay(t.date).toUpperCase()}
                          </Num>
                        </Td>
                        <Td className="text-ink">{t.comment || '—'}</Td>
                        <Td className="text-ink-soft">
                          {t.category ?? <span className="text-ink-mute">—</span>}
                        </Td>
                        <Td>
                          <Pill
                            variant={
                              t.type === 'income' ? 'pos' : t.type === 'adjustment' ? 'accent' : 'outline'
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

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Section title="Accounts">
            {accounts.length === 0 ? (
              <Empty>No accounts yet.</Empty>
            ) : (
              <Card padded={false} className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rule">
                      <Th>Name</Th>
                      <Th align="right">Currency</Th>
                      <Th align="right" className="w-[140px]">Opening</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((a) => (
                      <tr key={a.id} className="border-b border-rule/60 last:border-0 hover:bg-bg-soft/50 transition-colors">
                        <Td className="text-ink font-medium">{a.name}</Td>
                        <Td align="right">
                          <Mono size="xs">{a.currency}</Mono>
                        </Td>
                        <Td align="right">
                          <Num size={14} weight={500} tone="soft">
                            {fmtCurrency(a.opening_balance, a.currency)}
                          </Num>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </Section>

          <Section title="Categories">
            <div className="grid gap-3">
              <Card>
                <div className="flex items-baseline justify-between mb-3">
                  <Mono size="xs">Expense</Mono>
                  <Num size={13} family="mono" tone="mute">
                    {expenseCats.length}
                  </Num>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {expenseCats.map((c) => (
                    <Pill key={c.id} variant="outline">
                      {c.name}
                    </Pill>
                  ))}
                  {expenseCats.length === 0 && <span className="text-sm text-ink-mute">—</span>}
                </div>
              </Card>
              <Card>
                <div className="flex items-baseline justify-between mb-3">
                  <Mono size="xs">Income</Mono>
                  <Num size={13} family="mono" tone="mute">
                    {incomeCats.length}
                  </Num>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {incomeCats.map((c) => (
                    <Pill key={c.id} variant="pos">
                      {c.name}
                    </Pill>
                  ))}
                  {incomeCats.length === 0 && <span className="text-sm text-ink-mute">—</span>}
                </div>
              </Card>
            </div>
          </Section>
        </div>

        <p className="mt-12 max-w-2xl text-sm text-ink-soft leading-relaxed">
          Read-only. The full Sterling sidebar shell + per-page navigation arrives in Chunk 4. Charts and drill-downs Chunks 5+.
        </p>
      </div>
    </main>
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
    <td
      className={`px-4 py-3 text-sm ${align === 'right' ? 'text-right' : ''} ${className}`}
    >
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
