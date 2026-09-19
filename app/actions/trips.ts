'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Upserts the one piece of per-trip metadata a free-text trip tag can't
 * hold on its own (lib/supabase/types.ts's TripDetails). Keyed by
 * (budget_id, trip) rather than an id — there's no `trips` row to attach
 * this to.
 */
export async function setTripTravelersAction(input: {
  budget_id: string;
  trip: string;
  travelers: number;
}): Promise<ActionResult> {
  const travelers = Math.floor(input.travelers);
  if (!Number.isFinite(travelers) || travelers < 1) {
    return { ok: false, error: 'Travelers must be at least 1.' };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('trip_details')
      .upsert(
        { budget_id: input.budget_id, trip: input.trip, travelers },
        { onConflict: 'budget_id,trip' },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath('/trips');
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
