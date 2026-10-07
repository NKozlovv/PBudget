/**
 * Sparkasse online-banking CSV export → reviewable rows.
 *
 * Handles: a real quote-aware tokenizer over the whole file (a quoted field may
 * contain a newline), Windows-1252 fallback for older exports, tolerant
 * header matching (CSV-CAMT and MT940 layouts, with or without umlauts),
 * and a sanity bound on the card-payment date pulled out of the
 * Verwendungszweck. Pure — no DOM, no Supabase — so it's unit-tested in
 * test/lib/csv/sparkasse.test.ts.
 *
 * Pending ("Umsatz vorgemerkt") rows are kept, — they're
 * flagged `pending` so the review table can mark them.
 */

export interface SparkasseRow {
  /** 'YYYY-MM-DD' — '' when no date could be resolved (the review table asks for one). */
  date: string;
  /** Cleaned counterparty name (or the start of the Verwendungszweck when there is none). */
  merchant: string;
  /** Signed: negative = money left the account. */
  amount: number;
  currency: string;
  pending: boolean;
}

export interface ParsedSparkasse {
  rows: SparkasseRow[];
  /** 'YYYY-MM' keys present in `rows`, newest first. */
  months: string[];
}

/** Decode raw file bytes — modern exports are UTF-8, older ones Windows-1252 (ISO-8859-1 superset). */
export function decodeCsvBytes(buf: ArrayBuffer): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

/** Semicolon-separated, double-quote-escaped records. Quotes may span newlines. */
export function tokenizeCsv(text: string, sep = ';'): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === sep) {
      record.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += c;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records.filter((r) => r.some((f) => f.trim() !== ''));
}

/** "Beguenstigter/Zahlungspflichtiger" and "Begünstigter/Zahlungspflichtiger" compare equal. */
function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');
}

/** DD.MM.YY or DD.MM.YYYY → 'YYYY-MM-DD'. */
export function parseGermanDate(s: string): string | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{2}|\d{4})$/.exec(s.trim());
  if (!m) return null;
  let y = Number(m[3]);
  if (y < 100) y += 2000;
  return `${y}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
}

/** "-1.234,56" / "−26,14" / "26,14" → number (NaN when unparseable). */
export function parseEuroAmount(s: string): number {
  const clean = s.trim().replace(/−/g, '-').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  if (!/^[+-]?\d+(\.\d+)?$/.test(clean)) return NaN;
  return Number(clean);
}

/** "Kaufland Bad Aibling//Bad Aibling/DE" → "Kaufland Bad Aibling". */
export function cleanMerchant(s: string): string {
  return s.replace(/\/\/.*/, '').replace(/\s+/g, ' ').trim();
}

/** Days from a to b ('YYYY-MM-DD'), computed on UTC dates so DST can't shift it (§8b). */
function dayDiff(a: string, b: string): number {
  const toUTC = (d: string) => Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)));
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/**
 * Card payments carry the real purchase time in the Verwendungszweck
 * ("2026-04-24T16:22 Debitk.12 …"), which is what the user thinks of as
 * the transaction date — the booking date can be days later. Only trusted
 * when it lands shortly before the booking date, so an unrelated ISO date
 * in a transfer's reference text (an invoice date, say) can't hijack it.
 */
function cardDateFromPurpose(purpose: string, booked: string | null): string | null {
  const m = /(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}/.exec(purpose);
  if (!m) return null;
  const iso = `${m[1]}-${m[2]}-${m[3]}`;
  if (!booked) return iso;
  const diff = dayDiff(iso, booked);
  return diff >= 0 && diff <= 14 ? iso : null;
}

export function parseSparkasseCsv(text: string): ParsedSparkasse {
  const records = tokenizeCsv(text.replace(/^﻿/, ''));
  const headerIdx = records.findIndex((r) => r.some((f) => normHeader(f) === 'buchungstag'));
  if (headerIdx < 0) return { rows: [], months: [] };

  const headers = records[headerIdx]!.map(normHeader);
  const col = (...names: string[]) => headers.findIndex((h) => names.includes(h));
  const iBooked = col('buchungstag');
  const iValue = col('valutadatum', 'valuta');
  const iPurpose = col('verwendungszweck');
  const iParty = col('beguenstigterzahlungspflichtiger', 'beguenstigterauftraggeber', 'name');
  const iText = col('buchungstext');
  const iAmount = col('betrag');
  const iCurrency = col('waehrung');
  const iInfo = col('info');
  if (iAmount < 0) return { rows: [], months: [] };

  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');

  const rows: SparkasseRow[] = [];
  for (const r of records.slice(headerIdx + 1)) {
    const amount = parseEuroAmount(get(r, iAmount));
    if (!Number.isFinite(amount) || amount === 0) continue;

    const purpose = get(r, iPurpose);
    const booked = parseGermanDate(get(r, iBooked));
    const date = cardDateFromPurpose(purpose, booked) ?? parseGermanDate(get(r, iValue)) ?? booked ?? '';

    const merchant =
      cleanMerchant(get(r, iParty)) || cleanMerchant(purpose).slice(0, 60) || get(r, iText) || 'Unknown';

    rows.push({
      date,
      merchant,
      amount,
      currency: get(r, iCurrency).toUpperCase() || 'EUR',
      pending: get(r, iInfo).toLowerCase().includes('vorgemerkt'),
    });
  }

  const months = [...new Set(rows.filter((r) => r.date).map((r) => r.date.slice(0, 7)))].sort().reverse();
  return { rows, months };
}

/** Normalized key for "same merchant as a past transaction" lookups. */
export function merchantKey(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Which incoming rows already look imported: same account, same signed
 * amount, date within ±`toleranceDays`. One-to-one — two identical €3.20
 * coffees in the file against one already in the budget flags only one of
 * them. Returns the indexes of `rows` that matched.
 */
export function findLikelyDuplicates(
  rows: Array<{ date: string; amount: number }>,
  existing: Array<{ date: string; amount: number }>,
  toleranceDays = 3,
): Set<number> {
  const used = new Set<number>();
  const dupes = new Set<number>();
  rows.forEach((row, i) => {
    if (!row.date) return;
    let best = -1;
    let bestDiff = Infinity;
    existing.forEach((e, j) => {
      if (used.has(j) || Math.abs(e.amount - row.amount) > 0.005) return;
      const diff = Math.abs(dayDiff(e.date, row.date));
      if (diff <= toleranceDays && diff < bestDiff) {
        best = j;
        bestDiff = diff;
      }
    });
    if (best >= 0) {
      used.add(best);
      dupes.add(i);
    }
  });
  return dupes;
}
