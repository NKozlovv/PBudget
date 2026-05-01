import { BrandPanel } from '@/components/auth/BrandPanel';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid md:grid-cols-[1.1fr_1fr]">
      <BrandPanel />
      <section className="flex items-center justify-center p-8 md:p-14 lg:p-16">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
