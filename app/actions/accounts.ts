'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
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

export async function createAccountAction(
  input: AccountInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('accounts')
      .insert(input)
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
    const supabase = await createClient();
    const { error } = await supabase.from('accounts').update(patch).eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
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
