// Reusable brand atoms — grain, rules, sunburst, stamps, marks, stickers.

const Grain = ({ opacity = 0.08, dark = false }) => (
  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', mixBlendMode: dark ? 'screen' : 'multiply', opacity }}>
    <filter id={`g-${dark ? 'd' : 'l'}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values={dark
        ? "0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0"
        : "0 0 0 0 0.1  0 0 0 0 0.08  0 0 0 0 0.07  0 0 0 0.6 0"}/>
    </filter>
    <rect width="100%" height="100%" filter={`url(#g-${dark ? 'd' : 'l'})`}/>
  </svg>
);

// Sunburst — radiating rays from a point. Retro-optimistic anchor motif.
const Sunburst = ({ rays = 24, color = '#E8331C', cx = 50, cy = 50, r1 = 8, r2 = 80, strokeWidth = 1, opacity = 1 }) => {
  const lines = Array.from({ length: rays }, (_, i) => {
    const a = (i / rays) * Math.PI * 2;
    return {
      x1: cx + Math.cos(a) * r1, y1: cy + Math.sin(a) * r1,
      x2: cx + Math.cos(a) * r2, y2: cy + Math.sin(a) * r2,
    };
  });
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', opacity }} preserveAspectRatio="xMidYMid meet">
      {lines.map((l, i) => <line key={i} {...l} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>)}
      <circle cx={cx} cy={cy} r={r1 - 1} fill={color}/>
    </svg>
  );
};

// A retro half-sun rising over a horizon
const HalfSun = ({ color = '#E8331C', sunColor = '#F2A93B', strokeWidth = 1.5 }) => {
  const rays = 16;
  return (
    <svg viewBox="0 0 200 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: rays }, (_, i) => {
        const a = Math.PI + (i / (rays - 1)) * Math.PI;
        return <line key={i} x1={100} y1={100} x2={100 + Math.cos(a) * 95} y2={100 + Math.sin(a) * 95} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>;
      })}
      <path d="M 30 100 A 70 70 0 0 1 170 100 Z" fill={sunColor}/>
    </svg>
  );
};

// Ledger rules — horizontal lines like a paper ledger
const LedgerRules = ({ color = 'rgba(26,22,20,0.12)', spacing = 24 }) => (
  <div style={{
    position: 'absolute', inset: 0, pointerEvents: 'none',
    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - 1}px, ${color} ${spacing - 1}px, ${color} ${spacing}px)`,
  }}/>
);

// A stamp — circular outlined rotated text seal
const Stamp = ({ text = 'CERTIFIED · STERLING · 2025 · ', color, size = 120, rotate = -8 }) => {
  const id = React.useMemo(() => `stamp-${Math.random().toString(36).slice(2, 8)}`, []);
  const radius = 38;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} style={{ transform: `rotate(${rotate}deg)` }}>
      <defs>
        <path id={id} d={`M 50 50 m -${radius} 0 a ${radius} ${radius} 0 1 1 ${radius * 2} 0 a ${radius} ${radius} 0 1 1 -${radius * 2} 0`}/>
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="0.8"/>
      <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="0.4" strokeDasharray="0.8 1.4"/>
      <text fontSize="6.2" fill={color} letterSpacing="1" fontFamily="'JetBrains Mono', monospace" fontWeight="600">
        <textPath href={`#${id}`} startOffset="0">{text}{text}</textPath>
      </text>
      <g transform="translate(50,50)">
        <circle r="14" fill="none" stroke={color} strokeWidth="0.8"/>
        <text textAnchor="middle" dy="2.2" fontSize="7" fill={color} fontFamily="'Instrument Serif', serif" fontStyle="italic">est.</text>
      </g>
    </svg>
  );
};

// A "sticker" wrapper — soft shadow, slight rotation, paper feel
const Sticker = ({ rotate = 0, children, style = {} }) => (
  <div style={{
    transform: `rotate(${rotate}deg)`,
    boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 12px 24px -12px rgba(0,0,0,0.25), 0 4px 8px -4px rgba(0,0,0,0.12)',
    ...style,
  }}>{children}</div>
);

// Editorial pull-number — huge serif italic numeral with mono caption
const PullNumber = ({ value, label, color, accent, italic = true }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
    <div style={{
      fontFamily: FONTS.display, fontStyle: italic ? 'italic' : 'normal',
      fontSize: 120, lineHeight: 0.85, color, fontWeight: 400,
      letterSpacing: '-0.02em',
    }}>{value}</div>
    {label && <div style={{
      fontFamily: FONTS.mono, fontSize: 11, color: accent,
      textTransform: 'uppercase', letterSpacing: '0.12em', maxWidth: 100,
    }}>{label}</div>}
  </div>
);

// A hand-drawn-feel underline / circle / arrow
const HandMark = ({ kind = 'underline', color = '#E8331C', size = 100, strokeWidth = 3 }) => {
  if (kind === 'underline') return (
    <svg viewBox="0 0 100 14" width={size} height={size * 0.14} style={{ display: 'block' }}>
      <path d="M 2 8 Q 25 2, 50 7 T 98 6" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    </svg>
  );
  if (kind === 'circle') return (
    <svg viewBox="0 0 100 60" width={size} height={size * 0.6} style={{ display: 'block' }}>
      <path d="M 50 5 C 80 5, 95 20, 95 30 C 95 45, 75 55, 50 55 C 25 55, 5 45, 5 30 C 5 18, 22 7, 50 6" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    </svg>
  );
  if (kind === 'arrow') return (
    <svg viewBox="0 0 100 40" width={size} height={size * 0.4} style={{ display: 'block' }}>
      <path d="M 5 30 Q 30 5, 60 18 T 90 12" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d="M 78 6 L 90 12 L 84 23" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (kind === 'star') return (
    <svg viewBox="0 0 24 24" width={size * 0.3} height={size * 0.3}>
      <path d="M 12 2 L 14 10 L 22 12 L 14 14 L 12 22 L 10 14 L 2 12 L 10 10 Z" fill={color}/>
    </svg>
  );
  return null;
};

// Mono ticker — like an old stock ticker line
const Ticker = ({ items, color, accent }) => (
  <div style={{
    fontFamily: FONTS.mono, fontSize: 11, color,
    display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap',
    letterSpacing: '0.04em',
  }}>
    {items.map((it, i) => (
      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: accent }}>●</span>{it}
      </span>
    ))}
  </div>
);

Object.assign(window, {
  Grain, Sunburst, HalfSun, LedgerRules, Stamp, Sticker, PullNumber, HandMark, Ticker,
});
