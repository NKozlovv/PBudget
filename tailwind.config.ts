import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        'bg-panel': 'var(--bg-panel)',
        'bg-elev': 'var(--bg-elev)',
        'bg-subtle': 'var(--bg-subtle)',
        surface: 'var(--surface)',
        'surface-hi': 'var(--surface-hi)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-mute': 'var(--ink-mute)',
        'ink-faint': 'var(--ink-faint)',
        rule: 'var(--rule)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        grid: 'var(--grid)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-hi': 'var(--accent-hi)',
        pos: 'var(--pos)',
        'pos-soft': 'var(--pos-soft)',
        neg: 'var(--neg)',
        'neg-soft': 'var(--neg-soft)',
        warn: 'var(--warn)',
        chip: 'var(--chip)',
        'chip-hi': 'var(--chip-hi)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument-serif)', 'Times New Roman', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'mono-label': '0.18em',
      },
    },
  },
  plugins: [],
};

export default config;
