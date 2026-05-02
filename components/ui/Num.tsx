import { cn } from '@/lib/utils';

type Tone = 'default' | 'mute' | 'soft' | 'accent' | 'pos' | 'neg';
type Family = 'sans' | 'mono';

const TONE: Record<Tone, string> = {
  default: 'text-ink',
  mute: 'text-ink-mute',
  soft: 'text-ink-soft',
  accent: 'text-accent',
  pos: 'text-pos',
  neg: 'text-neg',
};

/**
 * Numeric span. Default: Inter with tabular-nums (Sterling pattern for
 * any number ≥24 px — see brand-system.jsx 76 hero balance, dashboard.jsx
 * 137 / 157 KPI values). Pass `family="mono"` only for small dense
 * ledger cells where JetBrains Mono is appropriate (dates, table amounts).
 */
export function Num({
  children,
  tone = 'default',
  size = 16,
  weight = 500,
  family = 'sans',
  letterSpacing,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: number;
  weight?: 400 | 500 | 600 | 700;
  family?: Family;
  letterSpacing?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'tabular-nums',
        family === 'mono' ? 'font-mono' : 'font-sans',
        TONE[tone],
        className,
      )}
      style={{
        fontSize: `${size}px`,
        fontWeight: weight,
        letterSpacing: letterSpacing ?? (size >= 24 ? '-0.02em' : '0'),
      }}
    >
      {children}
    </span>
  );
}
