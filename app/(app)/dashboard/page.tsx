import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listAccounts } from '@/lib/data/accounts';
import { listTransactions } from '@/lib/data/transactions';
import { BalancePanel } from '@/components/dashboard/BalancePanel';
import { SavingsRatePanel, type SavingsRateMonth } from '@/components/dashboard/SavingsRatePanel';
import { CashFlowPanel } from '@/components/dashboard/CashFlowPanel';
import { SpendingMixPanel } from '@/components/dashboard/SpendingMixPanel';
import { AccountFaceCards, type AccountFaceData } from '@/components/dashboard/AccountFaceCards';
import { workingMonth, monthLong } from '@/lib/dashboard/period';
import {
  totalBalanceEUR,
  monthTotalsEUR,
  accountBalanceEURAt,
  accountBalanceNativeAt,
  accountMonthFlowsNative,
  forecastYear,
  ytdAverages,
  burnRatesEUR,
} from '@/lib/balance';
import { dateToISO, monthName } from '@/lib/date';

export const metadata = { title: 'Overview · Theus' };

export default async function DashboardPage() {
  const budget = await getOrCreateUserBudget();
  const [accounts, allTx] = await Promise.all([
    listAccounts(budget.id),
    listTransactions({ budgetId: budget.id }),
  ]);

  const now = new Date();
  const fxRate = budget.fx_rate;

  // "This month" throughout means the last COMPLETED calendar month
  // (CLAUDE.md §8f) — the budget ring, savings-rate chart, cash-flow YTD
  // totals and spending mix are all anchored here. Account balances and
  // MTD received/spent (§8f exception) stay on the true current date.
  const { year, month } = workingMonth(now);
  const monthLabel = monthLong(month);
  const priorMonth = month === 0 ? 11 : month - 1;
  const priorMonthYear = month === 0 ? year - 1 : year;
  const vsMonthLabel = monthName(priorMonth, true);

  const balanceEUR = totalBalanceEUR({ accounts, transactions: allTx, fxRate });
  const monthTotals = monthTotalsEUR({ transactions: allTx, year, month, fxRate });

  function eomBalanceEUR(y: number, m: number): number {
    const eom = new Date(y, m + 1, 0);
    return accounts.reduce(
      (s, a) => s + accountBalanceEURAt({ account: a, date: dateToISO(eom), transactions: allTx, fxRate }),
      0,
    );
  }
  const workingMonthEomBalance = eomBalanceEUR(year, month);
  const priorMonthEomBalance = eomBalanceEUR(priorMonthYear, priorMonth);
  const monthDelta = workingMonthEomBalance - priorMonthEomBalance;
  const monthPct = priorMonthEomBalance !== 0 ? (monthDelta / Math.abs(priorMonthEomBalance)) * 100 : 0;

  // Cash flow: full Jan–Dec of the current calendar year. Months through
  // the working month are real; the rest are projected at the YTD average.
  const cashFlowYear = now.getFullYear();
  const cashFlowEndMonth = year === cashFlowYear ? month : -1;
  const yearBuckets = forecastYear({
    transactions: allTx,
    year: cashFlowYear,
    endMonth: cashFlowEndMonth,
    fxRate,
  });
  const ytd = ytdAverages({ transactions: allTx, year: cashFlowYear, endMonth: cashFlowEndMonth, fxRate });

  // Balance projected forward to Dec 31 at the YTD average net-savings pace.
  let lastActualBalance = balanceEUR;
  for (let m = 0; m <= cashFlowEndMonth; m++) {
    const eom = new Date(cashFlowYear, m + 1, 0);
    lastActualBalance = accounts.reduce(
      (s, a) => s + accountBalanceEURAt({ account: a, date: dateToISO(eom), transactions: allTx, fxRate }),
      0,
    );
  }
  const monthsRemaining = 11 - cashFlowEndMonth;
  const projectedEOY = lastActualBalance + ytd.avgNet * monthsRemaining;

  const savingsThisYear = ytd.totalNet;
  const savingsIncome = ytd.totalIncome;
  const savingsExpense = ytd.totalExpense;

  const monthlySavingsRates = yearBuckets
    .filter((b) => !b.projected && b.income > 0)
    .map((b) => (b.income - b.expense) / b.income);
  const savingsRateAvg =
    monthlySavingsRates.length > 0
      ? monthlySavingsRates.reduce((s, v) => s + v, 0) / monthlySavingsRates.length
      : 0;

  const savingsRateMonths: SavingsRateMonth[] = yearBuckets
    .filter((b) => !b.projected && b.income > 0)
    .map((b) => ({ label: b.label, pct: ((b.income - b.expense) / b.income) * 100, net: b.income - b.expense }));

  // Spending mix — YTD average monthly spend per category (through the
  // working month), same "typical month" framing as the Categories page.
  const catBurnRates = burnRatesEUR({ transactions: allTx, year, endMonth: month, fxRate, kind: 'expense' });
  const catSlices = catBurnRates.map((r) => ({ name: r.name, value: r.avgMonthly }));
  const catTotal = catSlices.reduce((s, c) => s + c.value, 0);

  // Account cards — top 4 by the user's own sort order, real-time (not
  // workingMonth): a balance and its MTD flows are current-moment figures.
  const today = dateToISO(now);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const accountFaces: AccountFaceData[] = [...accounts]
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4)
    .map((a) => {
      const native = accountBalanceNativeAt({
        accountId: a.id,
        date: today,
        openingBalance: a.opening_balance,
        transactions: allTx,
      });
      const flows = accountMonthFlowsNative({
        accountId: a.id,
        year: currentYear,
        month: currentMonth,
        transactions: allTx,
      });
      return { id: a.id, name: a.name, currency: a.currency, native, received: flows.received, spent: flows.spent };
    });

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] items-stretch gap-5 max-[900px]:grid-cols-1">
        <BalancePanel
          accountCount={accounts.length}
          totalBalance={balanceEUR}
          monthDelta={monthDelta}
          monthPct={monthPct}
          vsMonthLabel={vsMonthLabel}
          spentThisMonth={monthTotals.expense}
          incomeThisMonth={monthTotals.income}
          monthLabelUpper={monthLabel.toUpperCase()}
          avgSavingsRate={savingsRateAvg}
          projectedEOY={projectedEOY}
          avgNet={ytd.avgNet}
          savingsThisYear={savingsThisYear}
          savingsIncome={savingsIncome}
          savingsExpense={savingsExpense}
        />
        <SavingsRatePanel
          months={savingsRateMonths}
          avgRatePct={savingsRateAvg * 100}
          savingsThisYear={savingsThisYear}
        />
      </div>

      <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] gap-5 max-[900px]:grid-cols-1">
        <CashFlowPanel
          months={yearBuckets}
          ytdIncome={savingsIncome}
          ytdExpense={savingsExpense}
          ytdNet={savingsThisYear}
          year={cashFlowYear}
        />
        <SpendingMixPanel slices={catSlices} total={catTotal} />
      </div>

      <AccountFaceCards accounts={accountFaces} />
    </>
  );
}
