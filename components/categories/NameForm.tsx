'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/ui';

export function NameForm({
  defaultValue = '',
  submitLabel,
  placeholder,
  onSubmit,
  onCancel,
}: {
  defaultValue?: string;
  submitLabel: string;
  placeholder?: string;
  onSubmit: (name: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setPending(true);
    const res = await onSubmit(name.trim());
    setPending(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Name">
        {({ id }) => (
          <Input
            id={id}
            type="text"
            required
            autoFocus
            value={name}
            placeholder={placeholder}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </Field>
      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
