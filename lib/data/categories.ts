import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Category, Subcategory, CategoryKind } from '@/lib/supabase/types';

export async function listCategories(
  budgetId: string,
  kind?: CategoryKind,
): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase.from('categories').select('*').eq('budget_id', budgetId);
  if (kind) query = query.eq('kind', kind);
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

/** All subcategories under any category in the given budget. */
export async function listSubcategoriesForBudget(budgetId: string): Promise<Subcategory[]> {
  const cats = await listCategories(budgetId);
  if (cats.length === 0) return [];
  return listSubcategories(cats.map((c) => c.id));
}

export async function listSubcategories(categoryIds: string[]): Promise<Subcategory[]> {
  if (categoryIds.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subcategories')
    .select('*')
    .in('category_id', categoryIds)
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Subcategory[];
}
