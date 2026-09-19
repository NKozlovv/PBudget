'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal } from '@/components/ui';
import { setTripTravelersAction } from '@/app/actions/trips';

export function EditTravelersModal({
  budgetId,
  trip,
  travelers,
  onClose,
}: {
  budgetId: string;
  trip: string;
  travelers: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(travelers));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number(value);
    if (!Number.isFinite(n) || n < 1) {
      setError('Enter at least 1.');
      return;
    }
    setError(null);
    setPending(true);
    const res = await setTripTravelersAction({ budget_id: budgetId, trip, travelers: n });
    setPending(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <Modal
      open={true}
      onOpenChange={(o) => !o && onClose()}
      title={`${trip} — travelers`}
      description="Used for the per-person-day comparison across trips."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Number of travelers">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              step={1}
              required
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </Field>
        {error ? (
          <p className="text-[13px] text-neg" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-2 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
