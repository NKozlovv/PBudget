'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

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
