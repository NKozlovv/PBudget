import { Icon } from './Icon';
import { cn } from '@/lib/utils';

export interface DropdownOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

/**
 * The themed popup panel shared by Select and Filters' PillSelect —
 * replaces the browser's native, unthemeable <select> popup.
 */
export function OptionsList({
  options,
  value,
  onSelect,
  className,
}: {
  options: DropdownOption[];
  value: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="listbox"
      className={cn(
        'absolute z-50 mt-1.5 max-h-64 min-w-full overflow-auto rounded-[10px] border border-rule bg-bg-soft p-1 shadow-2xl',
        className,
      )}
    >
      {options.map((o, i) => {
        const isSelected = o.value === value;
        return (
          <button
            key={o.value || i}
            type="button"
            role="option"
            aria-selected={isSelected}
            disabled={o.disabled}
            onClick={() => !o.disabled && onSelect(o.value)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-[6px] px-3 py-2 text-left text-[13px] transition-colors',
              isSelected ? 'bg-accent-soft text-accent' : 'text-ink hover:bg-bg-panel',
              o.disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
            )}
          >
            <span className="truncate">{o.label}</span>
            {isSelected ? <Icon name="check" size={13} className="shrink-0" /> : null}
          </button>
        );
      })}
    </div>
  );
}
