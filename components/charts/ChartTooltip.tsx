'use client';

/** How close to an edge (in px) before the tooltip stops centering on the
 * cursor and pins to that edge instead — charts usually sit inside an
 * `overflow-hidden` card, which silently clips anything that overflows it,
 * so a tooltip centered on a point near the edge would get its content cut
 * off rather than wrapping or shrinking. */
const EDGE_GUARD = 72;

/**
 * Floating themed tooltip for inline SVG charts — positioned in plain CSS
 * pixels relative to the chart's wrapping `relative` container (see
 * useChartHover), so it works regardless of the SVG's own viewBox/scaling.
 */
export function ChartTooltip({
  x,
  y,
  containerWidth,
  children,
}: {
  x: number;
  y: number;
  /** From useChartHover's hover.containerWidth — enables edge clamping. */
  containerWidth?: number;
  children: React.ReactNode;
}) {
  let align: 'left' | 'center' | 'right' = 'center';
  if (containerWidth != null) {
    if (x < EDGE_GUARD) align = 'left';
    else if (x > containerWidth - EDGE_GUARD) align = 'right';
  }
  const xShift = align === 'left' ? '0' : align === 'right' ? '-100%' : '-50%';

  return (
    <div
      className="glass-popover pointer-events-none absolute z-30 whitespace-nowrap !rounded-[10px] px-2.5 py-1.5 text-[11px] leading-tight text-ink"
      style={{ left: x, top: y - 10, transform: `translate(${xShift}, -100%)` }}
    >
      {children}
    </div>
  );
}
