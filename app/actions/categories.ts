'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { enforceTripRule } from '@/lib/transactions/constants';
import type { CategoryKind } from '@/lib/supabase/types';

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function bumpPaths() {
  revalidatePath('/categories');
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
}

// ─── Categories ───────────────────────────────────────────────────────

export async function createCategoryAction(input: {
  budget_id: string;
  name: string;
  kind: CategoryKind;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Name is required.' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .insert({ budget_id: input.budget_id, name, kind: input.kind })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/**
 * Renaming a category cascades to transactions because
 * `transactions.category` is a free-text column, not a FK.
 */
export async function renameCategoryAction(input: {
  id: string;
  budget_id: string;
  oldName: string;
  newName: string;
}): Promise<ActionResult> {
  const newName = input.newName.trim();
  if (!newName) return { ok: false, error: 'Name is required.' };
  if (newName === input.oldName) return { ok: true, data: undefined };
  try {
    const supabase = await createClient();
    const { error: catErr } = await supabase
      .from('categories')
      .update({ name: newName })
      .eq('id', input.id);
    if (catErr) return { ok: false, error: catErr.message };
    const { error: txErr } = await supabase
      .from('transactions')
      .update({ category: newName })
      .eq('budget_id', input.budget_id)
      .eq('category', input.oldName);
    if (txErr) return { ok: false, error: txErr.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/**
 * Delete a category. Subcategories cascade via FK. Existing transactions
 * referencing this category by name keep their text label (they'll just
 * not match any active category in the picker until reassigned).
 */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

/**
 * Move every transaction labelled `oldName` over to `newName` for this budget.
 * Used when the user wants to consolidate/rename without touching the
 * categories table itself.
 */
export async function reassignCategoryAction(input: {
  budget_id: string;
  oldName: string;
  newName: string;
}): Promise<ActionResult> {
  if (!input.newName.trim()) return { ok: false, error: 'Target name is required.' };
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('transactions')
      .update(enforceTripRule({ category: input.newName.trim() }))
      .eq('budget_id', input.budget_id)
      .eq('category', input.oldName);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

// ─── Subcategories ────────────────────────────────────────────────────

export async function createSubcategoryAction(input: {
  category_id: string;
  name: string;
}): Promise<ActionResult<{ id: string }>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: 'Name is required.' };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('subcategories')
      .insert({ category_id: input.category_id, name })
      .select('id')
      .single();
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: { id: data.id as string } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function renameSubcategoryAction(input: {
  id: string;
  budget_id: string;
  parentCategoryName: string;
  oldName: string;
  newName: string;
}): Promise<ActionResult> {
  const newName = input.newName.trim();
  if (!newName) return { ok: false, error: 'Name is required.' };
  if (newName === input.oldName) return { ok: true, data: undefined };
  try {
    const supabase = await createClient();
    const { error: subErr } = await supabase
      .from('subcategories')
      .update({ name: newName })
      .eq('id', input.id);
    if (subErr) return { ok: false, error: subErr.message };
    const { error: txErr } = await supabase
      .from('transactions')
      .update({ subcategory: newName })
      .eq('budget_id', input.budget_id)
      .eq('category', input.parentCategoryName)
      .eq('subcategory', input.oldName);
    if (txErr) return { ok: false, error: txErr.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}

export async function deleteSubcategoryAction(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    bumpPaths();
    return { ok: true, data: undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Unexpected error' };
  }
}
