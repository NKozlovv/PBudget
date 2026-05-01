# Theus — WCAG contrast report (Chunk 1)

Verified by computing real WCAG 2.1 luminance + contrast ratios. Targets:

- **AA normal text** ≥ 4.5:1 (body, captions ≤ 18pt regular / 14pt bold)
- **AA large text** ≥ 3.0:1 (headings ≥ 18pt / 14pt bold)
- **AAA normal text** ≥ 7.0:1

## Foreground × background matrix

| Foreground | On `--bg` (#0F1A14) | On `--bg-soft` (#162420) | On `--bg-panel` (#1C2C26) |
| --- | --- | --- | --- |
| `--ink` #EFE9D8 | **14.70** AAA | 13.25 AAA | 12.05 AAA |
| `--ink-soft` #C7BFA9 | 9.72 AAA | 8.71 AAA | 7.97 AAA |
| `--ink-mute` #8E866E ★ | **4.91** AA | 4.38 AA | 4.02 AA-Large |
| `--accent` #D8B055 ★ | 8.71 AAA | 7.85 AAA | 7.14 AAA |
| `--pos` #7FB58A | 7.54 AAA | 6.78 AA | 6.18 AA |
| `--neg` #E9673E ★ | **5.50** AA | 4.92 AA | 4.50 AA |

## Adjustments from source palette

Two tokens were nudged from `design-refs/src/theus-tokens.jsx` to clear AA:

| Token | Source value | Source ratio (on bg) | New value | New ratio (on bg) | Why |
| --- | --- | --- | --- | --- | --- |
| `--ink-mute` | `#7E7762` | 3.99 | **`#8E866E`** | 4.91 | Used for mono labels (10–11px tracked); 3.99 fails AA for small text |
| `--neg` | `#D9603A` | 4.82 | **`#E9673E`** | 5.50 | Used for expense/loss numerals; 4.82 only narrowly passes, and on `--bg-panel` it dropped to 3.95 (AA-Large only) |
| `--accent` | `#C9A24A` | 7.43 | **`#D8B055`** | 8.71 | Brightened per design feedback; brass character preserved (just lifts the L value) |

Both shifts preserve hue and saturation feel; they only nudge lightness up. Approved deviation, documented here so the reference palette and the production tokens stay reconciled.

## Combinations not in production code

These pairings are NOT used and should be flagged in review if they ever appear:

- `--ink-mute` on `--bg-panel` is 4.02 — only AA-Large. Don't put body text in mute on the elevated panel surface; use `--ink-soft` instead.
- `--neg` on `--bg-panel` is 4.50 — passes AA but tight. Prefer placing neg numerals on the page bg.

## Methodology

- Linearization per [WCAG 2.1 Relative Luminance](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance)
- Ratio = (L1 + 0.05) / (L2 + 0.05), where L1 is the lighter luminance.
- Computed via `awk` (see commit history if you want to re-derive).

## Re-running

If the palette is updated, re-run the awk block from the Chunk 1 commit message and update the matrix above. Any FG/BG pair below 4.5:1 must either be moved to a different surface or have its lightness adjusted.
