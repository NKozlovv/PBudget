'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon, IconButton, type IconName } from '@/components/ui';
import { useDismissable } from '@/components/ui/useDismissable';
import { BudgetSwitcher } from './BudgetSwitcher';
import { SignOutButton } from '@/components/auth/SignOutButton';
import type { Budget } from '@/lib/supabase/types';

const TABS: { href: string; label: string }[] = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/accounts', label: 'Accounts' },
  { href: '/categories', label: 'Categories' },
  { href: '/trends', label: 'Trends' },
  { href: '/forecast', label: 'Forecast' },
];

const MORE: { href: string; label: string; icon: IconName }[] = [
  { href: '/coach', label: 'Coach', icon: 'sparkle' },
  { href: '/members', label: 'Members', icon: 'user' },
  { href: '/import', label: 'Import XLSX', icon: 'upload' },
];

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._+-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

const tabClass = (active: boolean) =>
  cn(
    'whitespace-nowrap rounded-full px-[18px] py-[9px] text-[14px] font-semibold',
    'transition-[background,color,transform,box-shadow] duration-200 ease-theus',
    active
      ? 'bg-indigo text-white [box-shadow:0_8px_20px_rgba(74,92,224,.35)]'
      : 'text-ink-mute hover:-translate-y-px hover:bg-white/[0.85]',
  );

/**
 * Floating glass top nav — replaces the sidebar (design_handoff_theus_
 * rehaul README "App shell"). Chrome, not content: `.glass-nohover`, it
 * never takes the level-1 panel hover.
 *
 * The mockup only designs tabs for Overview/Transactions/Categories/
 * Trends. Accounts and Forecast get full tabs too (same weight as the
 * designed screens); Coach/Members/Import — lower-frequency routes —
 * live behind "More" so the bar stays one row at every width.
 */
export function TopNav({
  email,
  budgets,
  activeBudgetId,
}: {
  email: string;
  budgets: Budget[];
  activeBudgetId: string;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const moreRef = useDismissable<HTMLDivElement>(moreOpen, () => setMoreOpen(false));
  const accountRef = useDismissable<HTMLDivElement>(accountOpen, () => setAccountOpen(false));

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const moreActive = MORE.some((m) => isActive(m.href));
  const initials = initialsFromEmail(email);

  return (
    <nav className="glass glass-nohover sticky top-[14px] z-20 flex items-center gap-5 !rounded-full py-3 pl-5 pr-4">
      <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,#f2708f,#4a5ce0)] text-[15px] font-extrabold text-white">
          T
        </span>
        <span className="text-[17px] font-extrabold -tracking-[0.02em] text-ink">Theus</span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={tabClass(isActive(tab.href))}>
            {tab.label}
          </Link>
        ))}

        <div ref={moreRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn('inline-flex items-center gap-1', tabClass(moreActive))}
          >
            More
            <Icon
              name="chevron-down"
              size={13}
              className={cn('transition-transform duration-200 ease-theus', moreOpen && 'rotate-180')}
            />
          </button>
          {moreOpen ? (
            <div className="glass glass-nohover absolute left-0 top-full z-30 mt-2 min-w-[190px] !rounded-[16px] p-1">
              {MORE.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13.5px] font-semibold transition-colors',
                    isActive(m.href)
                      ? 'bg-indigo/[0.12] text-indigo-dark'
                      : 'text-ink-soft hover:bg-white/70 hover:text-ink',
                  )}
                >
                  <Icon name={m.icon} size={15} />
                  {m.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <IconButton icon="bell" iconSize={18} strokeWidth={1.7} dot aria-label="Notifications" />

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-white/70 py-[5px] pl-[5px] pr-[14px] transition-colors duration-200 hover:bg-white"
          >
            <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#4a5ce0,#1fb9a4)] text-[12px] font-bold text-white">
              {initials}
            </span>
            <span className="max-w-[140px] truncate text-[13px] font-semibold text-ink">{email}</span>
          </button>

          {accountOpen ? (
            <div className="glass glass-nohover absolute right-0 top-full z-30 mt-2 w-[260px] !rounded-[20px] p-3">
              <div className="flex flex-col gap-3">
                <BudgetSwitcher budgets={budgets} activeId={activeBudgetId} />
                <div className="flex items-center justify-between border-t border-white/60 pt-3">
                  <span className="text-[11px] font-semibold text-ink-mute">{email}</span>
                  <SignOutButton />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
