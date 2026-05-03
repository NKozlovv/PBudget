import { TheusLockup } from '@/components/auth/TheusMark';
import { Mono } from '@/components/ui';
import { NavItem } from './NavItem';
import { UserCard } from './UserCard';

const NAV = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/categories', label: 'Categories' },
  { href: '/forecast', label: 'Forecast' },
];

const TOOLS = [{ href: '/import', label: 'Import XLSX' }];

/**
 * Left sidebar shell. Server component — receives identity props from
 * the (app) layout. Active-state highlighting in NavItem (client).
 *
 * Modeled on design-refs/src/dashboard.jsx 14–50: 232 px wide, bgSubtle
 * panel, "Manage" group header in mono, nav items rounded-lg with
 * accent-soft active state, identity card pinned bottom.
 */
export function Sidebar({
  email,
  budgetName,
  baseCurrency,
}: {
  email: string;
  budgetName: string;
  baseCurrency: string;
}) {
  return (
    <aside className="flex flex-col gap-8 border-r border-rule bg-bg-soft px-5 py-7 sticky top-0 h-screen overflow-y-auto">
      <div className="px-3 pb-2">
        <TheusLockup size={22} />
      </div>

      <nav className="flex-1">
        <Mono size="xs" className="px-3 mb-3 block">
          Manage
        </Mono>
        <ul className="flex flex-col gap-0.5">
          {NAV.map((it) => (
            <li key={it.href}>
              <NavItem href={it.href} label={it.label} />
            </li>
          ))}
        </ul>

        <Mono size="xs" className="mt-6 px-3 mb-3 block">
          Tools
        </Mono>
        <ul className="flex flex-col gap-0.5">
          {TOOLS.map((it) => (
            <li key={it.href}>
              <NavItem href={it.href} label={it.label} />
            </li>
          ))}
        </ul>
      </nav>

      <UserCard email={email} budgetName={budgetName} baseCurrency={baseCurrency} />
    </aside>
  );
}
