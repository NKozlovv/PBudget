'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Modal } from '@/components/ui';
import { renameTripAction, setTripDetailsAction } from '@/app/actions/trips';

export function EditTripModal({
  budgetId,
  trip,
  travelers,
  startDate,
  endDate,
  datesAreExplicit,
  onClose,
}: {
  budgetId: string;
  trip: string;
  travelers: number;
  /** Current fromDate/toDate — explicit if datesAreExplicit, else the derived guess (used to pre-fill so you're not starting from blank). */
  startDate: string;
  endDate: string;
  datesAreExplicit: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(trip);
  const [travelersValue, setTravelersValue] = useState(String(travelers));
  const [start, setStart] = useState(datesAreExplicit ? startDate : '');
  const [end, setEnd] = useState(datesAreExplicit ? endDate : '');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newName = name.trim();
    if (!newName) {
      setError('Trip name is required.');
      return;
    }
    const n = Number(travelersValue);
    if (!Number.isFinite(n) || n < 1) {
      setError('Travelers: enter at least 1.');
      return;
    }
    setError(null);
    setPending(true);

    if (newName !== trip) {
      const renameRes = await renameTripAction({ budget_id: budgetId, oldName: trip, newName });
      if (!renameRes.ok) {
        setPending(false);
        setError(renameRes.error);
        return;
      }
    }

    const res = await setTripDetailsAction({
      budget_id: budgetId,
      trip: newName,
      travelers: n,
      start_date: start || null,
      end_date: end || null,
    });
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
      title={`Edit ${trip}`}
      description="Name, dates and headcount for this trip — used for the day count and per-person-day comparison."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Trip name" hint="Renaming moves every transaction tagged with the old name.">
          {({ id }) => <Input id={id} type="text" required value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date" hint={!datesAreExplicit ? 'Estimated — pick to override' : undefined}>
            {({ id }) => (
              <Input id={id} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            )}
          </Field>
          <Field label="End date" hint={!datesAreExplicit ? 'Estimated — pick to override' : undefined}>
            {({ id }) => <Input id={id} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />}
          </Field>
        </div>
        <Field label="Number of travelers">
          {({ id }) => (
            <Input
              id={id}
              type="number"
              min={1}
              step={1}
              required
              value={travelersValue}
              onChange={(e) => setTravelersValue(e.target.value)}
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
