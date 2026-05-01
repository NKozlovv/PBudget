import { cn } from '@/lib/utils';
import { Mono } from './Mono';
import { Num } from './Num';

/**
 * KpiTile — modeled on Sterling dashboard cards (design-refs/src/dashboard.jsx
 * 152, 166): rounded-2xl, padded surface card, mono uppercase label,
 * 32px tabular numeral, mono delta with sub-caption.
 */
export function KpiTile({
  label,
  value,
  cents,
  delta,
  deltaTone = 'pos',
  sub,
  className,
}: {
  label: string;
  value: string;
  cents?: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg' | 'mute';
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-rule bg-bg-soft p-6', className)}>
      <Mono size="sm" tone="mute">
        {label}
      </Mono>
      <div className="mt-3">
        <Num size={32} weight={600}>
          {value}
        </Num>
        {cents ? (
          <Num size={20} weight={500} tone="mute">
            {cents}
          </Num>
        ) : null}
      </div>
      {(delta || sub) && (
        <div className="mt-2 flex items-baseline gap-2">
          {delta && (
            <Mono size="xs" tone={deltaTone}>
              {delta}
            </Mono>
          )}
          {sub && <span className="text-[12px] text-ink-mute">{sub}</span>}
        </div>
      )}
    </div>
  );
}
