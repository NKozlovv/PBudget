'use client';

import {
  Children,
  isValidElement,
  useState,
  type ChangeEvent,
  type ReactElement,
  type SelectHTMLAttributes,
} from 'react';
import { Icon } from './Icon';
import { OptionsList, type DropdownOption } from './OptionsList';
import { useDismissable } from './useDismissable';
import { cn } from '@/lib/utils';

type OptionProps = { value?: string; disabled?: boolean; children?: React.ReactNode };

/**
 * Drop-in themed replacement for a native <select> — same props (value,
 * onChange, <option> children, id, disabled, required) so every existing
 * call site works unchanged, but the open popup is a themed OptionsList
 * instead of the browser's native, unthemeable one.
 */
export function Select({
  className,
  children,
  value,
  onChange,
  disabled,
  id,
  'aria-label': ariaLabel,
}: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const options: DropdownOption[] = Children.toArray(children)
    .filter((c): c is ReactElement<OptionProps> => isValidElement(c) && c.type === 'option')
    .map((o) => ({
      value: String(o.props.value ?? ''),
      label: o.props.children,
      disabled: o.props.disabled,
    }));

  const selected = options.find((o) => o.value === String(value ?? ''));

  function selectValue(v: string) {
    setOpen(false);
    onChange?.({ target: { value: v } } as ChangeEvent<HTMLSelectElement>);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[10px] border border-rule bg-bg px-3.5 py-2.5 text-left text-[14px] text-ink',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? '—'}</span>
        <Icon name="chevron-down" size={12} className="shrink-0 text-ink-mute" />
      </button>
      {open ? <OptionsList options={options} value={String(value ?? '')} onSelect={selectValue} /> : null}
    </div>
  );
}
