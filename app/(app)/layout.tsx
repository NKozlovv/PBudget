import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { getOrCreateUserBudget, listBudgets } from '@/lib/data/budgets';
import { TopNav } from '@/components/nav/TopNav';
import { ScreenTransition } from '@/components/nav/ScreenTransition';
import { GlobalAddTransactionModal } from '@/components/transactions/GlobalAddTransactionModal';
import { BUILD_VERSION, BUILD_DATE } from '@/lib/version';

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
    <div className="ambient-ground">
      <div className="ambient-layer">
        <div className="ambient-blob ambient-blob-coral" />
        <div className="ambient-blob ambient-blob-indigo" />
        <div className="ambient-blob ambient-blob-teal" />
      </div>
      <div className="relative z-[1] mx-auto max-w-[1520px] px-[26px] pb-20 pt-5">
        <TopNav email={user.email ?? '—'} budgets={budgets} activeBudgetId={budget.id} />
        <ScreenTransition>{children}</ScreenTransition>
        <div className="mt-10 flex items-center justify-end gap-2 text-[10.5px] font-medium text-ink-mute">
          <span>{BUILD_VERSION}</span>
          <span aria-hidden>·</span>
          <span>{BUILD_DATE}</span>
        </div>
      </div>
      <GlobalAddTransactionModal />
    </div>
  );
}
