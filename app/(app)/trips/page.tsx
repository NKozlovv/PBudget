import { PageHeader } from '@/components/nav/PageHeader';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import { listTransactions } from '@/lib/data/transactions';
import { listCategories, listSubcategories } from '@/lib/data/categories';
import { listTripDetails } from '@/lib/data/trips';
import { tripSummaries } from '@/lib/trips/summary';
import { TRAVEL_CATEGORY, isTravelCategory } from '@/lib/transactions/constants';
import { TripsClient } from '@/components/trips/TripsClient';

export const metadata = { title: 'Trips · Theus' };

export default async function TripsPage() {
  const budget = await getOrCreateUserBudget();
  // Not filtered by category here — isTravelCategory() is case/whitespace-
  // tolerant (matching TransactionForm/enforceTripRule elsewhere), and an
  // exact-match `.eq('category', 'Travel')` server-side filter could
  // silently miss real trip-tagged rows if the category was ever stored
  // with different casing. tripSummaries() does the actual filtering.
  const [transactions, expenseCats, tripDetails] = await Promise.all([
    listTransactions({ budgetId: budget.id }),
    listCategories(budget.id, 'expense'),
    listTripDetails(budget.id),
  ]);

  const travelCategory = expenseCats.find((c) => isTravelCategory(c.name));
  const travelSubcategories = travelCategory ? await listSubcategories([travelCategory.id]) : [];

  const trips = tripSummaries({
    transactions,
    travelSubcategories,
    tripDetails,
    fxRate: budget.fx_rate,
  });

  if (trips.length === 0) {
    return (
      <>
        <PageHeader
          title="Trips"
          meta={`Tag a "${TRAVEL_CATEGORY}" transaction with a trip name — from the transaction form or by bulk-editing existing rows — and it'll show up here.`}
        />
        <div className="glass glass-nohover !rounded-[34px] p-12 text-center text-[13px] font-medium text-ink-mute">
          {`Nothing tagged yet. Once a ${TRAVEL_CATEGORY.toLowerCase()} expense has a trip name on it, it'll show up here — ranked, broken down by subcategory, and compared per day and per person.`}
        </div>
      </>
    );
  }

  // PageHeader renders inside TripsClient (not here) so it can share a
  // grid row with CompareByBar — see that component's own comment for why.
  return <TripsClient budgetId={budget.id} trips={trips} />;
}
