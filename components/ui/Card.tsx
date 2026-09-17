import { cn } from '@/lib/utils';

type Level = 'panel' | 'inner' | 'tile';

const GLASS_CLASS: Record<Level, string> = {
  panel: 'glass',
  inner: 'glass-inner',
  tile: 'glass-tile',
};

/**
 * The one place in the app that sets a container background, border or
 * shadow — every card, panel and tile is `.glass` at one of three nesting
 * levels (see styles/tokens.css + app/globals.css "Liquid glass"). Level-1
 * panels share one hover contract (lift + brighten, 260ms); pass
 * `hover={false}` only for the sticky top nav, which is chrome, not content.
 */
export function Card({
  children,
  className,
  padded = true,
  level = 'panel',
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  level?: Level;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        GLASS_CLASS[level],
        level === 'panel' && !hover && 'glass-nohover',
        padded && 'p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  right,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <div>
        <div className="text-[19px] font-bold -tracking-[0.02em] text-ink">{title}</div>
        {subtitle ? <div className="mt-1">{subtitle}</div> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
