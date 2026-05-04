import { cn } from '@/lib/utils';

type Tone = 'default' | 'mute' | 'soft' | 'accent' | 'pos' | 'neg';
type Size = 'xs' | 'sm';

const TONE: Record<Tone, string> = {
  default: 'text-ink',
  mute: 'text-ink-mute',
  soft: 'text-ink-soft',
  accent: 'text-accent',
  pos: 'text-pos',
  neg: 'text-neg',
};

const SIZE: Record<Size, string> = {
  xs: 'text-[10px]',
  sm: 'text-[11px]',
};

/**
 * Small uppercase tracked label rendered in JetBrains Mono.
 */
export function Mono({
  children,
  tone = 'mute',
  size = 'sm',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  size?: Size;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'font-mono font-medium uppercase tracking-[0.18em]',
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
