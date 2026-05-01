import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        'bg-panel': 'var(--bg-panel)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-mute': 'var(--ink-mute)',
        rule: 'var(--rule)',
        grid: 'var(--grid)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        pos: 'var(--pos)',
        'pos-soft': 'var(--pos-soft)',
        neg: 'var(--neg)',
        'neg-soft': 'var(--neg-soft)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-instrument-serif)', 'Times New Roman', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        'mono-label': '0.14em',
      },
    },
  },
  plugins: [],
};

export default config;
