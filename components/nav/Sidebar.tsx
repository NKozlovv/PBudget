import { TheusLockup } from '@/components/auth/TheusMark';
import { Mono } from '@/components/ui';
import { BUILD_DATE, BUILD_VERSION } from '@/lib/version';
import { NavItem } from './NavItem';
import { UserCard } from './UserCard';
import { BudgetSwitcher } from './BudgetSwitcher';
import type { Budget } from '@/lib/supabase/types';
import type { IconName } from '@/components/ui/Icon';

const NAV: { href: string; label: string; icon: IconName; badge?: string }[] = [
  { href: '/dashboard', label: 'Overview', icon: 'home' },
  { href: '/transactions', label: 'Transactions', icon: 'list' },
  { href: '/accounts', label: 'Accounts', icon: 'wallet' },
  { href: '/categories', label: 'Categories', icon: 'tag' },
  { href: '/trends', label: 'Trends', icon: 'pulse' },
  { href: '/forecast', label: 'Forecast', icon: 'chart' },
  { href: '/coach', label: 'Coach', icon: 'sparkle', badge: 'New' },
];

const TOOLS: { href: string; label: string; icon: IconName }[] = [
  { href: '/members', label: 'Members', icon: 'user' },
  { href: '/import', label: 'Import XLSX', icon: 'upload' },
];

/**
 * Left sidebar shell. Modeled on design-refs/src/dashboard.jsx 14-50:
 * 232 px wide, bg-subtle panel, "Manage" group header in mono 0.18em,
 * nav items rounded-lg with surface+line active state, identity card
 * pinned bottom.
 */
export function Sidebar({
  email,
  budgetName,
  baseCurrency,
  budgets,
  activeBudgetId,
}: {
  email: string;
  budgetName: string;
  baseCurrency: string;
  budgets: Budget[];
  activeBudgetId: string;
}) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-8 overflow-y-auto border-r border-line bg-bg-subtle px-4 py-6">
      <div className="px-2 pb-2">
        <TheusLockup size={22} />
      </div>

      <nav className="flex-1">
        <Mono size="xs" className="mb-2 block px-2.5">
          Manage
        </Mono>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((it) => (
            <li key={it.href}>
              <NavItem href={it.href} label={it.label} icon={it.icon} badge={it.badge} />
            </li>
          ))}
        </ul>

        <Mono size="xs" className="mb-2 mt-6 block px-2.5">
          Tools
        </Mono>
        <ul className="flex flex-col gap-0.5">
          {TOOLS.map((it) => (
            <li key={it.href}>
              <NavItem href={it.href} label={it.label} icon={it.icon} />
            </li>
          ))}
        </ul>
      </nav>

      <BudgetSwitcher budgets={budgets} activeId={activeBudgetId} />

      <UserCard email={email} budgetName={budgetName} baseCurrency={baseCurrency} />

      <div className="-mt-3 flex items-center justify-between px-1">
        <Mono size="xs">{BUILD_VERSION}</Mono>
        <Mono size="xs" tone="mute">
          {BUILD_DATE}
        </Mono>
      </div>
    </aside>
  );
}
