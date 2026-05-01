// Theus brand tokens — dark forest green + cream + soft gold accent.
// No glow, no neon, no navy. Warm and earthy but quiet.

const THEUS = {
  dark: {
    bg: '#0F1A14',           // deep forest
    bgSoft: '#162420',
    bgPanel: '#1C2C26',
    ink: '#EFE9D8',          // warm cream
    inkSoft: '#C7BFA9',
    inkMute: '#7E7762',
    rule: 'rgba(239,233,216,0.16)',
    grid: 'rgba(239,233,216,0.05)',
    accent: '#C9A24A',       // brass — accent moments
    accentSoft: 'rgba(201,162,74,0.18)',
    pos: '#7FB58A',          // sage/leaf green — gains
    posSoft: 'rgba(127,181,138,0.18)',
    neg: '#D9603A',          // warm rust — losses
    negSoft: 'rgba(217,96,58,0.16)',
  },
  light: {
    bg: '#F2EEDF',           // warm cream
    bgSoft: '#E8E3D0',
    bgPanel: '#FFFAEC',
    ink: '#0F1A14',
    inkSoft: '#2A3A33',
    inkMute: '#6E6852',
    rule: 'rgba(15,26,20,0.18)',
    grid: 'rgba(15,26,20,0.06)',
    accent: '#7A5A1B',
    accentSoft: 'rgba(122,90,27,0.14)',
    pos: '#3D5A48',
    posSoft: 'rgba(61,90,72,0.14)',
    neg: '#8E4A22',
    negSoft: 'rgba(142,74,34,0.14)',
  },
};

const TFONTS = {
  display: "'Instrument Serif', 'Times New Roman', serif",
  grotesk: "'Inter', -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

window.THEUS = THEUS;
window.TFONTS = TFONTS;
