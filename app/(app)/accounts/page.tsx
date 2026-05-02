import { PageHeader } from '@/components/nav/PageHeader';
import { Card, CardHeader, Mono, Num } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { accountsCurrentEUR, accountsTrajectoryEUR } from '@/lib/balance';
import { Donut, type DonutSlice } from '@/components/charts/Donut';
import { AccountsTrajectory } from '@/components/charts/AccountsTrajectory';
import { AccountsTable } from '@/components/accounts/AccountsTable';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';

export const metadata = { title: 'Accounts · Theus' };

// Stable color per account id — reuses the categoryColor hash so the
// same account name always gets the same swatch across the app.
function colorFor(id: string): string {
  return categoryColor(`acct:${id}`);
}

export default async function AccountsPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, transactions] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const currentEUR = accountsCurrentEUR({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
  });

  const today = new Date();
  const trajectory = accountsTrajectoryEUR({
    accounts,
    transactions,
    endYear: today.getFullYear(),
    endMonth: today.getMonth(),
    count: 12,
    fxRate: budget.fx_rate,
  });

  const slices: DonutSlice[] = accounts
    .map((a) => ({
      name: a.name,
      value: currentEUR.get(a.id) ?? 0,
      color: colorFor(a.id),
    }))
    .filter((s) => s.value > 0);

  const totalEUR = [...currentEUR.values()].reduce((s, v) => s + v, 0);

  return (
    <>
      <PageHeader
        kicker="balances"
        title="Accounts"
        meta={`${accounts.length} ${
          accounts.length === 1 ? 'account' : 'accounts'
        } · current total ${fmtEUR(totalEUR)}.`}
      />

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader
            title="Balance trajectory"
            subtitle={<Mono size="xs">last 12 months · EUR</Mono>}
          />
          <div className="mt-4">
            <AccountsTrajectory accounts={accounts} points={trajectory} colorFor={colorFor} />
          </div>
          {accounts.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {accounts.map((a) => (
                <li key={a.id} className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: colorFor(a.id) }}
                  />
                  <span className="text-[12px] text-ink-soft">{a.name}</span>
                  <Num size={12} tone="mute">
                    {fmtEUR(currentEUR.get(a.id) ?? 0, { decimals: 0 })}
                  </Num>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card>
          <CardHeader
            title="Distribution"
            subtitle={<Mono size="xs">today · EUR</Mono>}
            right={accounts.length > 0 ? <Mono size="xs">{accounts.length}</Mono> : null}
          />
          <div className="mt-4">
            <Donut data={slices} emptyMessage="Add an account to see distribution." />
          </div>
        </Card>
      </div>

      <section className="mt-12">
        <h2 className="text-[15px] font-semibold tracking-tight mb-4">All accounts</h2>
        <AccountsTable
          accounts={accounts}
          budgetId={budget.id}
          currentEUR={currentEUR}
          colorFor={colorFor}
        />
      </section>
    </>
  );
}
