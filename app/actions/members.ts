'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isUuid } from '@/lib/validation';
import { getSiteUrl } from '@/lib/site';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVITE_TTL_MS = 14 * 24 * 3600 * 1000;
/** Invites are just rows, but cap creation per user so nobody can flood the table. Durable (counted in the DB), unlike an in-memory limiter on serverless. */
const HOURLY_INVITE_CAP = 20;

function bumpPaths() {
  revalidatePath('/members');
  revalidatePath('/dashboard');
}

/**
 * Invites are shared by link: the owner copies `/invite/<token>` and sends it
 * themselves. The link works once, only for the invited address (checked by
 * accept_invite() in the database), and expires after 14 days.
 */
export type InviteOutcome = { link: string };

async function inviteLink(token: string): Promise<InviteOutcome> {
  return { link: `${await getSiteUrl()}/invite/${token}` };
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
      .select('token')
      .single();
    if (error || !created) return { ok: false, error: error?.message ?? 'Could not create the invite.' };

    bumpPaths();
    return { ok: true, data: await inviteLink((created as { token: string }).token) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/** Pushes a pending invite's expiry out another 14 days and returns its (unchanged) link. */
export async function renewInviteAction(inviteId: string): Promise<ActionResult<InviteOutcome>> {
  if (!isUuid(inviteId)) return { ok: false, error: 'Invalid invite.' };
  try {
    const supabase = await createClient();
    const { data: invite, error } = await supabase
      .from('budget_invites')
      .update({ expires_at: new Date(Date.now() + INVITE_TTL_MS).toISOString() })
      .eq('id', inviteId)
      .select('token')
      .single();
    if (error || !invite) return { ok: false, error: error?.message ?? 'Invite not found.' };

    bumpPaths();
    return { ok: true, data: await inviteLink((invite as { token: string }).token) };
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
