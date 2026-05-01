// Theus stack — leaning tower of deposits, matches the v1 reference screenshot.
// Two flat slabs at the base (cream) + one tilted top slab (red accent).

const TheusStack = ({ size = 64, ink = 'currentColor', accent, variant = 'default' }) => {
  // The mark, designed in 64x64. Two cream slabs + tilted red top.
  const W = 64;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      {/* base slab — widest */}
      <rect x="6"  y="44" width="52" height="11" rx="2.5" fill={ink}/>
      {/* mid slab */}
      <rect x="11" y="30" width="42" height="11" rx="2.5" fill={ink}/>
      {/* top slab — tilted, accent */}
      <g transform="rotate(-12 32 18)">
        <rect x="17" y="13" width="30" height="11" rx="2.5" fill={accent || ink}/>
      </g>
    </svg>
  );
};

const TheusWordmark = ({ size = 56, color = 'currentColor', weight = 600, letterSpacing = '-0.04em', text = 'theus' }) => (
  <span style={{
    fontFamily: TFONTS.grotesk,
    fontWeight: weight,
    fontSize: size,
    letterSpacing,
    color,
    lineHeight: 0.9,
  }}>{text}</span>
);

const TheusLockup = ({ size = 48, color = 'currentColor', accent, stacked = false, gap }) => {
  const symSize = size * 1.25;
  const realGap = gap ?? size * 0.35;
  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: stacked ? 'column' : 'row',
      alignItems: stacked ? 'flex-start' : 'center',
      gap: realGap, color,
    }}>
      <TheusStack size={symSize} ink={color} accent={accent}/>
      <TheusWordmark size={size} color={color}/>
    </div>
  );
};

Object.assign(window, { TheusStack, TheusWordmark, TheusLockup });
