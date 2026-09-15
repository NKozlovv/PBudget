/**
 * Shared with both the client (Filters.tsx) and the server-only data layer
 * (lib/data/transactions.ts) — kept in its own module, without
 * `import 'server-only'`, so client components can import it without
 * pulling in the rest of the data layer.
 */

/** Sentinel `category` filter value meaning "no category set" rather than a real category name. */
export const UNCATEGORISED = '__uncategorised__';
