import { cn } from '@/lib/utils';
import { Mono } from './Mono';
import { Num } from './Num';

export function KpiTile({
  label,
  value,
  delta,
  deltaTone = 'pos',
  sub,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg' | 'mute';
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 bg-bg p-5', className)}>
      <Mono size="xs" tone="mute">
        {label}
      </Mono>
      <Num size={32} weight={500}>
        {value}
      </Num>
      {(delta || sub) && (
        <div className="flex items-baseline gap-2">
          {delta && (
            <Mono size="xs" tone={deltaTone}>
              {delta}
            </Mono>
          )}
          {sub && <span className="text-[11px] text-ink-mute">{sub}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * KpiStrip — N children laid out as a 1-pixel-grid divider row.
 * Reproduces the technique from theus-dashboard.jsx 191:
 * gap:1px + bg:rule on the outer grid; child cells set their own bg.
 */
export function KpiStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn('grid border border-rule bg-rule', className)}
      style={{
        gap: '1px',
        gridTemplateColumns: 'repeat(auto-fit, minmax(0, 1fr))',
      }}
    >
      {children}
    </div>
  );
}
