'use client';

import { useState } from 'react';
import { categoryColor } from '@/lib/categoryColor';
import { fmtEUR } from '@/lib/money';

export interface SpendingMixSlice {
  name: string;
  value: number;
}

const VISIBLE_COUNT = 6;

/**
 * Spending mix panel — right cell of the Overview's second row. A
 * segmented capsule bar (not a donut — design_handoff_theus_rehaul
 * README dropped the donut for this screen) plus a legend list, both
 * driven by the fixed six-hue category map. The legend collapses to
 * the top categories with a "show more" toggle — a budget with a dozen-
 * plus categories otherwise runs the list on for a long, low-value tail.
 */
export function SpendingMixPanel({ slices, total }: { slices: SpendingMixSlice[]; total: number }) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...slices].sort((a, b) => b.value - a.value).filter((s) => s.value > 0);
  const hiddenCount = sorted.length - VISIBLE_COUNT;
  const visible = expanded || hiddenCount <= 0 ? sorted : sorted.slice(0, VISIBLE_COUNT);

  return (
    <div className="glass !rounded-[28px] p-[24px] px-[26px]">
      <div>
        <div className="text-[19px] font-bold -tracking-[0.02em] text-ink">Spending mix</div>
        <div className="mt-1 text-[12.5px] font-medium text-ink-mute">
          YTD average · {sorted.length} categor{sorted.length === 1 ? 'y' : 'ies'}
        </div>
      </div>

      <div className="mt-5 flex h-[14px] gap-[3px]">
        {sorted.map((s) => {
          const hue = categoryColor(s.name);
          const share = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div
              key={s.name}
              className="meter h-full rounded-full"
              style={{ width: `${share}%`, background: hue }}
              title={`${s.name}: ${fmtEUR(s.value, { decimals: 0 })} (${Math.round(share)}%)`}
            />
          );
        })}
      </div>

      <div className="mt-3 flex flex-col">
        {visible.map((s) => {
          const hue = categoryColor(s.name);
          const share = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <div
              key={s.name}
              className="flex items-center gap-2.5 rounded-[14px] px-3 py-[9px] transition-colors duration-[160ms] hover:bg-white/[0.72]"
            >
              <span className="h-[10px] w-[10px] shrink-0 rounded-full" style={{ background: hue }} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">{s.name}</span>
              <span className="shrink-0 text-[14px] font-bold tabular-nums text-ink">
                {fmtEUR(s.value, { decimals: 0 })}
              </span>
              <span className="w-[38px] shrink-0 text-right text-[12px] font-semibold text-ink-mute">
                {share}%
              </span>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 w-full rounded-[14px] px-3 py-[9px] text-left text-[12.5px] font-semibold text-indigo-dark transition-colors duration-[160ms] hover:bg-white/[0.72]"
        >
          {expanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  );
}
