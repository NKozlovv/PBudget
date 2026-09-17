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
        violet: 'var(--violet)',
        sky: 'var(--sky)',
        navy: 'var(--navy)',
        slate: 'var(--slate)',

        in: 'var(--in)',
        out: 'var(--out)',
        warn: 'var(--warn)',

        ground1: 'var(--ground-1)',
        ground2: 'var(--ground-2)',
        ground3: 'var(--ground-3)',
        ground4: 'var(--ground-4)',

        /* transitional aliases — 1:1 concept match onto the v4 palette,
           kept so files not yet converted don't render unstyled text.
           Drop once every screen is off the Sterling primitives. */
        accent: 'var(--indigo)',
        'accent-hi': 'var(--indigo-dark)',
        pos: 'var(--in)',
        neg: 'var(--out)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        panel: 'var(--r-panel)',
        card: 'var(--r-card)',
        inner: 'var(--r-inner)',
        tile: 'var(--r-tile)',
        row: 'var(--r-row)',
        chip: 'var(--r-chip)',
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        'panel-hover': 'var(--shadow-panel-hover)',
        nav: 'var(--shadow-nav)',
        solid: 'var(--shadow-solid)',
        action: 'var(--shadow-action)',
      },
      transitionTimingFunction: {
        glass: 'var(--ease-glass)',
        theus: 'var(--ease)',
      },
    },
  },
  plugins: [],
};

export default config;
