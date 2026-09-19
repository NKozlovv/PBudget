'use client';

import { useMemo, useState } from 'react';
import { TripsHero } from './TripsHero';
import { TripsRanked } from './TripsRanked';
import { TripsMix } from './TripsMix';
import { TripsMatrix } from './TripsMatrix';
import { TripsTable } from './TripsTable';
import { EditTravelersModal } from './EditTravelersModal';
import type { TripMetric } from '@/lib/trips/view';
import type { TripSummary } from '@/lib/trips/summary';

/**
 * Owns the metric picker + trip-focus selection shared across every section
 * below the hero — same interaction model as the user's `Theus Trips.dc.html`
 * mockup, just driven by real Travel-category, trip-tagged transactions
 * instead of its hardcoded sample data. See docs/rehaul-progress.md's
 * "Trips page" entry.
 */
export function TripsClient({ budgetId, trips }: { budgetId: string; trips: TripSummary[] }) {
  const [metric, setMetric] = useState<TripMetric>('perDay');
  const [selected, setSelected] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<string | null>(null);

  // Chronological order for the sections that read left-to-right as a
  // timeline (mix chart, matrix columns) — Ranked/Table sort themselves by
  // value instead.
  const chronological = useMemo(
    () => [...trips].sort((a, b) => (a.fromDate < b.fromDate ? -1 : a.fromDate > b.fromDate ? 1 : 0)),
    [trips],
  );

  function toggleSelect(trip: string) {
    setSelected((cur) => (cur === trip ? null : trip));
  }

  const editing = editingTrip ? trips.find((t) => t.trip === editingTrip) ?? null : null;

  return (
    <>
      <TripsHero trips={trips} metric={metric} onMetricChange={setMetric} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] items-start gap-5">
        <TripsRanked trips={trips} metric={metric} selected={selected} onSelect={toggleSelect} />
        <TripsMix trips={chronological} selected={selected} />
      </div>

      <TripsMatrix trips={chronological} metric={metric} selected={selected} />

      <TripsTable trips={trips} selected={selected} onSelect={toggleSelect} onEditTravelers={setEditingTrip} />

      {editing ? (
        <EditTravelersModal
          budgetId={budgetId}
          trip={editing.trip}
          travelers={editing.travelers}
          onClose={() => setEditingTrip(null)}
        />
      ) : null}
    </>
  );
}
