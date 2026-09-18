/**
 * Theus brand mark — three stacked slabs ("leaning tower of deposits").
 * Two cream slabs at the base + one tilted brass slab on top.
 * Ported from design-refs/src/theus-logo.jsx → TheusStack.
 */
export function TheusMark({
  size = 32,
  className,
  tone = 'ink',
}: {
  size?: number;
  className?: string;
  /** 'ink' — dark base slabs + indigo top slab (default, for light surfaces).
   *  'white' — all three slabs in white/translucent-white, for use on the
   *  nav's colored gradient tile. */
  tone?: 'ink' | 'white';
}) {
  const baseFill = tone === 'white' ? 'rgba(255,255,255,.92)' : 'var(--ink)';
  const topFill = tone === 'white' ? '#ffffff' : 'var(--indigo)';
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', overflow: 'visible' }}
      aria-hidden
    >
      {/* base slab — widest */}
      <rect x="6" y="44" width="52" height="11" rx="2.5" fill={baseFill} />
      {/* mid slab */}
      <rect x="11" y="30" width="42" height="11" rx="2.5" fill={baseFill} />
      {/* top slab — tilted, brass accent */}
      <g transform="rotate(-12 32 18)">
        <rect x="17" y="13" width="30" height="11" rx="2.5" fill={topFill} />
      </g>
    </svg>
  );
}

export function TheusLockup({ size = 28 }: { size?: number }) {
  return (
    <div className="inline-flex items-center gap-3">
      <TheusMark size={Math.round(size * 1.25)} />
      <span
        className="font-semibold leading-none"
        style={{ fontSize: size, letterSpacing: '-0.03em' }}
      >
        Theus
      </span>
    </div>
  );
}
