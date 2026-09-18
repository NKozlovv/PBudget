'use client';

import type { CategoryTrendRow, TrendMonth } from '@/lib/categories/monthlyTrend';

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * Exports the currently-displayed matrix as CSV — the mockup's "Export"
 * button doesn't specify a format, so this is the most useful reading of
 * it: the exact numbers on screen, downloadable for a spreadsheet.
 */
export function ExportButton({
  rows,
  months,
  visibleCount,
  year,
}: {
  rows: CategoryTrendRow[];
  months: TrendMonth[];
  visibleCount: number;
  year: number;
}) {
  const offset = months.length - visibleCount;
  const visibleMonths = months.slice(offset);

  function download() {
    const header = ['Category', ...visibleMonths.map((m) => m.label), 'Avg', 'Year'];
    const lines = [header];
    for (const row of rows) {
      const values = Array.from({ length: visibleCount }, (_, j) => (row.values[offset + j] ?? 0).toFixed(2));
      // row.total spans the full `months` array, which includes one
      // leading baseline month used only for the first column's delta —
      // sum just the visible months instead so this matches what's shown.
      const visibleTotal = values.reduce((s, v) => s + Number(v), 0);
      const avg = visibleCount > 0 ? visibleTotal / visibleCount : 0;
      lines.push([row.category.name, ...values, avg.toFixed(2), visibleTotal.toFixed(2)]);
    }
    const csv = lines.map((line) => line.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theus-trends-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="rounded-full border border-white/90 px-[17px] py-[9px] text-[13.5px] font-semibold text-ink [background:var(--glass-sheen-tile)] backdrop-blur-xl transition-[transform,background] duration-200 ease-theus hover:-translate-y-0.5 hover:bg-white"
    >
      Export
    </button>
  );
}
