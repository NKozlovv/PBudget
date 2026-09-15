import type { Category, Subcategory } from '@/lib/supabase/types';

/** Category name → its subcategory names (for the Add/Edit transaction form). */
export function subcategoriesByCategoryName(
  categories: Category[],
  subcategoriesById: Record<string, Subcategory[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const c of categories) {
    out[c.name] = (subcategoriesById[c.id] ?? []).map((s) => s.name);
  }
  return out;
}

/**
 * Category name → its most-frequently-used subcategory name, from a list
 * of (category, subcategory) pairs (either full transactions or a lighter
 * projection of just those two columns). Used to pre-select a sensible
 * subcategory as soon as the user picks a category on the transaction form.
 */
export function mostUsedSubcategoryByCategory(
  rows: Array<{ category: string | null; subcategory: string | null }>,
): Record<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const cat = (row.category ?? '').trim();
    const sub = (row.subcategory ?? '').trim();
    if (!cat || !sub) continue;
    if (!counts.has(cat)) counts.set(cat, new Map());
    const bySub = counts.get(cat)!;
    bySub.set(sub, (bySub.get(sub) ?? 0) + 1);
  }
  const out: Record<string, string> = {};
  for (const [cat, bySub] of counts) {
    let best = '';
    let bestCount = 0;
    for (const [sub, n] of bySub) {
      if (n > bestCount) {
        best = sub;
        bestCount = n;
      }
    }
    if (best) out[cat] = best;
  }
  return out;
}
