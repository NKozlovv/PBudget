import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        'ink-mute': 'var(--ink-mute)',

        indigo: 'var(--indigo)',
        'indigo-dark': 'var(--indigo-dark)',
        teal: 'var(--teal)',
        coral: 'var(--coral)',
        amber: 'var(--amber)',

        in: 'var(--in)',
        out: 'var(--out)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      transitionTimingFunction: {
        theus: 'var(--ease)',
      },
    },
  },
  plugins: [],
};

export default config;
