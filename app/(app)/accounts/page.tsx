import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { accountsSummary } from '@/lib/accounts/summary';
import { AccountsHero } from '@/components/accounts/AccountsHero';
import { AccountsGrid } from '@/components/accounts/AccountsGrid';
import { AddAccountButton } from '@/components/accounts/AddAccountButton';
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

  if (accounts.length === 0) {
    return (
      <section className="glass flex flex-col items-center gap-3 !rounded-[34px] px-8 py-16 text-center">
        <h1 className="text-[22px] font-extrabold -tracking-[0.02em] text-ink">Nothing to track yet</h1>
        <p className="max-w-[46ch] text-[14px] font-medium text-ink-soft">
          Add your first account and Theus will start building net worth from it. You can add the
          rest later.
        </p>
        <div className="mt-2">
          <AddAccountButton />
        </div>
      </section>
    );
  }

  const now = new Date();
  // Biggest EUR contribution first — matches the "share of net worth" bar's
  // own order, so the list and the bar always agree on rank.
  const summaries = accountsSummary({
    accounts,
    transactions,
    fxRate: budget.fx_rate,
    now,
    count: 6,
  }).sort((a, b) => b.eur - a.eur);

  const totalEUR = summaries.reduce((s, x) => s + x.eur, 0);
  const deltaEUR = summaries.reduce((s, x) => s + x.deltaEUR, 0);

  const colors: Record<string, string> = Object.fromEntries(
    accounts.map((a) => [a.id, colorFor(a.id)]),
  );

  // Negative balances have no honest width in a share-of-total bar, so
  // shares (and each row's "X% of net worth" label) are computed against
  // the sum of positive balances only — overdrafts are named separately.
  const positives = summaries.filter((s) => s.eur > 0);
  const positivesTotal = positives.reduce((s, x) => s + x.eur, 0);

  // Only a genuinely negative balance is an "overdraft" — a zero balance
  // (e.g. an account that was just drained to $0) is a normal account with
  // nothing in it, not an overdraft, so it gets its own (accurate) label.
  const shareLabels: Record<string, string> = {};
  for (const s of summaries) {
    if (s.eur > 0 && positivesTotal > 0) {
      shareLabels[s.account.id] = `${Math.round((s.eur / positivesTotal) * 100)}% of net worth`;
    } else if (s.eur < 0) {
      shareLabels[s.account.id] = 'Overdraft · excluded from share';
    } else {
      shareLabels[s.account.id] = '0% of net worth';
    }
  }

  const shares = [...positives]
    .sort((a, b) => b.eur - a.eur)
    .map((s) => ({
      id: s.account.id,
      name: s.account.name,
      color: colors[s.account.id] ?? 'var(--ink-mute)',
      eur: s.eur,
      pct: positivesTotal > 0 ? (s.eur / positivesTotal) * 100 : 0,
    }));

  const negatives = summaries
    .filter((s) => s.eur < 0)
    .sort((a, b) => a.eur - b.eur)
    .map((s) => ({ name: s.account.name, eur: s.eur }));

  return (
    <>
      <AccountsHero
        totalEUR={totalEUR}
        deltaEUR={deltaEUR}
        accountCount={accounts.length}
        eurCount={accounts.filter((a) => a.currency === 'EUR').length}
        usdCount={accounts.filter((a) => a.currency === 'USD').length}
        fxRate={budget.fx_rate}
        shares={shares}
        negatives={negatives}
      />

      <section className="glass flex flex-col gap-[14px] !rounded-[34px] p-[24px] px-[26px]">
        <h2 className="text-[22px] font-extrabold -tracking-[0.025em] text-ink">All accounts</h2>
        <AccountsGrid
          budgetId={budget.id}
          summaries={summaries}
          colors={colors}
          shareLabels={shareLabels}
          fxRate={budget.fx_rate}
        />
      </section>
    </>
  );
}
