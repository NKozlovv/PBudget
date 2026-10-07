'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_LABEL, isCurrency, isMoney, isShortText, isUuid } from '@/lib/validation';
import type { Currency } from '@/lib/supabase/types';

export interface AccountInput {
  budget_id: string;
  name: string;
  currency: Currency;
  opening_balance: number;
  sort_order: number;
}

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function bumpPaths() {
  revalidatePath('/accounts');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}

/**
 * Allow-lists and validates the editable account columns. The patch a caller
 * sends goes straight into `.update()`, so unknown keys (`budget_id`, `id`, …)
 * are dropped rather than trusted.
 */
function sanitizeAccountPatch(
  raw: unknown,
): { ok: true; value: Partial<Omit<AccountInput, 'budget_id'>> } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) return { ok: false, error: 'Invalid account.' };
  const r = raw as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(r, k);
  const out: Partial<Omit<AccountInput, 'budget_id'>> = {};
  if (has('name')) {
    const name = typeof r.name === 'string' ? r.name.trim() : '';
    if (!name || !isShortText(name, MAX_LABEL)) return { ok: false, error: 'Enter a valid account name.' };
    out.name = name;
  }
  if (has('currency')) {
    if (!isCurrency(r.currency)) return { ok: false, error: 'Invalid currency.' };
    out.currency = r.currency;
  }
  if (has('opening_balance')) {
    if (!isMoney(r.opening_balance)) return { ok: false, error: 'Invalid opening balance.' };
    out.opening_balance = r.opening_balance;
  }
  if (has('sort_order')) {
    if (typeof r.sort_order !== 'number' || !Number.isInteger(r.sort_order) || Math.abs(r.sort_order) > 1e6) {
      return { ok: false, error: 'Invalid sort order.' };
    }
    out.sort_order = r.sort_order;
  }
  return { ok: true, value: out };
}

export async function createAccountAction(
  input: AccountInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    if (!isUuid(input?.budget_id)) return { ok: false, error: 'Invalid budget.' };
    const clean = sanitizeAccountPatch(input);
    if (!clean.ok) return clean;
    const { name, currency, opening_balance, sort_order } = clean.value;
    if (name === undefined || currency === undefined) {
      return { ok: false, error: 'Name and currency are required.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('accounts')
      .insert({
        budget_id: input.budget_id,
        name,
        currency,
        opening_balance: opening_balance ?? 0,
        sort_order: sort_order ?? 0,
      })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function updateAccountAction(
  id: string,
  patch: Partial<Omit<AccountInput, 'budget_id'>>,
): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, error: 'Invalid account.' };
    const clean = sanitizeAccountPatch(patch);
    if (!clean.ok) return clean;

    const supabase = await createClient();
    const { error } = await supabase.from('accounts').update(clean.value).eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    if (!isUuid(id)) return { ok: false, error: 'Invalid account.' };
    const supabase = await createClient();

    // Count first so a blocked delete can tell the user exactly how many
    // transactions are in the way, rather than a generic "can't delete."
    const { count } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('account_id', id);
    if (count && count > 0) {
      return {
        ok: false,
        error: `This account still has ${count} transaction${count === 1 ? '' : 's'}. Reassign or delete them first.`,
      };
    }

    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      // FK constraint safety net (e.g. a transaction was added between the
      // count above and this delete) → same friendly message, no count.
      if (error.message.toLowerCase().includes('foreign key')) {
        return {
          ok: false,
          error: 'This account still has transactions. Reassign or delete them first.',
        };
      }
      return { ok: false, error: error.message };
    }
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
