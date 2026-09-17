'use client';

import { usePathname } from 'next/navigation';

/**
 * Re-keys on every route change so the `rise-in` mount animation
 * actually replays on each tab switch (design_handoff_theus_rehaul
 * README "Motion budget": "runs on every tab switch") — the shared
 * (app) layout persists across client-side navigation, so without a
 * key here the wrapping <main> never remounts.
 */
export function ScreenTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <main key={pathname} className="rise mt-[22px] flex flex-col gap-5">
      {children}
    </main>
  );
}
