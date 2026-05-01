import { describe, it, expect } from 'vitest';
import { fmtEUR, fmtUSD, fmtCurrency, txToEUR, signedAmount } from '@/lib/money';
import type { Transaction } from '@/lib/supabase/types';

function tx(partial: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    budget_id: 'b1',
    date: '2026-05-01',
    type: 'expense',
    amount: 100,
    currency: 'EUR',
    fx_rate: null,
    category: null,
    subcategory: null,
    account_id: null,
    comment: null,
    created_by: null,
    created_at: '2026-05-01T00:00:00Z',
    updated_at: '2026-05-01T00:00:00Z',
    ...partial,
  };
}

describe('money — formatting', () => {
  it('fmtEUR formats positive and negative with the right sign char', () => {
    expect(fmtEUR(1234.5)).toBe('€1,234.50');
    expect(fmtEUR(-1234.5)).toBe('€−1,234.50');
  });

  it('fmtEUR honors noSymbol', () => {
    expect(fmtEUR(1234.5, { noSymbol: true })).toBe('1,234.50');
  });

  it('fmtEUR compact mode for thousands and millions', () => {
    expect(fmtEUR(1500, { compact: true })).toBe('€1.5k');
    expect(fmtEUR(2_500_000, { compact: true })).toBe('€2.5M');
    // below 1000: not compacted
    expect(fmtEUR(950, { compact: true })).toBe('€950.00');
  });

  it('fmtUSD uses dollar sign', () => {
    expect(fmtUSD(42)).toBe('$42.00');
  });

  it('fmtCurrency dispatches by currency', () => {
    expect(fmtCurrency(10, 'EUR')).toBe('€10.00');
    expect(fmtCurrency(10, 'USD')).toBe('$10.00');
    expect(fmtCurrency(10, 'GBP')).toBe('10.00');
  });

  it('handles non-finite amounts gracefully', () => {
    expect(fmtEUR(Number.NaN)).toBe('€—');
    expect(fmtEUR(Number.POSITIVE_INFINITY)).toBe('€—');
  });
});

describe('money — txToEUR', () => {
  it('returns the amount as-is for EUR transactions', () => {
    expect(txToEUR(tx({ currency: 'EUR', amount: 50 }), 1.07)).toBe(50);
  });

  it('uses the per-tx fx_rate when present (USD → EUR)', () => {
    // 100 USD * 0.92 = 92 EUR
    const result = txToEUR(tx({ currency: 'USD', amount: 100, fx_rate: 0.92 }), 1.0);
    expect(result).toBeCloseTo(92, 5);
  });

  it('falls back to the budget rate when fx_rate is null', () => {
    const result = txToEUR(tx({ currency: 'USD', amount: 100, fx_rate: null }), 0.85);
    expect(result).toBeCloseTo(85, 5);
  });

  it('falls back when fx_rate is non-finite or non-positive', () => {
    expect(txToEUR(tx({ currency: 'USD', amount: 100, fx_rate: 0 }), 0.85)).toBeCloseTo(85, 5);
    expect(txToEUR(tx({ currency: 'USD', amount: 100, fx_rate: -1 }), 0.85)).toBeCloseTo(85, 5);
  });
});

describe('money — signedAmount', () => {
  it('expense → negative', () => {
    expect(signedAmount({ type: 'expense', amount: 100 })).toBe(-100);
  });

  it('income → positive', () => {
    expect(signedAmount({ type: 'income', amount: 100 })).toBe(100);
  });

  it('adjustment → as-is (sign already encoded)', () => {
    // CLAUDE.md §8a: imported expense-block adjustments are stored negative,
    // income-block adjustments stored positive — DO NOT negate.
    expect(signedAmount({ type: 'adjustment', amount: -50 })).toBe(-50);
    expect(signedAmount({ type: 'adjustment', amount: 50 })).toBe(50);
  });
});
