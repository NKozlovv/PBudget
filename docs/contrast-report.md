# Theus — WCAG contrast report

Verified by computing WCAG 2.1 relative luminance + contrast ratios. Targets:

- **AA normal text** ≥ 4.5:1
- **AA large text** ≥ 3.0:1 (≥ 18pt / 14pt bold)
- **AAA normal text** ≥ 7.0:1

## Sterling palette (current — Chunk 12)

Foreground × background matrix on the three primary surfaces:

| Foreground | On `--bg` #0A0E1A | On `--bg-soft` #0d1322 | On `--bg-panel` #141a2e |
| --- | --- | --- | --- |
| `--ink` #F5F6FA | **17.75** AAA | 17.07 AAA | 15.55 AAA |
| `--ink-soft` #B6BCD0 | 10.04 AAA | 9.66 AAA | 8.79 AAA |
| `--ink-mute` #7480A0 | **4.81** AA | 4.62 AA | 4.21 AA-Large |
| `--ink-faint` #4A5476 ⚠ | **2.65** FAIL | 2.55 FAIL | 2.32 FAIL |
| `--accent` #7B8BFF | 6.31 AA | 6.07 AA | 5.52 AA |
| `--accent-hi` #A78BFA | 6.32 AA | 6.07 AA | 5.53 AA |
| `--pos` #5EE6A8 | 12.21 AAA | 11.74 AAA | 10.69 AAA |
| `--neg` #FF7A8A | 7.64 AAA | 7.34 AAA | 6.69 AA |
| `--warn` #FFC979 | 12.92 AAA | 12.42 AAA | 11.31 AAA |

## Decorative-only tokens

`--ink-faint` fails AA at 2.65:1 against `--bg`. It is **decorative
only** — used for the ⌘K kbd hint in the topbar, kbd-pill borders,
and similar non-essential glyphs. Sterling uses it intentionally for
this purpose; do **not** put body text or interactive labels in it.

## Sterling source values

These contrast values come from Sterling's source tokens
(`design-refs/src/tokens.jsx`) applied unmodified. Earlier Theus
adjustments to `--ink-mute`, `--neg`, and `--accent` (recorded in this
file's prior version) no longer apply — Sterling's source palette is
the authority.

## Methodology

- Linearization per [WCAG 2.1 Relative Luminance](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
- Ratio = (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter luminance.

## Re-running

If the palette is updated, recompute and update the matrix above. Any
foreground/background pair below 4.5:1 used for body text must be
moved to a different surface or recolored. `--ink-faint` is the
explicit exception for decorative use.
