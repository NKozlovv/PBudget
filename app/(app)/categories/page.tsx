import { PageHeader } from '@/components/nav/PageHeader';
import { Stub } from '@/components/nav/Stub';
import { Button } from '@/components/ui';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listCategories } from '@/lib/data/categories';

export const metadata = { title: 'Categories · Theus' };

export default async function CategoriesPage() {
  const budget = await getOrCreateUserBudget();
  const [expense, income] = await Promise.all([
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
  ]);

  return (
    <>
      <PageHeader
        kicker="taxonomy"
        title="Categories"
        meta={`${expense.length} expense · ${income.length} income.`}
        actions={<Button>+ Add category</Button>}
      />
      <Stub
        chunk={8}
        what="full lists with subcategories, spend totals, drill-down modal with monthly trends"
      />
    </>
  );
}
