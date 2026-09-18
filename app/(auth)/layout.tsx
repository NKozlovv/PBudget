import { BrandPanel } from '@/components/auth/BrandPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ambient-ground">
      <div className="ambient-layer">
        <div className="ambient-blob ambient-blob-coral" />
        <div className="ambient-blob ambient-blob-indigo" />
        <div className="ambient-blob ambient-blob-teal" />
      </div>
      <div className="relative z-[1] mx-auto grid max-w-[1520px] items-stretch gap-5 px-[26px] py-5 md:min-h-screen md:grid-cols-[1.15fr_1fr]">
        <BrandPanel />
        <section className="glass flex min-h-[600px] items-center justify-center !rounded-[34px] p-[34px]">
          <div className="w-full max-w-[400px]">{children}</div>
        </section>
      </div>
    </div>
  );
}
