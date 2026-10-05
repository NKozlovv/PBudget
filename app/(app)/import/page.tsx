import { PageHeader } from '@/components/nav/PageHeader';
import { SparkasseImport, type ImportContext } from '@/components/import/SparkasseImport';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listCategories, listSubcategoriesForBudget } from '@/lib/data/categories';
import { listTransactions } from '@/lib/data/transactions';
import { accountBalanceNativeAt } from '@/lib/balance';
import { signedAmount } from '@/lib/money';
import { dateToISO } from '@/lib/date';
import { merchantKey } from '@/lib/csv/sparkasse';
import { mostUsedSubcategoryByCategory } from '@/lib/categories/formOptions';

export const metadata = { title: 'Import · Theus' };

export default async function ImportPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, categories, subcategories, transactions] = await Promise.all([
    listAccounts(budget.id),
    listCategories(budget.id),
    listSubcategoriesForBudget(budget.id),
    // Every transaction (paginated — CLAUDE.md §8g): balances, duplicate
    // checks and per-merchant category suggestions all need full history.
    listTransactions({ budgetId: budget.id }),
  ]);

  const today = dateToISO(new Date());
  const catNameById = new Map(categories.map((c) => [c.id, c.name]));
  const subcategoriesByCategory: Record<string, string[]> = {};
  for (const s of subcategories) {
    const name = catNameById.get(s.category_id);
    if (name) (subcategoriesByCategory[name] ??= []).push(s.name);
  }

  // Merchant → how it was booked last time. Sparkasse rows are stored with
  // the merchant as the comment, so a re-seen merchant comes back
  // pre-categorised. Transactions arrive newest first; first hit wins.
  const suggestions: ImportContext['suggestions'] = {};
  const existingByAccount: ImportContext['existingByAccount'] = {};
  for (const t of transactions) {
    const key = merchantKey(t.comment);
    if (key && !suggestions[key] && t.type !== 'adjustment' && t.category) {
      suggestions[key] = { type: t.type, category: t.category, subcategory: t.subcategory ?? '' };
    }
    if (t.account_id) {
      (existingByAccount[t.account_id] ??= []).push({ date: t.date, amount: signedAmount(t) });
    }
  }

  const context: ImportContext = {
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      balance: accountBalanceNativeAt({
        accountId: a.id,
        date: today,
        openingBalance: a.opening_balance,
        transactions,
      }),
    })),
    expenseCategories: categories.filter((c) => c.kind === 'expense').map((c) => c.name),
    incomeCategories: categories.filter((c) => c.kind === 'income').map((c) => c.name),
    subcategoriesByCategory,
    mostUsedSubcategory: mostUsedSubcategoryByCategory(transactions),
    suggestions,
    existingByAccount,
  };

  return (
    <>
      <PageHeader
        title="Import from Sparkasse"
        meta="Drop the CSV export from Sparkasse online banking, pick a month, then review every row before it's added."
      />
      <SparkasseImport context={context} />
    </>
  );
}
