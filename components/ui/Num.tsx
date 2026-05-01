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

export function Num({
  children,
  tone = 'default',
  size = 16,
  weight = 500,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: number;
  weight?: 400 | 500 | 600 | 700;
  className?: string;
}) {
  return (
    <span
      className={cn('font-mono tabular-nums', TONE[tone], className)}
      style={{ fontSize: `${size}px`, fontWeight: weight }}
    >
      {children}
    </span>
  );
}
