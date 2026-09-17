import { txToEUR } from '@/lib/money';
import type { Category, Subcategory, Transaction } from '@/lib/supabase/types';

export interface CategorySummary {
  category: Category;
  /** Spend (or income) in the current month, EUR. */
  thisMonth: number;
  /** YTD monthly average — proxy for "budget" since we don't store one. */
  avgMonthly: number;
  /** YTD total. */
  ytd: number;
  /** Transactions counted in the current month. */
  txCountThisMonth: number;
  /** Number of subcategories. */
  subCount: number;
  /** This-month-vs-avg pct change (this/avg − 1) * 100. Positive = over avg. */
  pctVsAvg: number;
  /** True when thisMonth exceeds avg by ≥1% (used for "over" tinting). */
  over: boolean;
}

export interface SubcategorySummary {
  subcategory: Subcategory;
  thisMonth: number;
  ytd: number;
  /** YTD monthly average — same "budget" proxy as CategorySummary.avgMonthly. */
  avgMonthly: number;
  txCountThisMonth: number;
}

/**
 * Per-category summary for the Categories page.
 *
 * "Budget" is unavailable in the schema; we use YTD monthly average as a
 * proxy ("This month is N% above your YTD average"). monthsElapsed counts
 * the current month inclusively.
 */
export function categoriesSummary(args: {
  categories: Category[];
  subcategoriesById: Record<string, Subcategory[]>;
  transactions: Transaction[];
  fxRate: number;
  kind: 'expense' | 'income';
  year: number;
  month: number; // 0-indexed
}): CategorySummary[] {
  const { categories, subcategoriesById, transactions, fxRate, kind, year, month } = args;
  const monthsElapsed = month + 1;

  // Per-category counters.
  const ytdByName = new Map<string, number>();
  const monthByName = new Map<string, number>();
  const txCountByName = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== kind) continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (y !== year) continue;
    if (mo > month) continue;
    const key = (t.category ?? '').trim();
    if (!key) continue;
    const eur = txToEUR(t, fxRate);
    ytdByName.set(key, (ytdByName.get(key) ?? 0) + eur);
    if (mo === month) {
      monthByName.set(key, (monthByName.get(key) ?? 0) + eur);
      txCountByName.set(key, (txCountByName.get(key) ?? 0) + 1);
    }
  }

  return categories.map((c) => {
    const ytd = ytdByName.get(c.name) ?? 0;
    const thisMonth = monthByName.get(c.name) ?? 0;
    const avgMonthly = monthsElapsed > 0 ? ytd / monthsElapsed : 0;
    const pctVsAvg = avgMonthly > 0 ? (thisMonth / avgMonthly - 1) * 100 : 0;
    return {
      category: c,
      thisMonth,
      avgMonthly,
      ytd,
      txCountThisMonth: txCountByName.get(c.name) ?? 0,
      subCount: (subcategoriesById[c.id] ?? []).length,
      pctVsAvg,
      over: avgMonthly > 0 && thisMonth > avgMonthly * 1.01,
    };
  });
}

/** Per-subcategory summary inside a single category, current month + YTD. */
export function subcategoriesSummary(args: {
  category: Category;
  subcategories: Subcategory[];
  transactions: Transaction[];
  fxRate: number;
  kind: 'expense' | 'income';
  year: number;
  month: number;
}): SubcategorySummary[] {
  const { category, subcategories, transactions, fxRate, kind, year, month } = args;
  const monthsElapsed = month + 1;
  const ytdBySub = new Map<string, number>();
  const monthBySub = new Map<string, number>();
  const txCountBySub = new Map<string, number>();

  for (const t of transactions) {
    if (t.type !== kind) continue;
    if ((t.category ?? '').trim() !== category.name) continue;
    const sub = (t.subcategory ?? '').trim();
    if (!sub) continue;
    const m = /^(\d{4})-(\d{2})-/.exec(t.date);
    if (!m) continue;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    if (y !== year) continue;
    if (mo > month) continue;
    const eur = txToEUR(t, fxRate);
    ytdBySub.set(sub, (ytdBySub.get(sub) ?? 0) + eur);
    if (mo === month) {
      monthBySub.set(sub, (monthBySub.get(sub) ?? 0) + eur);
      txCountBySub.set(sub, (txCountBySub.get(sub) ?? 0) + 1);
    }
  }

  return subcategories.map((s) => {
    const ytd = ytdBySub.get(s.name) ?? 0;
    return {
      subcategory: s,
      thisMonth: monthBySub.get(s.name) ?? 0,
      ytd,
      avgMonthly: monthsElapsed > 0 ? ytd / monthsElapsed : 0,
      txCountThisMonth: txCountBySub.get(s.name) ?? 0,
    };
  });
}
