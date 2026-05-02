'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Sidebar nav row.
 * Modeled on design-refs/src/dashboard.jsx 22–34: padding 10/12,
 * borderRadius 8, fontSize 13 weight 500, active state =
 * accent-soft bg + accent text.
 */
export function NavItem({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-colors',
        active
          ? 'bg-accent-soft text-accent font-medium'
          : 'text-ink-soft hover:bg-bg-panel hover:text-ink',
      )}
    >
      <span className="flex-1">{label}</span>
      {badge ? (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em]',
            active ? 'bg-accent text-bg' : 'bg-bg-panel text-ink-mute',
          )}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
