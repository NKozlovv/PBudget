// Sterling logo system — abstract symbol + wordmark, multiple directions.
// All scale to currentColor / accent so they work on any background.

// Direction A — "Tally": four marks + a fifth slash, classic ledger tally.
// References folk-craft, hand-counted ledgers.
const SymbolTally = ({ size = 64, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <g stroke={color} strokeWidth="6" strokeLinecap="round" fill="none">
      <line x1="12" y1="14" x2="12" y2="50"/>
      <line x1="22" y1="14" x2="22" y2="50"/>
      <line x1="32" y1="14" x2="32" y2="50"/>
      <line x1="42" y1="14" x2="42" y2="50"/>
    </g>
    <line x1="6" y1="50" x2="50" y2="14" stroke={accent || color} strokeWidth="6" strokeLinecap="round"/>
  </svg>
);

// Direction B — "Sun-S": an S formed by a sunset arc — retro-optimistic.
const SymbolSunS = ({ size = 64, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <defs>
      <clipPath id="ss-clip"><rect x="0" y="0" width="64" height="32"/></clipPath>
    </defs>
    {/* upper half: sun rising */}
    <g clipPath="url(#ss-clip)">
      <circle cx="32" cy="32" r="22" fill={accent || color}/>
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI + (i / 8) * Math.PI;
        return <line key={i} x1="32" y1="32" x2={32 + Math.cos(a) * 30} y2={32 + Math.sin(a) * 30} stroke={color} strokeWidth="2" strokeLinecap="round"/>;
      })}
    </g>
    {/* lower half: reflective curve */}
    <path d="M 10 38 Q 32 56, 54 38" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
    <line x1="6" y1="32" x2="58" y2="32" stroke={color} strokeWidth="1.5"/>
  </svg>
);

// Direction C — "Coin-S": A coin with an S-spiral inside, folk-craft.
const SymbolCoinS = ({ size = 64, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <circle cx="32" cy="32" r="28" fill={color}/>
    <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="0" />
    {/* the S, carved out as paper-color via accent */}
    <path d="M 42 22 C 42 18, 38 16, 32 16 C 24 16, 22 22, 22 26 C 22 30, 26 32, 32 32 C 38 32, 42 34, 42 38 C 42 42, 38 48, 32 48 C 26 48, 22 46, 22 42"
      fill="none" stroke={accent || '#F1ECE0'} strokeWidth="5" strokeLinecap="round"/>
    {/* tiny hand-engraved tick */}
    <circle cx="50" cy="14" r="2" fill={accent || '#F1ECE0'}/>
  </svg>
);

// Direction D — "Stack": three stacked horizontal bars (deposits), one tilted.
// Playful & alive — the tilt is the "soul".
const SymbolStack = ({ size = 64, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <rect x="10" y="42" width="44" height="10" rx="2" fill={color}/>
    <rect x="14" y="28" width="36" height="10" rx="2" fill={color}/>
    <g transform="rotate(-8 32 18)">
      <rect x="18" y="13" width="28" height="10" rx="2" fill={accent || color}/>
    </g>
  </svg>
);

// Direction E — "Spiral": a tight spiral — money compounding, hand-drawn feel.
const SymbolSpiral = ({ size = 64, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 64 64" width={size} height={size}>
    <path d="M 32 32 m 0 -2 a 2 2 0 1 1 0 4 a 4 4 0 1 0 0 -8 a 6 6 0 1 1 0 12 a 9 9 0 1 0 0 -18 a 12 12 0 1 1 0 24 a 16 16 0 1 0 0 -32 a 20 20 0 1 1 0 40"
      fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"/>
    <circle cx="32" cy="32" r="2" fill={accent || color}/>
  </svg>
);

// Wordmark — uses display serif italic for "sterling" with a small mark
const Wordmark = ({ name = 'sterling', color = 'currentColor', accent, size = 56, italic = true, withMark = true, markKind = 'tally' }) => {
  const Sym = { tally: SymbolTally, sun: SymbolSunS, coin: SymbolCoinS, stack: SymbolStack, spiral: SymbolSpiral }[markKind] || SymbolTally;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.25, color }}>
      {withMark && <Sym size={size * 1.05} color={color} accent={accent}/>}
      <div style={{
        fontFamily: FONTS.display, fontStyle: italic ? 'italic' : 'normal',
        fontSize: size, lineHeight: 0.9, letterSpacing: '-0.02em', fontWeight: 400,
      }}>{name}</div>
    </div>
  );
};

// Grotesk wordmark (alternate)
const WordmarkGrotesk = ({ name = 'STERLING', color = 'currentColor', accent, size = 36, withMark = true, markKind = 'tally' }) => {
  const Sym = { tally: SymbolTally, sun: SymbolSunS, coin: SymbolCoinS, stack: SymbolStack, spiral: SymbolSpiral }[markKind] || SymbolTally;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.4, color }}>
      {withMark && <Sym size={size * 1.4} color={color} accent={accent}/>}
      <div style={{
        fontFamily: FONTS.grotesk, fontWeight: 700,
        fontSize: size, lineHeight: 0.9, letterSpacing: '-0.04em',
      }}>{name}</div>
    </div>
  );
};

Object.assign(window, {
  SymbolTally, SymbolSunS, SymbolCoinS, SymbolStack, SymbolSpiral,
  Wordmark, WordmarkGrotesk,
});
