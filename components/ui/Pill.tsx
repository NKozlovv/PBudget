import { cn } from '@/lib/utils';

type Variant = 'default' | 'accent' | 'pos' | 'neg' | 'outline';

const VARIANTS: Record<Variant, string> = {
  default: 'bg-bg-soft text-ink-soft',
  accent: 'bg-accent-soft text-accent',
  pos: 'bg-pos-soft text-pos',
  neg: 'bg-neg-soft text-neg',
  outline: 'border border-rule text-ink-soft',
};

export function Pill({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
