import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listLots, getPlan } from '@/lib/data/investing';
import { getMarketData, TRACKED_TICKER } from '@/lib/market';
import { todayInBerlin } from '@/lib/today';
import { InvestingClient } from '@/components/investing/InvestingClient';

export const metadata = { title: 'Investing · Theus' };

export default async function InvestingPage() {
  const budget = await getOrCreateUserBudget();
  const [lots, plan, market] = await Promise.all([
    listLots(budget.id),
    getPlan(budget.id),
    getMarketData(),
  ]);
  return (
    <InvestingClient
      budgetId={budget.id}
      ticker={TRACKED_TICKER}
      lots={lots}
      plan={plan}
      market={market}
      today={todayInBerlin()}
    />
  );
}
