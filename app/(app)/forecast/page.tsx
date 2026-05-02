import { PageHeader } from '@/components/nav/PageHeader';
import { Stub } from '@/components/nav/Stub';

export const metadata = { title: 'Forecast · Theus' };

export default function ForecastPage() {
  return (
    <>
      <PageHeader kicker="projection" title="Forecast" tagline="where this is heading." />
      <Stub
        chunk={9}
        what="YTD averages, projected balance trajectory, per-category burn rate"
      />
    </>
  );
}
