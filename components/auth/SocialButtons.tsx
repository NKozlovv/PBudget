'use client';

import { Icon } from '@/components/ui';
import { Mono } from '@/components/ui';

export function SocialButtons() {
  return (
    <>
      <div className="flex gap-2.5 mb-5">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/90 bg-white/[0.72] px-3 py-[11px] text-[13px] font-semibold text-ink backdrop-blur-xl transition-colors hover:bg-white"
        >
          <Icon name="logo-google" size={16} /> Google
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 rounded-full border border-white/90 bg-white/[0.72] px-3 py-[11px] text-[13px] font-semibold text-ink backdrop-blur-xl transition-colors hover:bg-white"
        >
          <Icon name="logo-apple" size={16} /> Apple
        </button>
      </div>

      <div className="flex items-center gap-3 my-[18px] mb-[22px]">
        <div className="flex-1 h-px bg-white/70" />
        <Mono size="xs" className="tracking-[0.1em]">
          or
        </Mono>
        <div className="flex-1 h-px bg-white/70" />
      </div>
    </>
  );
}
