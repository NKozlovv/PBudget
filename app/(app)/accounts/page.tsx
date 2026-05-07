import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { accountsSummary } from '@/lib/accounts/summary';
import { AccountsHero } from '@/components/accounts/AccountsHero';
import { AccountsDistributionBar } from '@/components/accounts/AccountsDistributionBar';
import { AccountsGrid } from '@/components/accounts/AccountsGrid';
import { categoryColor } from '@/lib/categoryColor';

export const metadata = { title: 'Accounts · Theus' };

function colorFor(id: string): string {
  return categoryColor(`acct:${id}`);
}

export default async function AccountsPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, transactions] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const now = new Date();
  const summaries = accountsSummary({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
    now,
    count: 6,
  });

  const totalEUR = summaries.reduce((s, x) => s + x.eur, 0);
  const deltaEUR = summaries.reduce((s, x) => s + x.deltaEUR, 0);

  const colors: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, colorFor(a.id)]),
  );

  const segments = summaries.map((s) => ({
    id: s.account.id,
    name: s.account.name,
    eur: s.eur,
    color: colors[s.account.id] ?? 'var(--ink-mute)',
  }));

  return (
    <>
      <AccountsHero totalEUR={totalEUR} deltaEUR={deltaEUR} />

      <div className="mt-6">
        <AccountsDistributionBar segments={segments} />
      </div>

      <div className="mt-4">
        <AccountsGrid budgetId={budget.id} summaries={summaries} colors={colors} />
      </div>
    </>
  );
}
