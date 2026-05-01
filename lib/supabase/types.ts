/**
 * Hand-written Supabase schema types.
 *
 * Source of truth: CLAUDE.md §4. Should be regenerated via the
 * Supabase CLI (`supabase gen types typescript`) once we set up the
 * tooling — for now this is faithful to the live schema.
 */

export type TxType = 'expense' | 'income' | 'adjustment';
export type CategoryKind = 'expense' | 'income';
export type BudgetRole = 'owner' | 'member';
export type Currency = 'EUR' | 'USD';

export interface Budget {
  id: string;
  name: string;
  owner_id: string;
  fx_rate: number;
  base_currency: Currency;
  created_at: string;
}

export interface BudgetMember {
  budget_id: string;
  user_id: string;
  role: BudgetRole;
}

export interface BudgetInvite {
  id: string;
  budget_id: string;
  email: string;
  invited_by: string;
  created_at: string;
}

export interface Account {
  id: string;
  budget_id: string;
  name: string;
  currency: Currency;
  opening_balance: number;
  sort_order: number;
}

export interface Category {
  id: string;
  budget_id: string;
  name: string;
  kind: CategoryKind;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Transaction {
  id: string;
  budget_id: string;
  date: string; // 'YYYY-MM-DD'
  type: TxType;
  amount: number;
  currency: Currency;
  fx_rate: number | null;
  category: string | null;
  subcategory: string | null;
  account_id: string | null;
  comment: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
