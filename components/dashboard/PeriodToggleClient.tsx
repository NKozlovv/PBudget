'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PeriodToggle } from '@/components/ui';
import { type Period, PERIODS } from '@/lib/dashboard/period';

export function PeriodToggleClient({ value }: { value: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(next: Period) {
    const sp = new URLSearchParams(params.toString());
    if (next === 'Month') sp.delete('period');
    else sp.set('period', next);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return <PeriodToggle<Period> value={value} onChange={onChange} options={PERIODS} />;
}
