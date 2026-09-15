'use client';

import { useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

export interface ChartHover<T> {
  data: T;
  x: number;
  y: number;
}

/**
 * Shared hover-tracking for chart tooltips. Position is computed in plain
 * CSS pixels relative to the wrapping container (attach `containerRef` to a
 * `relative`-positioned div around the SVG) rather than SVG viewBox units,
 * so it's correct regardless of how the SVG scales (`width="100%"`,
 * `preserveAspectRatio="none"`, etc).
 */
export function useChartHover<T>() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState<ChartHover<T> | null>(null);

  function show(e: ReactMouseEvent, data: T) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setHover({ data, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  function hide() {
    setHover(null);
  }

  return { containerRef, hover, show, hide };
}
