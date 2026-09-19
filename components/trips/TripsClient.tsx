'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/nav/PageHeader';
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
 * Owns the metric picker shared across every section on the page, and
 * renders `PageHeader` itself (rather than `app/(app)/trips/page.tsx`
 * doing it) so the title and `CompareByBar` can share one grid row.
 *
 * That grid is the whole page's layout, not just the header: `PageHeader`,
 * `CompareByBar`, and an empty spacer are its first three items (a
 * `1fr auto 1fr` row) — the two equal `1fr` columns keep the pill
 * genuinely centered on the page regardless of the title's own width,
 * rather than "flush right because that's what's left after the title"
 * (a plain `1fr auto` row does the latter, not the former — tried it,
 * looked pinned to the corner instead of centered). Every section after
 * row 1 spans all three columns via `col-span-full`, one per row. The
 * three-column row is deliberate, not just for the header — a
 * plain wrapper around only the header row would be exactly as short as
 * its own content, giving `CompareByBar`'s `position: sticky` zero room
 * to hold its pinned position as you scroll (a sticky element can't
 * stick further than its own containing block's height allows). Making
 * the *whole page* one grid means `CompareByBar`'s containing block is
 * that grid — which is exactly as tall as the entire page, since the
 * hero/ranked/mix/matrix/table rows live in it too — so it keeps sticking
 * all the way down. Same underlying constraint that moved it out of the
 * hero card and then above it in the last two rounds; this is the version
 * that finally lets it sit visually beside the title without losing that.
 *
 * No click-to-focus/dim interaction any more either (dropped per
 * feedback — rows keep their hover lift, but clicking a trip no longer
 * filters the rest of the page) — see docs/rehaul-progress.md's "Trips
 * page" entries.
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-x-6 gap-y-5">
        <PageHeader title="Trips" meta={`${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`} />
        <CompareByBar metric={metric} onMetricChange={setMetric} />
        <div aria-hidden />{/* balances the 1fr on the left so the middle column is truly centered, not just "whatever's left after the title" */}

        <div className="col-span-full">
          <TripsHero trips={trips} metric={metric} />
        </div>

        <div className="col-span-full grid grid-cols-[repeat(auto-fit,minmax(420px,1fr))] items-stretch gap-5">
          <TripsRanked trips={trips} metric={metric} />
          <TripsMix trips={chronological} colors={colors} />
        </div>

        <div className="col-span-full">
          <TripsMatrix trips={chronological} metric={metric} colors={colors} />
        </div>

        <div className="col-span-full">
          <TripsTable trips={trips} onEditTrip={setEditingTrip} />
        </div>
      </div>

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
