import { fmtEUR } from '@/lib/money';
import { categoryColor, tint } from '@/lib/categoryColor';
import { cn } from '@/lib/utils';
import type { CategoryTrendRow, TrendMonth } from '@/lib/categories/monthlyTrend';

/**
 * The category × month matrix — design_handoff_theus_rehaul README
 * "4. Trends". Exactly two hues (--in / --out), both measured against a
 * *row's own* average across the shown months — depth is distance from
 * that category's average, not spend volume. The category hue survives
 * only as the 10px dot in the row label.
 */
export function TrendTable({
  rows,
  months,
  visibleCount,
}: {
  rows: CategoryTrendRow[];
  /** Includes one leading month used only as the first visible column's delta baseline. */
  months: TrendMonth[];
  visibleCount: number;
}) {
  const offset = months.length - visibleCount;
  const visibleMonths = months.slice(offset);

  if (rows.length === 0) {
    return (
      <div className="glass !rounded-[26px] px-6 py-16 text-center text-sm text-ink-mute">
        No expense activity in this year yet.
      </div>
    );
  }

  const footer = visibleMonths.map((_, j) => {
    const idx = offset + j;
    return rows.reduce((s, r) => s + (r.values[idx] ?? 0), 0);
  });
  const footerTotal = footer.reduce((s, v) => s + v, 0);

  return (
    <div className="glass overflow-x-auto !rounded-[26px] p-2">
      <table className="border-separate text-[13px]" style={{ borderSpacing: 4, minWidth: 790 }}>
        <thead>
          <tr>
            <th className="sticky left-0 bg-white/[0.92] px-2 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              Category
            </th>
            {visibleMonths.map((m) => (
              <th
                key={`${m.year}-${m.month}`}
                className="whitespace-nowrap px-2 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute"
              >
                {m.label}
              </th>
            ))}
            <th className="sticky right-0 whitespace-nowrap px-2 text-right text-[11px] font-bold uppercase tracking-[0.1em] text-ink-mute">
              Year
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            // row.total spans the full `months` array, which includes the
            // one leading baseline month — the Year column and each cell's
            // own average must only count the *visible* months.
            const visibleTotal = Array.from({ length: visibleCount }, (_, j) => row.values[offset + j] ?? 0).reduce(
              (s, v) => s + v,
              0,
            );
            const rowAvg = visibleCount > 0 ? visibleTotal / visibleCount : 0;
            const hue = categoryColor(row.category.name);
            return (
              <tr key={row.category.id}>
                <td className="sticky left-0 whitespace-nowrap rounded-[10px] bg-white/[0.92] px-2 py-2.5">
                  <span className="flex items-center gap-2">
                    <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: hue }} />
                    <span className="truncate font-semibold text-ink">{row.category.name}</span>
                  </span>
                </td>
                {Array.from({ length: visibleCount }, (_, j) => {
                  const idx = offset + j;
                  const curr = row.values[idx] ?? 0;
                  const prev = row.values[idx - 1] ?? 0;
                  return <ValueCell key={j} value={curr} prev={prev} avg={rowAvg} />;
                })}
                <td
                  className="sticky right-0 whitespace-nowrap rounded-[10px] bg-white/[0.92] px-[10px] py-2.5 text-right font-extrabold tabular-nums text-ink"
                >
                  {fmtEUR(visibleTotal, { decimals: 0 })}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="sticky left-0 bg-white/[0.92] px-2 pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute">
              All categories
            </td>
            {footer.map((v, j) => (
              <td key={j} className="whitespace-nowrap px-2 pt-3 text-right font-extrabold tabular-nums text-ink">
                {fmtEUR(v, { decimals: 0 })}
              </td>
            ))}
            <td className="sticky right-0 whitespace-nowrap px-2 pt-3 text-right font-extrabold tabular-nums text-ink">
              {fmtEUR(footerTotal, { decimals: 0 })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ValueCell({ value, prev, avg }: { value: number; prev: number; avg: number }) {
  const ratio = avg > 0 ? value / avg : value > 0 ? 2 : 1;
  const isZero = Math.abs(value) < 0.005;

  let bg = 'rgba(139,149,184,.07)'; // --slate .07, "on plan"
  let textWhite = false;
  if (!isZero && avg > 0) {
    if (ratio > 1.02) {
      const alpha = Math.min(0.82, Math.max(0.12, Math.abs(ratio - 1) * 1.25));
      bg = tint('#d94a6f', alpha);
      textWhite = alpha > 0.5;
    } else if (ratio < 0.98) {
      const alpha = Math.min(0.82, Math.max(0.12, Math.abs(ratio - 1) * 1.25));
      bg = tint('#12a08c', alpha);
      textWhite = alpha > 0.5;
    }
  }

  const momPct = Math.abs(prev) > 0.005 ? ((value - prev) / Math.abs(prev)) * 100 : value > 0 ? Infinity : 0;
  const arrow = momPct > 8 ? '▲' : momPct < -8 ? '▼' : '·';
  const pctVsAvg = avg > 0 ? Math.round((ratio - 1) * 100) : 0;

  return (
    <td
      className={cn(
        'cursor-default whitespace-nowrap rounded-[12px] px-[10px] py-[11px] text-right font-bold tabular-nums transition-transform duration-200 ease-theus hover:z-10 hover:scale-[1.06] hover:shadow-[0_8px_18px_rgba(31,39,66,.18)]',
        textWhite ? 'text-white' : 'text-ink',
      )}
      style={{ background: bg }}
      title={`${fmtEUR(value, { decimals: 0 })}${avg > 0 ? ` · ${pctVsAvg >= 0 ? '+' : ''}${pctVsAvg}% vs average` : ''}`}
    >
      {isZero ? (
        <span className="opacity-40">—</span>
      ) : (
        <>
          {fmtEUR(value, { decimals: 0 })} <span className="opacity-80">{arrow}</span>
        </>
      )}
    </td>
  );
}
