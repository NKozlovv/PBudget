import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listCategorySubcategoryPairs, listTransactions } from '@/lib/data/transactions';
import { TransactionsClient } from '@/components/transactions/TransactionsClient';
import {
  mostUsedSubcategoryByCategory,
  subcategoriesByCategoryName,
} from '@/lib/categories/formOptions';
import type { Subcategory } from '@/lib/supabase/types';

export const metadata = { title: 'Transactions · Theus' };

/**
 * Server-side, this page now only fetches — every filter, sort, and "load
 * more" interaction is handled client-side by TransactionsClient (see its
 * own doc comment). No `searchParams` needed any more: filtering used to be
 * URL-param-driven, which meant a full server round trip (this page's
 * entire Promise.all, ~6 queries) on every single filter click.
 */
export default async function TransactionsPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, expenseCats, incomeCats, subcategories, allTransactions, subPairs] =
    await Promise.all([
      listAccounts(budget.id),
      listCategories(budget.id, 'expense'),
      listCategories(budget.id, 'income'),
      listSubcategoriesForBudget(budget.id),
      listTransactions({ budgetId: budget.id }),
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
    <TransactionsClient
      allTransactions={allTransactions}
      accounts={accounts}
      expenseCats={expenseCats}
      incomeCats={incomeCats}
      subcategories={subcategories}
      subcategoriesByCategory={subcategoriesByCategory}
      mostUsedSubcategory={mostUsedSubcategory}
      budgetId={budget.id}
      budgetFxRate={budget.fx_rate}
    />
  );
}
