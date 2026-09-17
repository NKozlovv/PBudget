import { cn } from '@/lib/utils';
import { Mono } from './Mono';
import { Num } from './Num';
import { Icon, type IconName } from './Icon';

/**
 * KpiTile — glass-tile card, mono uppercase label, 32px tabular numeral,
 * optional radial gradient overlay (hero variant) and optional
 * icon-prefixed delta indicator.
 */
export function KpiTile({
  label,
  value,
  cents,
  delta,
  deltaTone = 'pos',
  deltaIcon,
  sub,
  hero = false,
  className,
  children,
}: {
  label: string;
  value: string;
  cents?: string;
  delta?: string;
  deltaTone?: 'pos' | 'neg' | 'mute';
  deltaIcon?: IconName;
  sub?: string;
  hero?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('glass-tile relative overflow-hidden !rounded-[20px] p-6', className)}>
      {hero ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 90% 0%, rgba(74,92,224,.14), transparent 55%)',
          }}
        />
      ) : null}
      <div className="relative">
        <Mono size="sm" tone="mute">
          {label}
        </Mono>
        <div className="mt-3 flex items-baseline gap-1">
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
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-mono text-[12px] font-semibold',
                  deltaTone === 'pos' && 'text-pos',
                  deltaTone === 'neg' && 'text-neg',
                  deltaTone === 'mute' && 'text-ink-mute',
                )}
              >
                {deltaIcon ? <Icon name={deltaIcon} size={11} /> : null}
                {delta}
              </span>
            )}
            {sub && <span className="text-[12px] text-ink-mute">{sub}</span>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
