import { describe, it, expect } from 'vitest';
import {
  cleanMerchant,
  findLikelyDuplicates,
  parseEuroAmount,
  parseGermanDate,
  parseSparkasseCsv,
  tokenizeCsv,
} from '@/lib/csv/sparkasse';

const HEADER =
  '"Auftragskonto";"Buchungstag";"Valutadatum";"Buchungstext";"Verwendungszweck";"Glaeubiger ID";"Mandatsreferenz";"Kundenreferenz (End-to-End)";"Sammlerreferenz";"Lastschrift Ursprungsbetrag";"Auslagenersatz Ruecklastschrift";"Beguenstigter/Zahlungspflichtiger";"Kontonummer/IBAN";"BIC (SWIFT-Code)";"Betrag";"Waehrung";"Info"';

function line(f: {
  booked: string;
  value?: string;
  text?: string;
  purpose?: string;
  party?: string;
  amount: string;
  info?: string;
}): string {
  const cols = [
    'DE00',
    f.booked,
    f.value ?? f.booked,
    f.text ?? 'KARTENZAHLUNG',
    f.purpose ?? '',
    '',
    '',
    '',
    '',
    '',
    '',
    f.party ?? '',
    '',
    '',
    f.amount,
    'EUR',
    f.info ?? 'Umsatz gebucht',
  ];
  return cols.map((c) => `"${c.replace(/"/g, '""')}"`).join(';');
}

describe('helpers', () => {
  it('parses German dates with 2- and 4-digit years', () => {
    expect(parseGermanDate('24.04.26')).toBe('2026-04-24');
    expect(parseGermanDate('01.01.2026')).toBe('2026-01-01');
    expect(parseGermanDate('garbage')).toBeNull();
  });

  it('parses euro amounts with thousand separators and unicode minus', () => {
    expect(parseEuroAmount('-26,14')).toBe(-26.14);
    expect(parseEuroAmount('−26,14')).toBe(-26.14);
    expect(parseEuroAmount('1.234,56')).toBe(1234.56);
    expect(parseEuroAmount('')).toBeNaN();
    expect(parseEuroAmount('abc')).toBeNaN();
  });

  it('strips the //City/Country suffix from merchants', () => {
    expect(cleanMerchant('Kaufland Bad Aibling//Bad Aibling/DE')).toBe('Kaufland Bad Aibling');
    expect(cleanMerchant('  REWE   Markt ')).toBe('REWE Markt');
  });

  it('keeps quoted newlines and escaped quotes inside one field', () => {
    expect(tokenizeCsv('"a";"b\nc";"d ""x"""\r\n"e";"f";"g"')).toEqual([
      ['a', 'b\nc', 'd "x"'],
      ['e', 'f', 'g'],
    ]);
  });
});

describe('parseSparkasseCsv', () => {
  it('reads rows, signed amounts, merchants and months', () => {
    const csv = [
      HEADER,
      line({ booked: '28.04.26', party: 'Kaufland Bad Aibling//Bad Aibling/DE', amount: '-26,14' }),
      line({ booked: '30.04.26', text: 'GUTSCHRIFT', party: 'ACME GmbH', amount: '2.500,00' }),
      line({ booked: '02.05.26', party: 'REWE', amount: '-12,00' }),
    ].join('\r\n');
    const { rows, months } = parseSparkasseCsv('﻿' + csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ date: '2026-04-28', merchant: 'Kaufland Bad Aibling', amount: -26.14, pending: false });
    expect(rows[1]).toMatchObject({ merchant: 'ACME GmbH', amount: 2500 });
    expect(months).toEqual(['2026-05', '2026-04']);
  });

  it('prefers the card-payment timestamp in the Verwendungszweck', () => {
    const csv = [
      HEADER,
      line({ booked: '28.04.26', purpose: '2026-04-24T16:22 Debitk.12 2028-12', party: 'Shop', amount: '-5,00' }),
    ].join('\n');
    expect(parseSparkasseCsv(csv).rows[0]?.date).toBe('2026-04-24');
  });

  it('ignores an unrelated ISO date far from the booking date', () => {
    const csv = [
      HEADER,
      line({ booked: '28.04.26', purpose: 'Rechnung 2025-01-03T00:00', party: 'Vendor', amount: '-50,00' }),
    ].join('\n');
    expect(parseSparkasseCsv(csv).rows[0]?.date).toBe('2026-04-28');
  });

  it('keeps pending (vorgemerkt) rows and flags them', () => {
    const csv = [HEADER, line({ booked: '', value: '', party: 'Shop', amount: '-1,00', info: 'Umsatz vorgemerkt' })].join(
      '\n',
    );
    const { rows } = parseSparkasseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.pending).toBe(true);
    expect(rows[0]?.date).toBe('');
  });

  it('accepts umlaut headers and skips preamble lines', () => {
    const csv = [
      '"Umsätze Girokonto";"Zeitraum: 01.04.2026 - 30.04.2026"',
      '"Buchungstag";"Valutadatum";"Begünstigter/Zahlungspflichtiger";"Betrag"',
      '"03.04.2026";"03.04.2026";"Bäckerei";"-3,20"',
    ].join('\n');
    expect(parseSparkasseCsv(csv).rows).toEqual([
      { date: '2026-04-03', merchant: 'Bäckerei', amount: -3.2, currency: 'EUR', pending: false },
    ]);
  });

  it('returns nothing for a file without a Sparkasse header', () => {
    expect(parseSparkasseCsv('a;b;c\n1;2;3')).toEqual({ rows: [], months: [] });
  });
});

describe('findLikelyDuplicates', () => {
  it('matches one-to-one by amount within the date tolerance', () => {
    const rows = [
      { date: '2026-04-10', amount: -3.2 },
      { date: '2026-04-10', amount: -3.2 },
      { date: '2026-04-10', amount: -9.99 },
      { date: '2026-04-20', amount: -50 },
    ];
    const existing = [
      { date: '2026-04-11', amount: -3.2 },
      { date: '2026-04-01', amount: -50 },
    ];
    expect([...findLikelyDuplicates(rows, existing)]).toEqual([0]);
  });
});
