import { cn } from '@/lib/utils';

type Tone = 'default' | 'mute' | 'soft' | 'accent' | 'pos' | 'neg';

const TONE: Record<Tone, string> = {
  default: 'text-ink',
  mute: 'text-ink-mute',
  soft: 'text-ink-soft',
  accent: 'text-accent',
  pos: 'text-pos',
  neg: 'text-neg',
};

/**
 * Numeric span. Inter with `tabular-nums` so columns of figures align.
 * Auto -0.02em letter-spacing for sizes ≥24 px.
 */
export function Num({
  children,
  tone = 'default',
  size = 16,
  weight = 500,
  letterSpacing,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: number;
  weight?: 400 | 500 | 600 | 700;
  letterSpacing?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('font-sans tabular-nums', TONE[tone], className)}
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
