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
    const header = ['Category', ...visibleMonths.map((m) => m.label), 'Year'];
    const lines = [header];
    for (const row of rows) {
      const values = Array.from({ length: visibleCount }, (_, j) => (row.values[offset + j] ?? 0).toFixed(2));
      lines.push([row.category.name, ...values, row.total.toFixed(2)]);
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
