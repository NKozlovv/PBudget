import { txToEUR } from '@/lib/money';
import { monthName } from '@/lib/date';
import type { Category, Subcategory, Transaction } from '@/lib/supabase/types';

export interface TrendMonth {
  year: number;
  /** 0-indexed. */
  month: number;
  label: string;
}

export interface SubcategoryTrendRow {
  name: string;
  /** EUR total per month, aligned with the `months` array passed in. */
  values: number[];
  total: number;
}

export interface CategoryTrendRow {
  category: Category;
  values: number[];
  total: number;
  subs: SubcategoryTrendRow[];
}

/** Add `delta` to `arr[idx]`, safe under `noUncheckedIndexedAccess`. */
function bump(arr: number[], idx: number, delta: number): void {
  arr[idx] = (arr[idx] ?? 0) + delta;
}

/** `count` consecutive months ending at (endYear, endMonth) inclusive, oldest first. */
export function buildTrendMonths(endYear: number, endMonth: number, count: number): TrendMonth[] {
  const out: TrendMonth[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(endYear, endMonth - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    out.push({ year: y, month: m, label: `${monthName(m, true)} ${String(y).slice(2)}` });
  }
  return out;
}

/**
 * Per-category (and per-subcategory) EUR totals for each month in `months`.
 * Categories are sorted by total spend (desc) across the window; each
 * category's subcategories are sorted the same way and dropped entirely if
 * they had zero activity across the window (keeps the table focused).
 */
export function categoryMonthlyTrend(args: {
  categories: Category[];
  subcategoriesById: Record<string, Subcategory[]>;
  transactions: Transaction[];
  fxRate: number;
  months: TrendMonth[];
  kind: 'expense' | 'income';
}): CategoryTrendRow[] {
  const { categories, subcategoriesById, transactions, fxRate, months, kind } = args;
  const monthIndex = new Map<string, number>();
  months.forEach((m, i) => monthIndex.set(`${m.year}-${m.month}`, i));

  const catValues = new Map<string, number[]>();
  const subValues = new Map<string, number[]>(); // key: `${category}::${subcategory}`

  for (const t of transactions) {
    if (t.type !== kind) continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    const idx = monthIndex.get(`${Number(m[1])}-${Number(m[2]) - 1}`);
    if (idx === undefined) continue;
    const cat = (t.category ?? '').trim();
    if (!cat) continue;
    const eur = txToEUR(t, fxRate);

    if (!catValues.has(cat)) catValues.set(cat, new Array(months.length).fill(0));
    bump(catValues.get(cat)!, idx, eur);

    const sub = (t.subcategory ?? '').trim();
    if (sub) {
      const key = `${cat}::${sub}`;
      if (!subValues.has(key)) subValues.set(key, new Array(months.length).fill(0));
      bump(subValues.get(key)!, idx, eur);
    }
  }

  const rows = categories.map((c) => {
    const values = catValues.get(c.name) ?? new Array(months.length).fill(0);
    const total = values.reduce((s, v) => s + v, 0);
    const subs: SubcategoryTrendRow[] = (subcategoriesById[c.id] ?? [])
      .map((s) => {
        const vals = subValues.get(`${c.name}::${s.name}`) ?? new Array(months.length).fill(0);
        return { name: s.name, values: vals, total: vals.reduce((a, b) => a + b, 0) };
      })
      .filter((s) => Math.abs(s.total) > 0.005)
      .sort((a, b) => b.total - a.total);
    return { category: c, values, total, subs };
  });

  return rows.sort((a, b) => b.total - a.total);
}
