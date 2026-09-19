'use client';

import { useMemo, useState } from 'react';
import { TripsHero } from './TripsHero';
import { CompareByBar } from './CompareByBar';
import { TripsRanked } from './TripsRanked';
import { TripsMix } from './TripsMix';
import { TripsMatrix } from './TripsMatrix';
import { TripsTable } from './TripsTable';
import { EditTripModal } from './EditTripModal';
import { buildSubcategoryColorMap } from '@/lib/trips/subcategoryColor';
import type { TripMetric } from '@/lib/trips/view';
import type { TripSummary } from '@/lib/trips/summary';

/**
 * Owns the metric picker shared across every section on the page.
 * `CompareByBar` renders above `TripsHero` (not nested inside it) on
 * purpose — it stays a sibling of the hero, not a child, so its
 * `position: sticky` containing block is the whole page rather than the
 * hero's own short box; nested inside the hero it would stop sticking the
 * moment you scrolled past that (short) card, defeating the point of
 * making it sticky at all. No click-to-focus/dim interaction any more
 * either (dropped per feedback — rows keep their hover lift, but clicking
 * a trip no longer filters the rest of the page) — see
 * docs/rehaul-progress.md's "Trips page" entries.
 */
export function TripsClient({ budgetId, trips }: { budgetId: string; trips: TripSummary[] }) {
  const [metric, setMetric] = useState<TripMetric>('perDay');
  const [editingTrip, setEditingTrip] = useState<string | null>(null);

  // Chronological order for the sections that read left-to-right as a
  // timeline (mix chart, matrix columns) — Ranked/Table sort themselves by
  // value instead.
  const chronological = useMemo(
    () => [...trips].sort((a, b) => (a.fromDate < b.fromDate ? -1 : a.fromDate > b.fromDate ? 1 : 0)),
    [trips],
  );

  const editing = editingTrip ? trips.find((t) => t.trip === editingTrip) ?? null : null;

  // Shared across the mix chart, matrix and their legends so a given
  // subcategory is always the same color everywhere on the page.
  const colors = useMemo(() => buildSubcategoryColorMap(trips), [trips]);

  return (
    <>
      <CompareByBar metric={metric} onMetricChange={setMetric} />

      <TripsHero trips={trips} metric={metric} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] items-stretch gap-5">
        <TripsRanked trips={trips} metric={metric} />
        <TripsMix trips={chronological} colors={colors} />
      </div>

      <TripsMatrix trips={chronological} metric={metric} colors={colors} />

      <TripsTable trips={trips} onEditTrip={setEditingTrip} />

      {editing ? (
        <EditTripModal
          budgetId={budgetId}
          trip={editing.trip}
          travelers={editing.travelers}
          startDate={editing.fromDate}
          endDate={editing.toDate}
          datesAreExplicit={editing.datesAreExplicit}
          onClose={() => setEditingTrip(null)}
        />
      ) : null}
    </>
  );
}
