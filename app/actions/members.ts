'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import { emailConfigured, sendInviteEmail } from '@/lib/email';
import { getSiteUrl } from '@/lib/site';

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

const INVITE_TTL_MS = 14 * 24 * 3600 * 1000;
const HOURLY_INVITE_CAP = 20;
const EMAIL_RE =/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bumpPaths() {
  revalidatePath('/members');
  revalidatePath('/dashboard');
}

// ─── Actions ───────────────────────────────────────────────────────────

/** What the UI needs after creating/resending an invite. */
export type InviteOutcome = {
  link: string;
  /** False when email isn't configured or the provider rejected it — the owner then copies `link` and sends it themselves. */
  emailed: boolean;
  /** False when no email provider is set up at all (link-sharing mode), as opposed to a send that failed. */
  configured: boolean;
  emailError?: string;
};

async function deliverInvite(
  supabase: Awaited<ReturnType<typeof createClient>>,
  invite: { budget_id: string; email: string; token: string },
  inviterEmail: string,
): Promise<InviteOutcome> {
  const link = `${await getSiteUrl()}/invite/${invite.token}`;
  // No email provider at all → link-sharing mode: nothing to attempt.
  if (!emailConfigured()) return { link, emailed: false, configured: false };
  const { data: budget } = await supabase.from('budgets').select('name').eq('id', invite.budget_id).maybeSingle();
  const sent = await sendInviteEmail({
    to: invite.email,
    inviterEmail,
    budgetName: (budget as { name?: string } | null)?.name ?? 'a budget',
    link,
  });
  return sent.ok
    ? { link, emailed: true, configured: true }
    : { link, emailed: false, configured: true, emailError: sent.error };
}

export async function inviteMemberAction(input: {
  budget_id: string;
  email: string;
}): Promise<ActionResult<InviteOutcome>> {
  if (!isUuid(input.budget_id) || typeof input.email !== 'string') {
    return { ok: false, error: 'Invalid invite.' };
  }
  const email = input.email.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
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

    // The limiter above is per-instance memory and resets on cold starts. This one is durable: an
    // invite can send real email from the site's own mailbox to any address, so cap it per user.
    const { count: recent } = await supabase
      .from('budget_invites')
      .select('id', { count: 'exact', head: true })
      .eq('invited_by', userData.user.id)
      .gte('created_at', new Date(Date.now() - 3600_000).toISOString());
    if ((recent ?? 0) >= HOURLY_INVITE_CAP) {
      return { ok: false, error: 'Too many invites this hour. Try again later.' };
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

    const { data: created, error } = await supabase
      .from('budget_invites')
      .insert({
        budget_id: input.budget_id,
        email,
        invited_by: userData.user.id,
      })
      .select('budget_id, email, token')
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? 'Could not create the invite.' };

    const outcome = await deliverInvite(
      supabase,
      created as { budget_id: string; email: string; token: string },
      userData.user.email ?? 'Someone',
    );
    bumpPaths();
    return { ok: true, data: outcome };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/** Re-sends the email for a pending invite and pushes its expiry out another 14 days (same link). */
export async function resendInviteAction(inviteId: string): Promise<ActionResult<InviteOutcome>> {
  if (!isUuid(inviteId)) return { ok: false, error: 'Invalid invite.' };
  try {
    const supabase = await createClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) return { ok: false, error: 'Not authenticated' };

    const limit = checkRateLimit(userData.user.id);
    if (!limit.ok) return { ok: false, error: `Too many invites. Try again in ${limit.retryInSeconds}s.` };

    // expires_at is pushed to now + 14 days on every send, so (expires_at - 14 days) is the last send
    // time — a durable per-invite throttle that survives cold starts, so one address can't be spammed.
    const { data: current } = await supabase.from('budget_invites').select('expires_at').eq('id', inviteId).maybeSingle();
    if (!current) return { ok: false, error: 'Invite not found.' };
    const lastSent = new Date((current as { expires_at: string }).expires_at).getTime() - INVITE_TTL_MS;
    if (Date.now() - lastSent < 60_000) {
      return { ok: false, error: 'That invite was just sent. Wait a minute before resending.' };
    }

    const { data: invite, error } = await supabase
      .from('budget_invites')
      .update({ expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString() })
      .eq('id', inviteId)
      .select('budget_id, email, token')
      .single();
    if (error || !invite) return { ok: false, error: error?.message ?? 'Invite not found.' };

    const outcome = await deliverInvite(
      supabase,
      invite as { budget_id: string; email: string; token: string },
      userData.user.email ?? 'Someone',
    );
    bumpPaths();
    return { ok: true, data: outcome };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function cancelInviteAction(id: string): Promise<ActionResult> {
  if (!isUuid(id)) return { ok: false, error: 'Invalid invite.' };
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
