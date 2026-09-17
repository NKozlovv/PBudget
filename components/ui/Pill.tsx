import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'pos' | 'neg' | 'outline';
type Shape = 'kbd' | 'badge' | 'chip';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-white/70 text-ink-soft',
  accent: 'bg-indigo/[0.12] text-indigo-dark',
  pos: 'bg-in/[0.12] text-in',
  neg: 'bg-out/[0.12] text-out',
  outline: 'border border-white/90 text-ink-soft',
};

const SHAPES: Record<Shape, string> = {
  kbd: 'rounded-[4px] px-1.5 py-0.5 text-[10px] font-sans',
  badge: 'rounded-full px-2.5 py-1 text-[11px] font-bold',
  chip: 'rounded-full px-2.5 py-1 text-[11px] font-bold',
};

export function Pill({
  children,
  variant = 'default',
  shape = 'badge',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  shape?: Shape;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5',
        SHAPES[shape],
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
