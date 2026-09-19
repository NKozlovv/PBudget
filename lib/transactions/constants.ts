/**
 * Shared with both the client (Filters.tsx) and the server-only data layer
 * (lib/data/transactions.ts) — kept in its own module, without
 * `import 'server-only'`, so client components can import it without
 * pulling in the rest of the data layer.
 */

/** Sentinel `category` filter value meaning "no category set" rather than a real category name. */
export const UNCATEGORISED = '__uncategorised__';

/**
 * True `category` is empty (NULL/blank — the app's own convention for "no
 * category") **or** is literal placeholder text like "Uncategorized" —
 * some of this budget's data has that as a real stored string (carried
 * over from the original spreadsheet, where the user used it as their own
 * label), not NULL. Both mean the same thing to a person looking at the
 * list, so both should show up under the "Uncategorised" filter.
 */
export function isUncategorised(category: string | null | undefined): boolean {
  const trimmed = (category ?? '').trim().toLowerCase();
  return trimmed === '' || trimmed === 'uncategorized' || trimmed === 'uncategorised';
}

/** One canonical label for "no category", covering both true blanks and
 * literal placeholder text like "Uncategorized" — used anywhere a category
 * name is grouped/displayed (dashboard mix, burn rates, the ledger), so the
 * app never shows two different-looking buckets for the same thing. */
export function categoryDisplayName(category: string | null | undefined): string {
  return isUncategorised(category) ? 'Uncategorised' : (category ?? '').trim();
}

/** The one category name that unlocks trip-tagging (transactions.trip). */
export const TRAVEL_CATEGORY = 'Travel';

/**
 * True only for the exact "Travel" category (case/whitespace-insensitive) —
 * not a fuzzy "contains travel" match like lib/dashboard/categoryIcon.ts
 * uses for icon guessing. Trip tags are a real, separate DB field, so
 * whether one is allowed needs a precise, predictable answer, not a
 * heuristic that could also fire for something like a hypothetical "Travel
 * insurance" category.
 */
export function isTravelCategory(category: string | null | undefined): boolean {
  return (category ?? '').trim().toLowerCase() === TRAVEL_CATEGORY.toLowerCase();
}

/**
 * A trip tag only ever makes sense on a Travel-category transaction — if a
 * write touches `category` and the new value isn't Travel, `trip` is forced
 * to null regardless of what was passed, so a transaction can never end up
 * tagged under a different (or no) category. Shared by every server action
 * that writes `transactions.category` (app/actions/transactions.ts's
 * create/update/bulkUpdate, and app/actions/categories.ts's
 * reassignCategoryAction, which moves transactions between categories in
 * bulk) so the rule holds everywhere, not just the one form that happens to
 * submit through it today. A patch that doesn't touch `category` at all
 * leaves `trip` alone — untouched fields shouldn't be side-effected.
 */
export function enforceTripRule<T extends { category?: string | null; trip?: string | null }>(
  input: T,
): T {
  if ('category' in input && !isTravelCategory(input.category ?? null)) {
    // Spreading a generic T and overriding one key produces a type TS can't
    // re-verify against T itself (it only knows T's declared constraint,
    // not its full concrete shape) — the cast is the standard escape hatch
    // for that, not a real type hole: every key from `input` is still here
    // unchanged except the `trip` override this function exists to make.
    return { ...input, trip: null } as T;
  }
  return input;
}
