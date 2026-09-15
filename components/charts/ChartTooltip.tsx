'use client';

/**
 * Floating themed tooltip for inline SVG charts — positioned in plain CSS
 * pixels relative to the chart's wrapping `relative` container (see
 * useChartHover), so it works regardless of the SVG's own viewBox/scaling.
 */
export function ChartTooltip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[8px] border border-rule bg-bg-panel px-2.5 py-1.5 text-[11px] leading-tight text-ink shadow-xl"
      style={{ left: x, top: y - 10 }}
    >
      {children}
    </div>
  );
}
