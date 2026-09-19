/**
 * Trips-page-only subcategory palette. lib/categoryColor.ts's app-wide
 * seven-hue set has several blues sitting next to each other (indigo, sky,
 * navy) that read as near-identical at swatch/segment size — fine spread
 * across a whole category list, but two of them landing adjacent inside one
 * trip's segmented bar makes that bar hard to read. This is a separate,
 * wider palette (more hues, spread further around the wheel) used only by
 * components/trips/* — the rest of the app keeps categoryColor() unchanged.
 */

const TRIP_SUBCATEGORY_HUES = [
  '#4a5ce0', // indigo
  '#f2708f', // coral
  '#1fb9a4', // teal
  '#f4a545', // amber
  '#8b5cf6', // violet
  '#2ea3e8', // sky
  '#d6336c', // rose
  '#7c9a3a', // olive
];

const cache = new Map<string, string>();

export function tripSubcategoryColor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '#8b95b8';

  const hit = cache.get(trimmed);
  if (hit) return hit;

  let h = 0;
  for (let i = 0; i < trimmed.length; i++) {
    h = (h * 31 + trimmed.charCodeAt(i)) | 0;
  }
  const color = TRIP_SUBCATEGORY_HUES[Math.abs(h) % TRIP_SUBCATEGORY_HUES.length]!;
  cache.set(trimmed, color);
  return color;
}
