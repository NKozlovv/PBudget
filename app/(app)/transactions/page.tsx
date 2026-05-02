import { PageHeader } from '@/components/nav/PageHeader';
import { Stub } from '@/components/nav/Stub';
import { Button } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { countTransactions } from '@/lib/data/transactions';

export const metadata = { title: 'Transactions · Theus' };

export default async function TransactionsPage() {
  const budget = await getOrCreateUserBudget();
  const count = await countTransactions(budget.id);

  return (
    <>
      <PageHeader
        kicker="all activity"
        title="Transactions"
        tagline={`${count} on file.`}
        actions={
          <>
            <Button variant="ghost">Import XLSX</Button>
            <Button>+ Add transaction</Button>
          </>
        }
      />
      <Stub
        chunk={6}
        what="filters, sortable columns, inline edit, bulk actions, the full table"
      />
    </>
  );
}
