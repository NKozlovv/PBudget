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

  // The donut/legend/per-row "X% of net worth" labels classify and size
  // themselves by a plain native × today's-rate figure, not summary.eur —
  // summary.eur accumulates each transaction's own historical fx_rate
  // (right for the net-worth total, which is tracking real realized FX
  // gains/losses), so an account genuinely at native 0 can still carry a
  // small non-zero accumulated eur and get miscounted as "still has some
  // balance." The net-worth total/delta above are deliberately left on
  // summary.eur/deltaEUR — same figure the rest of the app (Overview,
  // Forecast) uses, so those stay in agreement.
  function simpleEur(s: (typeof summaries)[number]): number {
    return s.account.currency === 'EUR' ? s.native : s.native * budget.fx_rate;
  }

  // Negative balances have no honest slice in a share-of-total donut, so
  // shares (and each row's "X% of net worth" label) are computed against
  // the sum of positive balances only — overdrafts are named separately.
  const positives = summaries.filter((s) => simpleEur(s) > 0);
  const positivesTotal = positives.reduce((s, x) => s + simpleEur(x), 0);

  // Only a genuinely negative balance is an "overdraft" — a zero balance
  // (e.g. an account that was just drained to $0) is a normal account with
  // nothing in it, not an overdraft, so it gets its own (accurate) label.
  const shareLabels: Record<string, string> = {};
  for (const s of summaries) {
    const eur = simpleEur(s);
    if (eur > 0 && positivesTotal > 0) {
      shareLabels[s.account.id] = `${Math.round((eur / positivesTotal) * 100)}% of net worth`;
    } else if (eur < 0) {
      shareLabels[s.account.id] = 'Overdraft · excluded from share';
    } else {
      shareLabels[s.account.id] = '0% of net worth';
    }
  }

  const allShares = [...positives]
    .sort((a, b) => simpleEur(b) - simpleEur(a))
    .map((s) => ({
      id: s.account.id,
      name: s.account.name,
      color: colors[s.account.id] ?? 'var(--ink-mute)',
      eur: simpleEur(s),
      pct: positivesTotal > 0 ? (simpleEur(s) / positivesTotal) * 100 : 0,
    }));

  // The donut/legend fold anything under 4% into one "Other" slice so a
  // budget with a dozen small accounts doesn't end in a fan of illegible
  // slivers — the account list below still shows each one's real,
  // individual share.
  const OTHER_THRESHOLD = 4;
  const main = allShares.filter((s) => s.pct >= OTHER_THRESHOLD);
  const small = allShares.filter((s) => s.pct < OTHER_THRESHOLD);
  const shares =
    small.length > 0
      ? [
          ...main,
          {
            id: 'other',
            name: `Other (${small.length})`,
            color: 'var(--slate)',
            eur: small.reduce((s, x) => s + x.eur, 0),
            pct: small.reduce((s, x) => s + x.pct, 0),
          },
        ]
      : allShares;

  const negatives = summaries
    .filter((s) => simpleEur(s) < 0)
    .sort((a, b) => simpleEur(a) - simpleEur(b))
    .map((s) => ({ name: s.account.name, eur: simpleEur(s) }));

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-extrabold -tracking-[0.025em] text-ink">All accounts</h2>
          <AddAccountButton />
        </div>
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
