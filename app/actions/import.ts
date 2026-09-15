'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { parseXlsx } from '@/lib/xlsx/parse';
import { getHistoricalRates } from '@/lib/fx';

export interface ImportSummary {
  accounts: { created: number; reused: number };
  categories: { expense: number; income: number };
  subcategories: number;
  transactions: { inserted: number; expense: number; income: number; adjustment: number };
  fx: { fetched: number };
  dropped: number;
  warnings: string[];
}

export type ImportResult = { ok: true; data: ImportSummary } | { ok: false; error: string };

const TX_BATCH = 250;

/**
 * Parse an uploaded XLSX, classify rows (CLAUDE.md §8a), preflight
 * historical FX rates for USD transactions, and bulk-insert everything
 * into the active budget.
 */
export async function importXlsxAction(formData: FormData): Promise<ImportResult> {
  try {
    const file = formData.get('file');
    const importYear = Number(formData.get('importYear') ?? new Date().getFullYear());
    if (!(file instanceof File)) return { ok: false, error: 'No file provided.' };
    if (file.size === 0) return { ok: false, error: 'File is empty.' };
    if (file.size > 25 * 1024 * 1024) return { ok: false, error: 'File too large (>25MB).' };

    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };
    const userId = userData.user.id;

    // Resolve the active budget (mirrors getOrCreateUserBudget but inline so we
    // don't import a server-only module from another server-only module — both
    // are 'server-only' but Next is happier when actions don't import 'server-only'
    // helpers transitively).
    const { data: budgets, error: bErr } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);
    if (bErr) return { ok: false, error: bErr.message };
    const budget = budgets?.[0];
    if (!budget) return { ok: false, error: 'No active budget. Create one first.' };
    const budgetId = budget.id as string;

    // ---- Parse ----
    const buf = await file.arrayBuffer();
    const parsed = parseXlsx(buf, importYear);

    if (parsed.transactions.length === 0) {
      return {
        ok: false,
        error:
          'No transactions found. Check the workbook has month sheets named "January", "February", … with the expected layout.',
      };
    }

    // ---- Accounts (upsert by name within this budget) ----
    const { data: existingAccs, error: accErr } = await supabase
      .from('accounts')
      .select('id, name, currency, opening_balance')
      .eq('budget_id', budgetId);
    if (accErr) return { ok: false, error: accErr.message };
    const existingAccMap = new Map<string, { id: string }>();
    for (const a of existingAccs ?? []) {
      existingAccMap.set((a as { name: string }).name, { id: (a as { id: string }).id });
    }

    let accountsCreated = 0;
    let accountsReused = 0;
    const accountIdByName = new Map<string, string>();
    let sortIdx = (existingAccs?.length ?? 0);

    for (const [name, info] of parsed.accounts) {
      const existing = existingAccMap.get(name);
      if (existing) {
        accountIdByName.set(name, existing.id);
        accountsReused++;
        continue;
      }
      const { data, error } = await supabase
        .from('accounts')
        .insert({
          budget_id: budgetId,
          name,
          currency: info.currency,
          opening_balance: info.opening_balance,
          sort_order: sortIdx++,
        })
        .select('id')
        .single();
      if (error) return { ok: false, error: `Account "${name}": ${error.message}` };
      accountIdByName.set(name, (data as { id: string }).id);
      accountsCreated++;
    }

    // ---- Categories + subcategories ----
    const { data: existingCats } = await supabase
      .from('categories')
      .select('id, name, kind')
      .eq('budget_id', budgetId);
    const existingCatMap = new Map<string, { id: string; kind: string }>();
    for (const c of existingCats ?? []) {
      const row = c as { id: string; name: string; kind: string };
      existingCatMap.set(`${row.kind}:${row.name}`, { id: row.id, kind: row.kind });
    }

    let expenseCatsCreated = 0;
    let incomeCatsCreated = 0;
    let subsCreated = 0;
    const expenseCatIdByName = new Map<string, string>();
    const incomeCatIdByName = new Map<string, string>();

    for (const [name, subs] of parsed.expenseCategories) {
      let id = existingCatMap.get(`expense:${name}`)?.id;
      if (!id) {
        const { data, error } = await supabase
          .from('categories')
          .insert({ budget_id: budgetId, name, kind: 'expense' })
          .select('id')
          .single();
        if (error) return { ok: false, error: `Category "${name}": ${error.message}` };
        id = (data as { id: string }).id;
        expenseCatsCreated++;
      }
      expenseCatIdByName.set(name, id);

      // Subcategories — fetch existing for this category, only insert new.
      const { data: existingSubs } = await supabase
        .from('subcategories')
        .select('name')
        .eq('category_id', id);
      const have = new Set((existingSubs ?? []).map((s: { name: string }) => s.name));
      const newSubs = [...subs].filter((s) => !have.has(s));
      if (newSubs.length > 0) {
        const { error } = await supabase
          .from('subcategories')
          .insert(newSubs.map((sName) => ({ category_id: id, name: sName })));
        if (error) return { ok: false, error: `Subcategories for "${name}": ${error.message}` };
        subsCreated += newSubs.length;
      }
    }

    for (const name of parsed.incomeTypes) {
      let id = existingCatMap.get(`income:${name}`)?.id;
      if (!id) {
        const { data, error } = await supabase
          .from('categories')
          .insert({ budget_id: budgetId, name, kind: 'income' })
          .select('id')
          .single();
        if (error) return { ok: false, error: `Income type "${name}": ${error.message}` };
        id = (data as { id: string }).id;
        incomeCatsCreated++;
      }
      incomeCatIdByName.set(name, id);
    }

    // ---- FX preflight: USD tx dates need historical rates ----
    const usdDates = parsed.transactions
      .filter((t) => t.currency === 'USD')
      .map((t) => t.date);
    const rateMap = usdDates.length > 0 ? await getHistoricalRates(usdDates) : new Map<string, number>();

    // ---- Bulk insert transactions ----
    const rows = parsed.transactions.map((t) => ({
      budget_id: budgetId,
      date: t.date,
      type: t.type,
      amount: t.amount,
      currency: t.currency,
      fx_rate: t.currency === 'USD' ? (rateMap.get(t.date) ?? null) : null,
      category: t.category || null,
      subcategory: t.subcategory || null,
      account_id: accountIdByName.get(t.accountName) ?? null,
      comment: t.comment || null,
      created_by: userId,
    }));

    let inserted = 0;
    for (let i = 0; i < rows.length; i += TX_BATCH) {
      const batch = rows.slice(i, i + TX_BATCH);
      const { error } = await supabase.from('transactions').insert(batch);
      if (error) {
        return {
          ok: false,
          error: `Insert failed at batch ${Math.floor(i / TX_BATCH) + 1}: ${error.message}. ${inserted} rows had been inserted before this batch.`,
        };
      }
      inserted += batch.length;
    }

    revalidatePath('/transactions');
    revalidatePath('/dashboard');
    revalidatePath('/accounts');
    revalidatePath('/categories');
    revalidatePath('/forecast');

    const warnings: string[] = [];
    const usdMissing = usdDates.length - rateMap.size;
    if (usdMissing > 0) {
      warnings.push(
        `${usdMissing} USD transaction date${usdMissing === 1 ? '' : 's'} could not be priced from Frankfurter — those transactions will fall back to the budget's live FX rate.`,
      );
    }
    if (parsed.dropped.length > 0) {
      warnings.push(
        `${parsed.dropped.length} row${parsed.dropped.length === 1 ? '' : 's'} skipped (missing account or unparseable date).`,
      );
    }

    const typeCounts = { expense: 0, income: 0, adjustment: 0 };
    for (const t of parsed.transactions) typeCounts[t.type]++;

    return {
      ok: true,
      data: {
        accounts: { created: accountsCreated, reused: accountsReused },
        categories: { expense: expenseCatsCreated, income: incomeCatsCreated },
        subcategories: subsCreated,
        transactions: { inserted, ...typeCounts },
        fx: { fetched: rateMap.size },
        dropped: parsed.dropped.length,
        warnings,
      },
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unexpected error during import.',
    };
  }
}
