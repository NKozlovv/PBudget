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
