'use client';

import { useState } from 'react';
import { Input, OptionsList, useDismissable, type DropdownOption } from '@/components/ui';

/**
 * Free-text trip input with a themed autocomplete of previously-used trip
 * names, so a returning trip ("Japan 2026") can be picked instead of
 * retyped — but a brand-new trip name is always still just typed straight
 * in. Only ever rendered by TransactionForm when the category is Travel.
 */
export function TripField({
  id,
  value,
  onChange,
  suggestions,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  const q = value.trim().toLowerCase();
  const filtered = suggestions
    .filter((t) => t.toLowerCase() !== q)
    .filter((t) => !q || t.toLowerCase().includes(q))
    .slice(0, 8);
  const options: DropdownOption[] = filtered.map((t) => ({ value: t, label: t }));

  return (
    <div ref={ref} className="relative">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Japan 2026"
        autoComplete="off"
      />
      {open && options.length > 0 ? (
        <OptionsList
          options={options}
          onSelect={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
