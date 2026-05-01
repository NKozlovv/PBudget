import Link from 'next/link';
import { Mono } from '@/components/ui';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="mb-10 inline-block">
        <h1 className="text-3xl font-semibold tracking-tight">Theus</h1>
        <p className="font-display italic text-base text-ink-mute mt-1">money understood.</p>
      </Link>

      <div className="w-full max-w-sm">{children}</div>

      <footer className="mt-12">
        <Mono size="xs">v2.0.0-alpha · auth</Mono>
      </footer>
    </main>
  );
}
