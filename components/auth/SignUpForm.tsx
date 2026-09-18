'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from './AuthHeader';
import { AuthBanner } from './AuthBanner';

type Done = 'confirm' | 'redirecting' | null;

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Done>(null);
  const [pending, setPending] = useState(false);

  async function signUp() {
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      if (data.user && !data.session) {
        setDone('confirm');
      } else if (data.session) {
        setDone('redirecting');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await signUp();
  }

  if (done === 'confirm') {
    return (
      <div>
        <AuthHeader title="Confirm your email" subtitle="One more step before your budget is ready." />
        <AuthBanner tone="ok">We sent a link to {email}. Open it and you are in.</AuthBanner>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-full border border-white/90 bg-white/70 py-[14px] text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white"
        >
          Back to sign in
        </Link>
        <p className="mt-[18px] text-center text-[13.5px] font-semibold text-ink-mute">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={signUp}
            disabled={pending}
            className="font-bold text-indigo hover:text-indigo-dark hover:underline"
          >
            Resend the link
          </button>
        </p>
      </div>
    );
  }

  if (done === 'redirecting') {
    return (
      <div>
        <AuthHeader title="You are in" subtitle="Opening your dashboard…" />
        <div className="flex w-full items-center justify-center gap-[9px] rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-[14px] text-[15px] font-bold text-white">
          <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/35 border-t-white" />
          Continue
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader title="Create your budget" subtitle="Email and a password. That is the whole signup." />

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
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-[15px] border border-white/80 bg-white/[0.72] px-4 py-[13px] text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
          />
          <span className="text-[12px] font-semibold text-ink-mute">Minimum 6 characters</span>
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
            Creating…
          </>
        ) : (
          'Create account'
        )}
      </button>

      <p className="mt-[22px] text-center text-[13.5px] font-semibold text-ink-mute">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-indigo hover:text-indigo-dark hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
