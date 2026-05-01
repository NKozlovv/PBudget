// Sterling brand v2 — folk / craft / retro-optimistic / playful
// Cream + ink + electric red. Grotesk + mono numerals.

const BRAND = {
  light: {
    paper: '#F1ECE0',      // warm cream
    paperSoft: '#E7E0D0',
    ink: '#1A1614',        // near-black, slight warmth
    inkSoft: '#3D332B',
    inkMute: '#7A6E60',
    rule: 'rgba(26,22,20,0.18)',
    grid: 'rgba(26,22,20,0.06)',
    accent: '#E8331C',     // electric red
    accentDeep: '#B5240F',
    sun: '#F2A93B',        // warm secondary (sunburst)
    leaf: '#3D5A3A',       // earthy green secondary
  },
  dark: {
    paper: '#0E0C0A',      // espresso ink
    paperSoft: '#181512',
    ink: '#F1ECE0',        // cream
    inkSoft: '#C9C0AE',
    inkMute: '#7A6E60',
    rule: 'rgba(241,236,224,0.18)',
    grid: 'rgba(241,236,224,0.06)',
    accent: '#FF4A33',
    accentDeep: '#E8331C',
    sun: '#F2A93B',
    leaf: '#7FA37B',
  },
};

const FONTS = {
  display: "'Instrument Serif', 'Times New Roman', serif",
  grotesk: "'Inter Tight', 'Inter', -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

window.BRAND = BRAND;
window.FONTS = FONTS;
