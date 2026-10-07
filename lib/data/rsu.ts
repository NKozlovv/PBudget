import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { RsuGrant } from '@/lib/supabase/types';

export async function listGrants(budgetId: string): Promise<RsuGrant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rsu_grants')
    .select('*')
    .eq('budget_id', budgetId)
    .order('start_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as RsuGrant[];
}

/** The hand-typed share price in EUR; 0 until the user sets it. */
export async function getSharePrice(budgetId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('rsu_settings')
    .select('share_price')
    .eq('budget_id', budgetId)
    .maybeSingle();
  if (error) throw error;
  return Number((data as { share_price?: number } | null)?.share_price ?? 0);
}
