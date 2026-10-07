'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from './AuthHeader';
import { AuthBanner } from './AuthBanner';
import { safeNext } from '@/lib/safeNext';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  // Arriving from an invite link: keep the invite attached if they'd rather create an account.
  const inviteMatch = /^\/invite\/([0-9a-f-]{36})$/i.exec(next);
  const signupHref = inviteMatch
    ? `/signup?invite=${inviteMatch[1]}&email=${encodeURIComponent(params.get('email') ?? '')}`
    : '/signup';

  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    params.get('error') === 'link' ? 'That link is invalid or has expired. Sign in, or request a new one.' : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader title="Welcome back" subtitle="Sign in to pick up where you left off." />

      {error ? <AuthBanner tone="err">{error}</AuthBanner> : null}

      <div className="flex flex-col gap-[14px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-[15px] border border-white/80 bg-white/[0.72] px-4 py-[13px] text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
          />
        </label>

        <label className="flex flex-col gap-[7px]">
          <span className="flex items-baseline justify-between gap-[10px]">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Password</span>
            <Link href="/reset" className="text-[11.5px] font-bold text-indigo hover:text-indigo-dark hover:underline">
              Forgot password?
            </Link>
          </span>
          <input
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-[15px] border border-white/80 bg-white/[0.72] px-4 py-[13px] text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex w-full items-center justify-center gap-[9px] rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-[14px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 ease-theus hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </button>

      <p className="mt-[22px] text-center text-[13.5px] font-semibold text-ink-mute">
        No account yet?{' '}
        <Link href={signupHref} className="font-bold text-indigo hover:text-indigo-dark hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
