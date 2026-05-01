import { createClient } from '@/lib/supabase/server';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories } from '@/lib/data/categories';
import { countTransactions, listTransactions } from '@/lib/data/transactions';
import { Card, Mono, Pill } from '@/components/ui';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { fmtCurrency, txToEUR } from '@/lib/money';
import { dateDisplay } from '@/lib/date';

export const metadata = { title: 'Dashboard · Theus' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const budget = await getOrCreateUserBudget();
  const [accounts, expenseCats, incomeCats, txCount, recentTx] = await Promise.all([
    listAccounts(budget.id),
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
    countTransactions(budget.id),
    listTransactions({ budgetId: budget.id, limit: 8 }),
  ]);

  return (
    <main className="min-h-screen px-10 py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-end justify-between border-b border-rule pb-6">
          <div>
            <Mono>03 · data layer wired</Mono>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-2 font-display italic text-xl text-ink-mute">money understood.</p>
          </div>
          <SignOutButton />
        </header>

        <div className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="signed in" value={user?.email ?? '—'} />
          <StatCard label="budget" value={budget.name} />
          <StatCard label="accounts" value={String(accounts.length)} />
          <StatCard label="transactions" value={String(txCount)} />
        </div>

        <Section title="Accounts">
          {accounts.length === 0 ? (
            <Empty>No accounts yet. Import or create one to get started.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rule">
                    <Th>Name</Th>
                    <Th>Currency</Th>
                    <Th align="right">Opening balance</Th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((a) => (
                    <tr key={a.id} className="border-b border-rule/50 last:border-0">
                      <Td>{a.name}</Td>
                      <Td>
                        <Pill variant="outline">{a.currency}</Pill>
                      </Td>
                      <Td align="right" className="font-mono tabular-nums">
                        {fmtCurrency(a.opening_balance, a.currency)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Categories">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <Mono size="xs">Expense · {expenseCats.length}</Mono>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {expenseCats.map((c) => (
                  <Pill key={c.id} variant="outline">
                    {c.name}
                  </Pill>
                ))}
                {expenseCats.length === 0 && <span className="text-sm text-ink-mute">—</span>}
              </div>
            </Card>
            <Card>
              <Mono size="xs">Income · {incomeCats.length}</Mono>
              <div className="mt-3 flex flex-wrap gap-1.5">
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

        <Section title={`Recent transactions · ${txCount} total`}>
          {recentTx.length === 0 ? (
            <Empty>No transactions yet.</Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-rule">
                    <Th>Date</Th>
                    <Th>Description</Th>
                    <Th>Category</Th>
                    <Th>Type</Th>
                    <Th align="right">Amount</Th>
                    <Th align="right">EUR</Th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((t) => (
                    <tr key={t.id} className="border-b border-rule/50 last:border-0">
                      <Td className="text-ink-soft">{dateDisplay(t.date)}</Td>
                      <Td>{t.comment || '—'}</Td>
                      <Td className="text-ink-soft">{t.category ?? '—'}</Td>
                      <Td>
                        <Pill
                          variant={
                            t.type === 'income' ? 'pos' : t.type === 'adjustment' ? 'accent' : 'outline'
                          }
                        >
                          {t.type}
                        </Pill>
                      </Td>
                      <Td align="right" className="font-mono tabular-nums">
                        {fmtCurrency(t.amount, t.currency)}
                      </Td>
                      <Td align="right" className="font-mono tabular-nums text-ink-soft">
                        {fmtCurrency(txToEUR(t, budget.fx_rate), 'EUR')}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <p className="mt-12 max-w-2xl text-sm text-ink-soft leading-relaxed">
          Read-only. The full Sterling-style dashboard with KPIs, charts, and drill-downs lands
          in Chunks 4 → 5. Sidebar shell arrives in Chunk 4.
        </p>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <Mono size="xs">{label}</Mono>
      <div className="mt-2 truncate text-base font-medium">{value}</div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-[15px] font-semibold tracking-tight text-ink mb-4">{title}</h2>
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
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-mute ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
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
    <td className={`px-3 py-3 ${align === 'right' ? 'text-right' : ''} ${className}`}>
      {children}
    </td>
  );
}
