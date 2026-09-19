'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { TRAVEL_CATEGORY } from '@/lib/transactions/constants';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Renames a trip by moving every transaction's `trip` text from oldName to
 * newName — same "text label, not a row" identity as everywhere else (see
 * lib/transactions/constants.ts). If newName already belongs to a different
 * trip, this merges the two (their transactions become one trip) — the same
 * semantics renameCategoryAction/reassignCategoryAction already use for
 * categories, just applied to trip tags.
 */
export async function renameTripAction(input: {
  budget_id: string;
  oldName: string;
  newName: string;
}): Promise<ActionResult> {
  const newName = input.newName.trim();
  if (!newName) return { ok: false, error: 'Trip name is required.' };
  if (newName === input.oldName) return { ok: true, data: undefined };

  try {
    const supabase = await createClient();
    const { error: txErr } = await supabase
      .from('transactions')
      .update({ trip: newName })
      .eq('budget_id', input.budget_id)
      .eq('category', TRAVEL_CATEGORY)
      .eq('trip', input.oldName);
    if (txErr) return { ok: false, error: txErr.message };

    // Best-effort: if newName is an existing trip (a merge), moving this
    // trip's trip_details row onto it would collide with the (budget_id,
    // trip) primary key. The merge target's own dates/travelers win in that
    // case — drop this trip's override rather than fail a rename that
    // already succeeded on the visible (transactions) side.
    const { error: detailsErr } = await supabase
      .from('trip_details')
      .update({ trip: newName })
      .eq('budget_id', input.budget_id)
      .eq('trip', input.oldName);
    if (detailsErr) {
      await supabase.from('trip_details').delete().eq('budget_id', input.budget_id).eq('trip', input.oldName);
    }

    revalidatePath('/trips');
    revalidatePath('/transactions');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/**
 * Upserts the per-trip metadata a free-text trip tag can't hold on its own
 * (lib/supabase/types.ts's TripDetails): traveler count and an explicit
 * date-range override. Keyed by (budget_id, trip) rather than an id —
 * there's no `trips` row to attach this to. start_date/end_date are always
 * included in the upsert (even as null) so clearing a date field back to
 * "let it derive from transactions" actually takes — a partial payload
 * would leave the old override in place instead (see lib/trips/summary.ts).
 */
export async function setTripDetailsAction(input: {
  budget_id: string;
  trip: string;
  travelers: number;
  start_date: string | null;
  end_date: string | null;
}): Promise<ActionResult> {
  const travelers = Math.floor(input.travelers);
  if (!Number.isFinite(travelers) || travelers < 1) {
    return { ok: false, error: 'Travelers must be at least 1.' };
  }
  const start = input.start_date?.trim() || null;
  const end = input.end_date?.trim() || null;
  if (start && !DATE_RE.test(start)) return { ok: false, error: 'Invalid start date.' };
  if (end && !DATE_RE.test(end)) return { ok: false, error: 'Invalid end date.' };
  if (start && end && start > end) return { ok: false, error: 'Start date must be before end date.' };
  if ((start && !end) || (!start && end)) {
    return { ok: false, error: 'Set both dates, or leave both blank to estimate from transactions.' };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('trip_details').upsert(
      { budget_id: input.budget_id, trip: input.trip, travelers, start_date: start, end_date: end },
      { onConflict: 'budget_id,trip' },
    );
    if (error) return { ok: false, error: error.message };
    revalidatePath('/trips');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
