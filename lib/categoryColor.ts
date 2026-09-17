/**
 * Stable category color assignment — v4 "liquid glass" six-hue map
 * (design_handoff_theus_rehaul README "Category hue map"). Categories are
 * user-defined free text, so exact names can't be hardcoded; instead each
 * name hashes deterministically onto this fixed seven-hue set (replacing
 * the old ten-hue hash), with "Income" special-cased to --in and an
 * "everything else" fallback to --slate never actually reached by the
 * hash pool below (kept as CATEGORY_FALLBACK for empty/uncategorised).
 *
 * Same color for a given category name everywhere: donut, tags, dots,
 * meters, trend cells.
 */

const CATEGORY_HUES = [
  '#1fb9a4', // teal
  '#1f2742', // navy
  '#f2708f', // coral
  '#f4a545', // amber
  '#8b5cf6', // violet
  '#3da3ef', // sky
  '#4a5ce0', // indigo
];

const CATEGORY_FALLBACK = '#8b95b8'; // slate — uncategorised only
const INCOME_HUE = '#12a08c'; // --in

const cache = new Map<string, string>();

export function categoryColor(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return CATEGORY_FALLBACK;
  if (trimmed.toLowerCase() === 'income') return INCOME_HUE;

  const hit = cache.get(trimmed);
  if (hit) return hit;

  let h = 0;
  for (let i = 0; i < trimmed.length; i++) {
    h = (h * 31 + trimmed.charCodeAt(i)) | 0;
  }
  const color = CATEGORY_HUES[Math.abs(h) % CATEGORY_HUES.length]!;
  cache.set(trimmed, color);
  return color;
}

/** hex (e.g. "#4a5ce0") + alpha (0–1) -> "rgba(r, g, b, a)". */
export function tint(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
