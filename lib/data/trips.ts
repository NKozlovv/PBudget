import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { TripDetails } from '@/lib/supabase/types';

/** Every trip's stored metadata for this budget — small table, no paging needed. */
export async function listTripDetails(budgetId: string): Promise<TripDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trip_details')
    .select('*')
    .eq('budget_id', budgetId);
  if (error) throw error;
  return (data ?? []) as TripDetails[];
}
