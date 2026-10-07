'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getHistoricalRates } from '@/lib/fx';
import { MAX_COMMENT, MAX_LABEL, isIsoDate, isMoney, isShortText, isTxType, isUuid } from '@/lib/validation';
import type { TxType } from '@/lib/supabase/types';

export interface ImportRowInput {
  date: string;
  type: TxType;
  /** Signed, as it appears on the statement: negative = money left the account. */
  amount: number;
  category: string | null;
  subcategory: string | null;
  comment: string | null;
}

export type ImportResult = { ok: true; data: { inserted: number } } | { ok: false; error: string };

/** Runtime check — the types above are erased at the network boundary. */
function isValidRow(r: ImportRowInput): boolean {
  if (typeof r !== 'object' || r === null) return false;
  if (!isIsoDate(r.date) || !isTxType(r.type) || !isMoney(r.amount) || r.amount === 0) return false;
  for (const [v, max] of [[r.category, MAX_LABEL], [r.subcategory, MAX_LABEL], [r.comment, MAX_COMMENT]] as const) {
    if (v !== null && !isShortText(v, max)) return false;
  }
  return true;
}

const TX_BATCH = 250;
/** One statement is a few hundred rows; this also keeps the payload under the server-action body limit. */
const MAX_ROWS = 5000;

/**
 * Insert the rows the user kept on the Sparkasse review screen into one
 * account. The budget and currency come from the account itself (read
 * through RLS), so a row can never land in a budget the caller isn't a
 * member of.
 */
export async function importSparkasseAction(input: {
  accountId: string;
  rows: ImportRowInput[];
}): Promise<ImportResult> {
  try {
    const { accountId, rows } = input;
    if (!isUuid(accountId) || !Array.isArray(rows)) return { ok: false, error: 'Invalid import.' };
    if (rows.length === 0) return { ok: false, error: 'Nothing selected to import.' };
    if (rows.length > MAX_ROWS) return { ok: false, error: `Import at most ${MAX_ROWS} rows at a time.` };

    const bad = rows.findIndex((r) => !isValidRow(r));
    if (bad >= 0) return { ok: false, error: `Row ${bad + 1} needs a valid date and a non-zero amount.` };

    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    const { data: account, error: accErr } = await supabase
      .from('accounts')
      .select('id, budget_id, currency')
      .eq('id', accountId)
      .single();
    if (accErr || !account) return { ok: false, error: 'Account not found.' };
    const { budget_id: budgetId, currency } = account as { budget_id: string; currency: 'EUR' | 'USD' };

    const rateMap =
      currency === 'USD' ? await getHistoricalRates(rows.map((r) => r.date)) : new Map<string, number>();

    const inserts = rows.map((r) => ({
      budget_id: budgetId,
      date: r.date,
      type: r.type,
      // Expense/income store a positive magnitude (direction lives in `type`);
      // adjustments keep the sign — see signedAmount() in lib/money.ts.
      amount: r.type === 'adjustment' ? r.amount : Math.abs(r.amount),
      currency,
      fx_rate: currency === 'USD' ? (rateMap.get(r.date) ?? null) : null,
      category: r.type === 'adjustment' ? null : r.category?.trim() || null,
      subcategory: r.type === 'adjustment' ? null : r.subcategory?.trim() || null,
      trip: null,
      account_id: accountId,
      comment: r.comment?.trim() || null,
      created_by: userData.user.id,
    }));

    let inserted = 0;
    for (let i = 0; i < inserts.length; i += TX_BATCH) {
      const batch = inserts.slice(i, i + TX_BATCH);
      const { error } = await supabase.from('transactions').insert(batch);
      if (error) {
        return {
          ok: false,
          error: `Insert failed after ${inserted} of ${inserts.length} rows: ${error.message}`,
        };
      }
      inserted += batch.length;
    }

    for (const p of ['/dashboard', '/transactions', '/accounts', '/categories', '/trends', '/forecast', '/import']) {
      revalidatePath(p);
    }
    return { ok: true, data: { inserted } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
