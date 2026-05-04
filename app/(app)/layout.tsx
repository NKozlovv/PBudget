import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { getOrCreateUserBudget, listBudgets } from '@/lib/data/budgets';
import { Sidebar } from '@/components/nav/Sidebar';
import { Topbar } from '@/components/nav/Topbar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    redirect('/login');
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

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
        <main className="flex-1 px-10 py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
