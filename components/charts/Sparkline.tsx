/**
 * Static sparkline. Originally for the auth preview card; now also used
 * by the dashboard hero + KPI tiles. Modeled on design-refs/src/charts.jsx
 * Sparkline: gradient area fill from `color` plus a single-stroke line.
 */
export function Sparkline({
  data,
  width = 336,
  height = 60,
  color = 'var(--accent)',
  fillFrom,
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  /** Stroke + fill color. Pass any CSS color or var(--token). */
  color?: string;
  /** Override the gradient start color (defaults to `color` at 0.4 alpha). */
  fillFrom?: string;
  className?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`)
    .join(' ');
  const last = points[points.length - 1];
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gradId = `spk-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fillFrom ?? color} stopOpacity={fillFrom ? 1 : 0.4} />
          <stop offset="100%" stopColor={fillFrom ?? color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r={2.5} fill={color} /> : null}
    </svg>
  );
}
