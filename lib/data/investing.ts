import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { InvestmentLot } from '@/lib/supabase/types';

/** Saved projection sliders + scenarios (stored as one jsonb blob per budget). */
export interface SavedPlan {
  p?: {
    contrib: number;
    inc: number;
    yield: number;
    spread: number;
    horizon: number;
    overrides: Record<string, number>;
  };
  saved?: { name: string; contrib: number; inc: number; yield: number; overrides: Record<string, number> }[];
}

/** A person's lots are tens of rows, not thousands — no paging needed (cf. CLAUDE.md §8g, which is about transactions). */
export async function listLots(budgetId: string): Promise<InvestmentLot[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('investment_lots')
    .select('*')
    .eq('budget_id', budgetId)
    .order('date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as InvestmentLot[];
}

export async function getPlan(budgetId: string): Promise<SavedPlan> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('investment_plans')
    .select('plan')
    .eq('budget_id', budgetId)
    .maybeSingle();
  if (error) throw error;
  return ((data as { plan?: SavedPlan } | null)?.plan ?? {}) as SavedPlan;
}
