import 'server-only';
import { isIsoDate } from '@/lib/validation';

/**
 * Frankfurter API client + in-memory cache for historical USD→EUR rates.
 *
 * Cache lives for the lifetime of the server process;
 * cheaper than re-fetching every USD transaction's rate on import.
 */

const cache = new Map<string, number>();

const BASE = 'https://api.frankfurter.dev/v1';
const CHUNK = 10;
/** Entries are tiny, but the key space is user-influenced — never let it grow without bound. */
const MAX_CACHE = 5000;

async function fetchOne(date: string): Promise<number | null> {
  try {
    const res = await fetch(`${BASE}/${date}?from=USD&to=EUR`, {
      // Frankfurter returns the latest available rate for non-trading days
      // automatically. No need to walk back manually.
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { rates?: { EUR?: number } };
    const rate = data?.rates?.EUR;
    return typeof rate === 'number' && Number.isFinite(rate) && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

export async function getHistoricalRate(date: string): Promise<number | null> {
  // `date` goes straight into the request path — only ever fetch a real YYYY-MM-DD.
  if (!isIsoDate(date)) return null;
  const hit = cache.get(date);
  if (hit != null) return hit;
  const rate = await fetchOne(date);
  if (rate != null) {
    if (cache.size >= MAX_CACHE) cache.clear();
    cache.set(date, rate);
  }
  return rate;
}

/**
 * Fetch rates for many dates in chunks. Returns a Map<date, rate>
 * containing only the dates that resolved successfully.
 */
export async function getHistoricalRates(dates: string[]): Promise<Map<string, number>> {
  const unique = [...new Set(dates)];
  const out = new Map<string, number>();
  for (let i = 0; i < unique.length; i += CHUNK) {
    const batch = unique.slice(i, i + CHUNK);
    const results = await Promise.all(batch.map((d) => getHistoricalRate(d)));
    batch.forEach((d, idx) => {
      const r = results[idx];
      if (r != null) out.set(d, r);
    });
  }
  return out;
}
