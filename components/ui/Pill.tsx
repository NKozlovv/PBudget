import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'pos' | 'neg' | 'outline';
type Shape = 'kbd' | 'badge' | 'chip';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-chip text-ink-soft',
  accent: 'bg-accent-soft text-accent',
  pos: 'bg-pos-soft text-pos',
  neg: 'bg-neg-soft text-neg',
  outline: 'border border-line text-ink-soft',
};

const SHAPES: Record<Shape, string> = {
  kbd: 'rounded-[4px] px-1.5 py-0.5 text-[10px] font-mono',
  badge: 'rounded-full px-2.5 py-1 text-[11px] font-medium',
  chip: 'rounded-lg px-2.5 py-1 text-[11px] font-medium',
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
