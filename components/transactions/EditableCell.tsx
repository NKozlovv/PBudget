'use client';

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type Variant =
  | { kind: 'text'; placeholder?: string }
  | { kind: 'number'; step?: string }
  | { kind: 'date' }
  | { kind: 'select'; options: { value: string; label: string }[] };

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Click → edit → Enter/blur saves, ESC cancels.
 * Selects save on change (blur is too slow for native selects).
 */
export function EditableCell({
  value,
  display,
  variant,
  onSave,
  className,
  align = 'left',
}: {
  value: string;
  display?: ReactNode;
  variant: Variant;
  onSave: (next: string) => Promise<SaveResult>;
  className?: string;
  align?: 'left' | 'right';
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      if ('select' in inputRef.current && typeof inputRef.current.select === 'function') {
        try {
          inputRef.current.select();
        } catch {
          // ignore — date inputs don't support .select()
        }
      }
    }
  }, [editing]);

  async function commit(next: string) {
    if (next === value) {
      setEditing(false);
      setDraft(value);
      return;
    }
    setPending(true);
    const res = await onSave(next);
    setPending(false);
    if (res.ok) {
      setEditing(false);
    } else {
      // bounce back to original on failure
      setDraft(value);
      setEditing(false);
    }
  }

  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && variant.kind !== 'select') {
      e.preventDefault();
      void commit(draft);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          'inline-block w-full rounded px-1 py-0.5 text-left transition-colors hover:bg-bg-panel/60 focus:outline-none focus:ring-1 focus:ring-accent',
          align === 'right' && 'text-right',
          pending && 'opacity-60',
          className,
        )}
      >
        {display ?? value}
      </button>
    );
  }

  const baseClasses = cn(
    'w-full rounded border border-accent bg-bg px-2 py-1 text-[13px] text-ink',
    'focus:outline-none focus:ring-1 focus:ring-accent',
    align === 'right' && 'text-right',
    pending && 'opacity-60',
    className,
  );

  if (variant.kind === 'select') {
    return (
      <select
        ref={(el) => {
          inputRef.current = el;
        }}
        value={draft}
        disabled={pending}
        onChange={(e) => {
          setDraft(e.target.value);
          void commit(e.target.value);
        }}
        onBlur={cancel}
        onKeyDown={onKeyDown}
        className={baseClasses}
      >
        {variant.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      ref={(el) => {
        inputRef.current = el;
      }}
      type={variant.kind === 'date' ? 'date' : variant.kind === 'number' ? 'number' : 'text'}
      step={variant.kind === 'number' ? (variant.step ?? '0.01') : undefined}
      placeholder={variant.kind === 'text' ? variant.placeholder : undefined}
      value={draft}
      disabled={pending}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={onKeyDown}
      className={baseClasses}
    />
  );
}
