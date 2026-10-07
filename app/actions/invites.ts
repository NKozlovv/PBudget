'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_BUDGET_COOKIE } from '@/lib/data/budgets';
import { isUuid } from '@/lib/safeNext';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const MESSAGES: Record<string, string> = {
  not_authenticated: 'Sign in first, then open the invite link again.',
  invite_not_found: 'This invite was already used or cancelled.',
  invite_expired: 'This invite has expired. Ask for a new one.',
  email_not_confirmed: 'Confirm your email address first (check your inbox), then open the invite link again.',
  email_mismatch: 'This invite was sent to a different email address than the one you’re signed in with.',
};

/**
 * Accepts an invite via the `accept_invite` database function, which checks
 * the token and that the signed-in account owns the invited (confirmed)
 * address. Then switches the active budget to the one just joined.
 */
export async function acceptInviteAction(token: string): Promise<ActionResult> {
  if (!isUuid(token)) return { ok: false, error: MESSAGES.invite_not_found! };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('accept_invite', { p_token: token });
    if (error) {
      const key = Object.keys(MESSAGES).find((k) => error.message.includes(k));
      return { ok: false, error: key ? MESSAGES[key]! : error.message };
    }
    if (typeof data === 'string') {
      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_BUDGET_COOKIE, data, {
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    revalidatePath('/', 'layout');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
