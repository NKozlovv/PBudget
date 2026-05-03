'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

// ─── Rate limiter ──────────────────────────────────────────────────────
//
// In-memory sliding-window. 10 invites / 60s per signed-in user.
//
// **Production caveat:** on Vercel's serverless model, function instances
// are cold-started and not necessarily reused — so this counter is a
// best-effort speed-bump, not a hard limit. For a real ceiling switch to
// Upstash Redis (or Vercel KV) and key by `${userId}:${ip}`.

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 10;
const rateBucket = new Map<string, number[]>();

function checkRateLimit(userId: string): { ok: boolean; retryInSeconds: number } {
  const now = Date.now();
  const list = (rateBucket.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT) {
    const oldest = list[0]!;
    const retryInSeconds = Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000);
    return { ok: false, retryInSeconds: Math.max(1, retryInSeconds) };
  }
  list.push(now);
  rateBucket.set(userId, list);
  return { ok: true, retryInSeconds: 0 };
}

// ─── Validation ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bumpPaths() {
  revalidatePath('/members');
  revalidatePath('/dashboard');
}

// ─── Actions ───────────────────────────────────────────────────────────

export async function inviteMemberAction(input: {
  budget_id: string;
  email: string;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return { ok: false, error: 'Enter a valid email address.' };
  }

  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    const limit = checkRateLimit(userData.user.id);
    if (!limit.ok) {
      return {
        ok: false,
        error: `Too many invites. Try again in ${limit.retryInSeconds}s.`,
      };
    }

    // Refuse to invite yourself.
    if (userData.user.email && email === userData.user.email.toLowerCase()) {
      return { ok: false, error: 'You\'re already a member.' };
    }

    // De-dup against existing pending invites.
    const { data: existing } = await supabase
      .from('budget_invites')
      .select('id')
      .eq('budget_id', input.budget_id)
      .eq('email', email)
      .maybeSingle();
    if (existing) {
      return { ok: false, error: 'There\'s already a pending invite for that email.' };
    }

    const { error } = await supabase.from('budget_invites').insert({
      budget_id: input.budget_id,
      email,
      invited_by: userData.user.id,
    });
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function cancelInviteAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('budget_invites').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function revokeMemberAction(input: {
  budget_id: string;
  user_id: string;
}): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    // Refuse to remove the budget's owner.
    const { data: budget } = await supabase
      .from('budgets')
      .select('owner_id')
      .eq('id', input.budget_id)
      .maybeSingle();
    if (budget?.owner_id === input.user_id) {
      return {
        ok: false,
        error: 'Can\'t remove the budget owner. Transfer ownership first or delete the budget.',
      };
    }

    const { error } = await supabase
      .from('budget_members')
      .delete()
      .eq('budget_id', input.budget_id)
      .eq('user_id', input.user_id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
