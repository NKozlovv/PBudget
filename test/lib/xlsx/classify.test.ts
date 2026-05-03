import { describe, it, expect } from 'vitest';
import {
  classifyExpenseRow,
  classifyIncomeRow,
  isAdjustmentLabel,
  type ParsedExpenseRow,
  type ParsedIncomeRow,
} from '@/lib/xlsx/classify';

const baseExpense: ParsedExpenseRow = {
  amount: 100,
  category: 'Food',
  subcategory: 'Groceries',
  comment: 'Lidl',
  accountName: 'Cash, €',
  currency: 'EUR',
  date: '2026-05-01',
};

const baseIncome: ParsedIncomeRow = {
  amount: 3000,
  typeLabel: 'Salary',
  comment: 'ACME Corp',
  accountName: 'Sparkasse, €',
  currency: 'EUR',
  date: '2026-05-28',
};

/**
 * Regression — CLAUDE.md §8a. Mis-classifying "Account adjustment" rows as
 * expense/income inflates totals (€13,632 in the user's actual data).
 */
describe('xlsx classify — Account adjustment regression', () => {
  it('expense row with category "Account adjustment" classifies as adjustment', () => {
    const row: ParsedExpenseRow = { ...baseExpense, category: 'Account adjustment' };
    const out = classifyExpenseRow(row);
    expect(out.type).toBe('adjustment');
  });

  it('expense-block adjustment is stored with a NEGATIVE amount', () => {
    const row: ParsedExpenseRow = {
      ...baseExpense,
      category: 'Account adjustment',
      amount: 250,
    };
    const out = classifyExpenseRow(row);
    expect(out.amount).toBe(-250);
  });

  it('expense-block adjustment forgets the subcategory', () => {
    const row: ParsedExpenseRow = {
      ...baseExpense,
      category: 'Account adjustment',
      subcategory: 'should-be-dropped',
    };
    const out = classifyExpenseRow(row);
    expect(out.subcategory).toBe('');
  });

  it('income row with type "Account adjustment" classifies as adjustment', () => {
    const row: ParsedIncomeRow = { ...baseIncome, typeLabel: 'Account adjustment' };
    const out = classifyIncomeRow(row);
    expect(out.type).toBe('adjustment');
  });

  it('income-block adjustment is stored with a POSITIVE amount', () => {
    const row: ParsedIncomeRow = {
      ...baseIncome,
      typeLabel: 'Account adjustment',
      amount: 500,
    };
    const out = classifyIncomeRow(row);
    expect(out.amount).toBe(500);
  });

  it('isAdjustmentLabel handles trim and bad input', () => {
    expect(isAdjustmentLabel('Account adjustment')).toBe(true);
    expect(isAdjustmentLabel('  Account adjustment  ')).toBe(true);
    expect(isAdjustmentLabel('Food')).toBe(false);
    expect(isAdjustmentLabel(null)).toBe(false);
    expect(isAdjustmentLabel(undefined)).toBe(false);
  });
});

describe('xlsx classify — non-adjustment paths', () => {
  it('plain expense row classifies as expense, amount positive, sub kept', () => {
    const out = classifyExpenseRow(baseExpense);
    expect(out.type).toBe('expense');
    expect(out.amount).toBe(100);
    expect(out.category).toBe('Food');
    expect(out.subcategory).toBe('Groceries');
  });

  it('expense amount is stored as absolute value (sign comes from type)', () => {
    const out = classifyExpenseRow({ ...baseExpense, amount: -42 });
    expect(out.amount).toBe(42);
    expect(out.type).toBe('expense');
  });

  it('plain income row classifies as income, amount positive', () => {
    const out = classifyIncomeRow(baseIncome);
    expect(out.type).toBe('income');
    expect(out.amount).toBe(3000);
    expect(out.category).toBe('Salary');
    expect(out.subcategory).toBe('');
  });

  it('income amount is stored as absolute value', () => {
    const out = classifyIncomeRow({ ...baseIncome, amount: -3000 });
    expect(out.amount).toBe(3000);
  });
});
