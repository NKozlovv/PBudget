'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * Sidebar nav row.
 * Modeled on design-refs/src/dashboard.jsx 21-34: padding 10/12,
 * borderRadius 8, fontSize 13 weight 500. Active state: surface bg +
 * line border + accent-colored icon.
 */
export function NavItem({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon?: IconName;
  badge?: string;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-medium transition-colors',
        active
          ? 'border-line bg-surface text-ink'
          : 'border-transparent text-ink-soft hover:bg-surface hover:text-ink',
      )}
    >
      {icon ? (
        <Icon
          name={icon}
          size={16}
          className={active ? 'text-accent' : 'text-ink-mute'}
        />
      ) : null}
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-accent">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
