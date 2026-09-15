import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { getOrCreateUserBudget, listBudgets } from '@/lib/data/budgets';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';
import { GlobalAddTransactionModal } from '@/components/transactions/GlobalAddTransactionModal';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/login');
  }
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  // This layout re-runs on *every* navigation (it's fully dynamic — reads
  // cookies via createClient()), so keep it to exactly what every page
  // needs. Data specific to one feature (e.g. the add-transaction form)
  // belongs in that feature, fetched on demand — see
  // GlobalAddTransactionModal / app/actions/transactionFormData.ts, which
  // used to be fetched here and made every single page navigation pay for
  // 5 extra queries.
  //
  // getOrCreateUserBudget()/listBudgets() are `cache()`-wrapped (see
  // lib/data/budgets.ts), and getAuthUser() above is too — every page
  // under this layout calls getOrCreateUserBudget() again for its own
  // fxRate/budgetId, and that used to mean a second full
  // getUser()+listBudgets() round trip per navigation for an answer
  // already sitting right here.
  const [budget, budgets] = await Promise.all([getOrCreateUserBudget(), listBudgets()]);

  return (
    <div className="grid min-h-screen grid-cols-[232px_1fr]">
      <Sidebar
        email={user.email ?? '—'}
        budgetName={budget.name}
        baseCurrency={budget.base_currency}
        budgets={budgets}
        activeBudgetId={budget.id}
      />
      <div className="flex min-w-0 flex-col">
        <Topbar fxRate={budget.fx_rate} baseCurrency={budget.base_currency} />
        <main className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
          <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px]">{children}</div>
        </main>
      </div>
      <GlobalAddTransactionModal />
    </div>
  );
}
