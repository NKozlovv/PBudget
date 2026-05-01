// Sterling design tokens — dark default, with light variant
const sterlingTokens = {
  dark: {
    bg: '#0A0E1A',
    bgElev: '#10162a',
    bgSubtle: '#0d1322',
    surface: '#141a2e',
    surfaceHi: '#1a2138',
    line: 'rgba(255,255,255,0.08)',
    lineStrong: 'rgba(255,255,255,0.14)',
    ink: '#F5F6FA',
    inkSoft: '#B6BCD0',
    inkMute: '#7480A0',
    inkFaint: '#4A5476',
    accent: '#7B8BFF',     // electric blue/indigo
    accentHi: '#A78BFA',   // lavender
    accentSoft: 'rgba(123,139,255,0.15)',
    pos: '#5EE6A8',        // mint
    posSoft: 'rgba(94,230,168,0.12)',
    neg: '#FF7A8A',        // coral
    negSoft: 'rgba(255,122,138,0.12)',
    warn: '#FFC979',
    chip: 'rgba(255,255,255,0.06)',
    chipHi: 'rgba(255,255,255,0.10)',
    glow: 'radial-gradient(ellipse at top, rgba(123,139,255,0.18), transparent 60%)',
  },
  light: {
    bg: '#F4F5F8',
    bgElev: '#FFFFFF',
    bgSubtle: '#ECEEF3',
    surface: '#FFFFFF',
    surfaceHi: '#F8F9FC',
    line: 'rgba(10,14,26,0.08)',
    lineStrong: 'rgba(10,14,26,0.14)',
    ink: '#0A0E1A',
    inkSoft: '#3A4159',
    inkMute: '#6B7493',
    inkFaint: '#A2A9C0',
    accent: '#4F5BFF',
    accentHi: '#7C5BF0',
    accentSoft: 'rgba(79,91,255,0.10)',
    pos: '#1AA86A',
    posSoft: 'rgba(26,168,106,0.10)',
    neg: '#E04559',
    negSoft: 'rgba(224,69,89,0.10)',
    warn: '#D78B2D',
    chip: 'rgba(10,14,26,0.04)',
    chipHi: 'rgba(10,14,26,0.07)',
    glow: 'radial-gradient(ellipse at top, rgba(79,91,255,0.10), transparent 60%)',
  },
};

const ThemeContext = React.createContext({ mode: 'dark', t: sterlingTokens.dark });

const useT = () => React.useContext(ThemeContext);

const ThemeProvider = ({ mode, children }) => {
  const t = sterlingTokens[mode] || sterlingTokens.dark;
  return <ThemeContext.Provider value={{ mode, t }}>{children}</ThemeContext.Provider>;
};

// Helpers
const fmtMoney = (n, ccy = '€', opts = {}) => {
  if (n == null || isNaN(n)) return '—';
  const abs = Math.abs(n);
  const sign = n < 0 ? '−' : '';
  const fixed = opts.compact && abs >= 1000
    ? (abs >= 1000000 ? (abs/1000000).toFixed(1) + 'M' : (abs/1000).toFixed(1) + 'k')
    : abs.toLocaleString('en-US', { minimumFractionDigits: opts.decimals ?? 2, maximumFractionDigits: opts.decimals ?? 2 });
  return `${sign}${ccy}${fixed}`;
};

const fmtNumber = (n, opts = {}) => {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: opts.decimals ?? 2, maximumFractionDigits: opts.decimals ?? 2 });
};

Object.assign(window, { sterlingTokens, ThemeContext, ThemeProvider, useT, fmtMoney, fmtNumber });
