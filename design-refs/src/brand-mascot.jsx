// Coach mascot — a friendly companion. 4 stylistic directions.
// Should feel handcrafted, not corporate, not Clippy.

// A — "Pip" — a little blob with an antenna and one eye. Folk-modern.
const MascotPip = ({ size = 120, color = 'currentColor', accent, mood = 'idle' }) => {
  const eyeY = mood === 'wink' ? 60 : 58;
  return (
    <svg viewBox="0 0 100 120" width={size * (100/120)} height={size}>
      <line x1="50" y1="14" x2="50" y2="30" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="50" cy="11" r="4" fill={accent || color}/>
      <path d="M 22 30 Q 50 18, 78 30 L 84 88 Q 78 108, 50 108 Q 22 108, 16 88 Z" fill={color}/>
      {mood === 'wink'
        ? <path d={`M 38 ${eyeY} q 6 -4, 12 0`} fill="none" stroke={accent || '#F1ECE0'} strokeWidth="3" strokeLinecap="round"/>
        : <circle cx="44" cy={eyeY} r="3.5" fill={accent || '#F1ECE0'}/>}
      <circle cx="60" cy={eyeY} r="3.5" fill={accent || '#F1ECE0'}/>
      <path d="M 42 76 Q 50 82, 58 76" fill="none" stroke={accent || '#F1ECE0'} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="22" cy="58" r="2.5" fill={accent || color} opacity="0.5"/>
      <circle cx="78" cy="58" r="2.5" fill={accent || color} opacity="0.5"/>
    </svg>
  );
};

// B — "Owl" — wise but warm. Nighttime ledger keeper.
const MascotOwl = ({ size = 120, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 100 120" width={size * (100/120)} height={size}>
    {/* tufts */}
    <path d="M 26 26 L 32 12 L 38 26 Z" fill={color}/>
    <path d="M 62 26 L 68 12 L 74 26 Z" fill={color}/>
    {/* body */}
    <ellipse cx="50" cy="64" rx="34" ry="42" fill={color}/>
    {/* belly */}
    <ellipse cx="50" cy="80" rx="20" ry="22" fill={accent || '#F1ECE0'} opacity="0.18"/>
    {/* eyes */}
    <circle cx="36" cy="50" r="11" fill={accent || '#F1ECE0'}/>
    <circle cx="64" cy="50" r="11" fill={accent || '#F1ECE0'}/>
    <circle cx="36" cy="50" r="4" fill={color}/>
    <circle cx="64" cy="50" r="4" fill={color}/>
    {/* beak */}
    <path d="M 46 60 L 50 68 L 54 60 Z" fill={accent || '#F1ECE0'}/>
    {/* feet */}
    <path d="M 38 104 l 0 8 m -4 0 l 8 0" stroke={accent || color} strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M 62 104 l 0 8 m -4 0 l 8 0" stroke={accent || color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

// C — "Fox" — cunning but warm guide.
const MascotFox = ({ size = 120, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 120 120" width={size} height={size}>
    {/* head */}
    <path d="M 20 30 L 36 70 L 60 80 L 84 70 L 100 30 L 80 50 L 60 44 L 40 50 Z" fill={color}/>
    {/* snout */}
    <path d="M 44 64 L 60 90 L 76 64 Z" fill={accent || '#F1ECE0'} opacity="0.95"/>
    {/* eyes */}
    <ellipse cx="46" cy="52" rx="3" ry="4" fill={accent || '#F1ECE0'}/>
    <ellipse cx="74" cy="52" rx="3" ry="4" fill={accent || '#F1ECE0'}/>
    {/* nose */}
    <circle cx="60" cy="76" r="3" fill={color}/>
    {/* ear inserts */}
    <path d="M 30 38 L 38 56 L 42 44 Z" fill={accent || '#F1ECE0'} opacity="0.6"/>
    <path d="M 90 38 L 82 56 L 78 44 Z" fill={accent || '#F1ECE0'} opacity="0.6"/>
  </svg>
);

// D — "Bean" — a soft anthropomorphic coin. Playful & alive.
const MascotBean = ({ size = 120, color = 'currentColor', accent }) => (
  <svg viewBox="0 0 120 120" width={size} height={size}>
    {/* coin */}
    <ellipse cx="60" cy="64" rx="44" ry="42" fill={color}/>
    {/* engraved S */}
    <path d="M 74 50 C 74 44, 68 40, 60 40 C 52 40, 48 46, 48 52 C 48 58, 54 62, 60 62 C 66 62, 72 66, 72 72 C 72 78, 66 84, 60 84 C 52 84, 48 80, 48 74"
      fill="none" stroke={accent || '#F1ECE0'} strokeWidth="3" strokeLinecap="round" opacity="0.3"/>
    {/* eyes */}
    <circle cx="44" cy="56" r="3.5" fill={accent || '#F1ECE0'}/>
    <circle cx="76" cy="56" r="3.5" fill={accent || '#F1ECE0'}/>
    {/* smile */}
    <path d="M 48 72 Q 60 80, 72 72" fill="none" stroke={accent || '#F1ECE0'} strokeWidth="2.5" strokeLinecap="round"/>
    {/* little arms */}
    <path d="M 16 70 Q 8 76, 14 84" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
    <path d="M 104 70 Q 112 76, 106 84" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"/>
    {/* feet */}
    <ellipse cx="44" cy="110" rx="8" ry="3" fill={color}/>
    <ellipse cx="76" cy="110" rx="8" ry="3" fill={color}/>
  </svg>
);

Object.assign(window, { MascotPip, MascotOwl, MascotFox, MascotBean });
