'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import {
  mostUsedSubcategoryByCategory,
  subcategoriesByCategoryName,
} from '@/lib/categories/formOptions';
import type { Account, Category, Subcategory } from '@/lib/supabase/types';

const ACTIVE_BUDGET_COOKIE = 'theus.active-budget';

export interface TransactionFormData {
  budgetId: string;
  accounts: Account[];
  expenseCats: Category[];
  incomeCats: Category[];
  subcategoriesByCategory: Record<string, string[]>;
  mostUsedSubcategory: Record<string, string>;
}

/**
 * Everything GlobalAddTransactionModal needs, fetched lazily when the
 * modal actually opens instead of eagerly in (app)/layout.tsx on every
 * single navigation. The layout used to run this (5 extra Supabase
 * queries: accounts, 2x categories, subcategories, category/subcategory
 * pairs) on *every* page load and every filter click, just to support a
 * shortcut that's used occasionally — a real contributor to "pages feel
 * slow". Inlines the queries (rather than importing lib/data/*) per the
 * existing note in app/actions/import.ts about actions not importing
 * 'server-only' data-layer modules transitively; this also respects the
 * active-budget cookie (import.ts's version doesn't — it always resolves
 * to the oldest budget, which is fine for that one-shot import flow but
 * would silently create transactions in the wrong budget here for anyone
 * who's switched budgets).
 */
export async function getTransactionFormDataAction(): Promise<TransactionFormData | null> {
  const supabase = await createClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) return null;

  const { data: budgets, error: bErr } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: true });
  if (bErr || !budgets || budgets.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_BUDGET_COOKIE)?.value;
  const active = (activeId && budgets.find((b) => (b as { id: string }).id === activeId)) || budgets[0];
  const budgetId = (active as { id: string }).id;

  const [accountsRes, allCatsRes, pairsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('*')
      .eq('budget_id', budgetId)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('categories').select('*').eq('budget_id', budgetId).order('name', { ascending: true }),
    supabase
      .from('transactions')
      .select('category, subcategory')
      .eq('budget_id', budgetId)
      .not('subcategory', 'is', null),
  ]);
  if (accountsRes.error || allCatsRes.error || pairsRes.error) return null;

  const allCats = (allCatsRes.data ?? []) as Category[];
  const expenseCats = allCats.filter((c) => c.kind === 'expense');
  const incomeCats = allCats.filter((c) => c.kind === 'income');

  const catIds = allCats.map((c) => c.id);
  const subsRes =
    catIds.length > 0
      ? await supabase.from('subcategories').select('*').in('category_id', catIds).order('name', { ascending: true })
      : { data: [] as Subcategory[], error: null };
  if (subsRes.error) return null;

  const subcategoriesById: Record<string, Subcategory[]> = {};
  for (const s of (subsRes.data ?? []) as Subcategory[]) {
    if (!subcategoriesById[s.category_id]) subcategoriesById[s.category_id] = [];
    subcategoriesById[s.category_id]!.push(s);
  }

  return {
    budgetId,
    accounts: (accountsRes.data ?? []) as Account[],
    expenseCats,
    incomeCats,
    subcategoriesByCategory: subcategoriesByCategoryName(allCats, subcategoriesById),
    mostUsedSubcategory: mostUsedSubcategoryByCategory(
      (pairsRes.data ?? []) as Array<{ category: string | null; subcategory: string | null }>,
    ),
  };
}
