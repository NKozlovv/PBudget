import 'server-only';

/**
 * Daily price history for the one tracked asset, from Yahoo's public chart
 * endpoint (no key). The Investing page needs the *history*, not just the
 * latest price: month-end and year-end values are shares-held × that day's
 * close, so no snapshot table is needed.
 *
 * Cached by Next's fetch cache for 12h — "updated once a day" is the
 * product requirement. Unofficial endpoint: any failure resolves to null
 * and the page degrades to the last lot's price instead of erroring.
 */

export const TRACKED_SYMBOL = 'WEBN.DE'; // Amundi Prime All Country World UCITS ETF Acc, Xetra, EUR
export const TRACKED_TICKER = 'WEBN';

export interface PricePoint {
  date: string; // YYYY-MM-DD, exchange-local
  close: number;
}

export interface MarketData {
  /** Latest price (live-ish during market hours, else last close). */
  price: number;
  /** Exchange-local date the latest price belongs to. */
  asOf: string;
  /** Last close strictly before `asOf` — the base for the "today" change. */
  prevClose: number;
  /** Ascending daily closes. */
  history: PricePoint[];
}

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: { regularMarketPrice?: number; regularMarketTime?: number; gmtoffset?: number };
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

function localDate(epochSeconds: number, gmtoffset: number): string {
  // Shift to exchange-local wall time, then read the UTC fields.
  return new Date((epochSeconds + gmtoffset) * 1000).toISOString().slice(0, 10);
}

export async function getMarketData(symbol = TRACKED_SYMBOL): Promise<MarketData | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=max&interval=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Theus/1.0)' }, next: { revalidate: 43200 }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as YahooChart;
    const r = json.chart?.result?.[0];
    const ts = r?.timestamp;
    const closes = r?.indicators?.quote?.[0]?.close;
    if (!r || !ts || !closes) return null;
    const off = r.meta?.gmtoffset ?? 0;

    const history: PricePoint[] = [];
    ts.forEach((t, i) => {
      const c = closes[i];
      if (typeof c === 'number' && Number.isFinite(c) && c > 0) history.push({ date: localDate(t, off), close: c });
    });
    const last = history[history.length - 1];
    if (!last) return null;

    const live = r.meta?.regularMarketPrice;
    const liveTime = r.meta?.regularMarketTime;
    const price = typeof live === 'number' && live > 0 ? live : last.close;
    const asOf = typeof liveTime === 'number' ? localDate(liveTime, off) : last.date;

    // Make sure today's live price is the final history point, so
    // value-at-date lookups for "today" agree with the headline number.
    const prior = history.filter((p) => p.date < asOf);
    const prevClose = prior[prior.length - 1]?.close ?? price;
    const trimmed = history.filter((p) => p.date < asOf);
    trimmed.push({ date: asOf, close: price });

    return { price, asOf, prevClose, history: trimmed };
  } catch {
    return null;
  }
}
