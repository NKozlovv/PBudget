import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { getOrCreateUserBudget, listBudgets } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listCategorySubcategoryPairs } from '@/lib/data/transactions';
import {
  mostUsedSubcategoryByCategory,
  subcategoriesByCategoryName,
} from '@/lib/categories/formOptions';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';
import { GlobalAddTransactionModal } from '@/components/transactions/GlobalAddTransactionModal';
import type { Subcategory } from '@/lib/supabase/types';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/login');
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  const [budget, budgets] = await Promise.all([getOrCreateUserBudget(), listBudgets()]);
  const [accounts, expenseCats, incomeCats, subcategories, subPairs] = await Promise.all([
    listAccounts(budget.id),
    listCategories(budget.id, 'expense'),
    listCategories(budget.id, 'income'),
    listSubcategoriesForBudget(budget.id),
    listCategorySubcategoryPairs(budget.id),
  ]);

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of subcategories) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }
  const subcategoriesByCategory = subcategoriesByCategoryName(
    [...expenseCats, ...incomeCats],
    subcategoriesById,
  );
  const mostUsedSubcategory = mostUsedSubcategoryByCategory(subPairs);

  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr]">
      <Sidebar
        email={user.email ?? '—'}
        budgetName={budget.name}
        baseCurrency={budget.base_currency}
        budgets={budgets}
        activeBudgetId={budget.id}
      />
      <div className="flex min-w-0 flex-col">
        <Topbar fxRate={budget.fx_rate} baseCurrency={budget.base_currency} />
        <main className="flex-1 px-10 py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <GlobalAddTransactionModal
        budgetId={budget.id}
        accounts={accounts}
        expenseCats={expenseCats}
        incomeCats={incomeCats}
        subcategoriesByCategory={subcategoriesByCategory}
        mostUsedSubcategory={mostUsedSubcategory}
      />
    </div>
  );
}
