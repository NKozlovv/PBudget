/**
 * Stable category color assignment from a fixed palette.
 *
 * Hand-tuned warm-earthy palette (CLAUDE.md §6 guidance). Stays
 * consistent for a given category name across the app — same color
 * in donut, pill, drill-down header.
 *
 * Per-category color editor was deferred (rehaul-plan §4) — this
 * is a stable hash-based assignment instead.
 */

const PALETTE = [
  '#D8B055', // brass (accent)
  '#7FB58A', // sage (pos)
  '#E9673E', // rust (neg)
  '#7DAAD0', // dusty blue
  '#B695D5', // mauve
  '#A0B27C', // olive
  '#D9A07A', // peach
  '#9CB4A1', // muted green
  '#C9B271', // wheat
  '#A48BB1', // purple-gray
];

const cache = new Map<string, string>();

export function categoryColor(name: string | null | undefined): string {
  const key = (name ?? '').trim() || '__uncategorised';
  const hit = cache.get(key);
  if (hit) return hit;
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % PALETTE.length;
  const color = PALETTE[idx]!;
  cache.set(key, color);
  return color;
}
