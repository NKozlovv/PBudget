import { PageHeader } from '@/components/nav/PageHeader';
import { Stub } from '@/components/nav/Stub';
import { Button } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';

export const metadata = { title: 'Accounts · Theus' };

export default async function AccountsPage() {
  const budget = await getOrCreateUserBudget();
  const accounts = await listAccounts(budget.id);

  return (
    <>
      <PageHeader
        kicker="balances"
        title="Accounts"
        meta={`${accounts.length} configured.`}
        actions={<Button>+ Add account</Button>}
      />
      <Stub chunk={7} what="month-by-account matrix, distribution donut, per-account trajectories" />
    </>
  );
}
