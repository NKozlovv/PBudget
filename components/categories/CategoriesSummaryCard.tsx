'use client';

import { Mono } from '@/components/ui';
import { categoryColor as hueFor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { useChartHover } from '@/components/charts/useChartHover';
import type { CategorySummary } from '@/lib/categories/summary';

function compactEUR(n: number): string {
  if (Math.abs(n) >= 1000) {
    return `€${(n / 1000).toFixed(2)}k`;
  }
  return `€${n.toFixed(0)}`;
}

/**
 * Summary block for the Categories page. Mirrors design-refs/src/categories.jsx
 * lines 32-55 (donut + 3-up KPI strip + segmented progress + insight line).
 *
 * "Budget" → YTD monthly average (proxy, no schema budget column).
 * Insight copy → "This month is N% above/below your YTD average."
 */
export function CategoriesSummaryCard({
  summaries,
}: {
  summaries: CategorySummary[];
}) {
  const sorted = [...summaries].sort((a, b) => b.thisMonth - a.thisMonth);
  const totalThisMonth = sorted.reduce((s, x) => s + x.thisMonth, 0);
  const totalAvg = sorted.reduce((s, x) => s + x.avgMonthly, 0);
  const remaining = totalAvg - totalThisMonth;
  const pctVsAvg = totalAvg > 0 ? (totalThisMonth / totalAvg - 1) * 100 : 0;
  const overCats = sorted.filter((s) => s.over);
  const { containerRef, hover, show, hide } = useChartHover<CategorySummary>();

  // Donut geometry
  const size = 180;
  const strokeWidth = 24;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  let off = 0;

  return (
    <div className="rounded-2xl border border-rule bg-bg-soft p-6">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr] md:items-center">
        {/* Donut */}
        <div ref={containerRef} className="relative mx-auto" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="Spend by category">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="var(--rule)"
              strokeWidth={strokeWidth}
            />
            {sorted
              .filter((s) => s.thisMonth > 0)
              .map((s) => {
                const len = totalThisMonth > 0 ? (s.thisMonth / totalThisMonth) * c : 0;
                const dash = `${len} ${c - len}`;
                const dashOffset = -off;
                off += len;
                return (
                  <circle
                    key={s.category.id}
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke={hueFor(s.category.name)}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dash}
                    strokeDashoffset={dashOffset}
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    onMouseEnter={(e) => show(e, s)}
                    onMouseMove={(e) => show(e, s)}
                    onMouseLeave={hide}
                  />
                );
              })}
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="font-sans tabular-nums tracking-tight text-ink"
              style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em' }}
            >
              {compactEUR(totalThisMonth)}
            </div>
            <Mono size="xs" className="mt-0.5">
              of avg
            </Mono>
          </div>
          {hover ? (
            <ChartTooltip x={hover.x} y={hover.y}>
              <span className="font-medium text-ink">{hover.data.category.name}</span>
              <span className="mx-1 text-ink-mute">·</span>
              <span style={{ color: hueFor(hover.data.category.name) }}>
                {fmtEUR(hover.data.thisMonth, { decimals: 0 })}
              </span>
            </ChartTooltip>
          ) : null}
        </div>

        {/* KPI strip + progress + insight */}
        <div className="min-w-0">
          <div className="grid grid-cols-3 gap-5">
            <Kpi label="Spent" value={fmtEUR(totalThisMonth, { decimals: 0 })} tone="default" />
            <Kpi
              label="YTD avg"
              value={fmtEUR(totalAvg, { decimals: 0 })}
              tone="soft"
            />
            <Kpi
              label="Remaining"
              value={fmtEUR(remaining, { decimals: 0 })}
              tone={remaining >= 0 ? 'pos' : 'neg'}
              signed
            />
          </div>

          {/* Segmented progress bar */}
          <div className="mt-5 flex h-2 gap-[2px] overflow-hidden rounded-full bg-rule">
            {totalThisMonth > 0 ? (
              sorted
                .filter((s) => s.thisMonth > 0)
                .map((s) => (
                  <span
                    key={s.category.id}
                    style={{
                      flex: s.thisMonth,
                      background: hueFor(s.category.name),
                    }}
                  />
                ))
            ) : null}
          </div>

          {/* Insight */}
          <div className="mt-3 text-[12px] leading-relaxed text-ink-soft">
            {totalAvg <= 0 ? (
              <>Not enough history yet — add a few months of transactions to see a trend.</>
            ) : (
              <>
                This month is{' '}
                <span
                  className={
                    pctVsAvg > 0 ? 'font-semibold text-neg' : 'font-semibold text-pos'
                  }
                >
                  {pctVsAvg > 0 ? '+' : ''}
                  {pctVsAvg.toFixed(1)}%
                </span>{' '}
                {pctVsAvg >= 0 ? 'above' : 'below'} your YTD average.
                {overCats.length > 0 ? (
                  <>
                    {' '}
                    {overCats.length === 1 ? 'One category is' : `${overCats.length} categories are`} running over:{' '}
                    {overCats.slice(0, 3).map((s, i) => (
                      <span key={s.category.id}>
                        {i > 0 ? ', ' : ''}
                        <span className="text-warn">{s.category.name}</span>
                      </span>
                    ))}
                    {overCats.length > 3 ? ` +${overCats.length - 3} more` : ''}.
                  </>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone,
  signed,
}: {
  label: string;
  value: string;
  tone: 'default' | 'soft' | 'pos' | 'neg';
  signed?: boolean;
}) {
  return (
    <div>
      <Mono size="xs">{label}</Mono>
      <div className="mt-1 font-mono tabular-nums" style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em' }}>
        <span
          className={
            tone === 'pos'
              ? 'text-pos'
              : tone === 'neg'
                ? 'text-neg'
                : tone === 'soft'
                  ? 'text-ink-soft'
                  : 'text-ink'
          }
        >
          {signed && value && !value.startsWith('−') && !value.startsWith('+')
            ? value.replace('€', '+€')
            : value}
        </span>
      </div>
    </div>
  );
}

