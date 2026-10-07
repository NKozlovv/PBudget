import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listGrants, getSharePrice } from '@/lib/data/rsu';
import { todayInBerlin } from '@/lib/today';
import { RsuClient } from '@/components/rsu/RsuClient';

export const metadata = { title: 'RSU · Theus' };

export default async function RsuPage() {
  const budget = await getOrCreateUserBudget();
  const [grants, sharePrice] = await Promise.all([listGrants(budget.id), getSharePrice(budget.id)]);
  return <RsuClient budgetId={budget.id} grants={grants} sharePrice={sharePrice} today={todayInBerlin()} />;
}
