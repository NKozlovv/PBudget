'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from './AuthHeader';
import { AuthBanner } from './AuthBanner';

export function ResetForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });
      if (authError) {
        // A genuine transport failure — the only case that breaks the
        // otherwise-neutral pattern below (never say whether the account exists).
        setError('We could not send that email right now. Try again in a moment.');
        return;
      }
      setSent(true);
    } catch {
      setError('We could not send that email right now. Try again in a moment.');
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div>
        <AuthHeader title="Check your email" subtitle="One more step and you'll be back in." />
        <AuthBanner tone="ok">If an account exists for that address, a reset link is on its way.</AuthBanner>
        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-full border border-white/90 bg-white/70 py-[14px] text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader title="Reset your password" subtitle="We will email you a link to set a new one." />

      {error ? <AuthBanner tone="err">{error}</AuthBanner> : null}

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

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex w-full items-center justify-center gap-[9px] rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-[14px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 ease-theus hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? (
          <>
            <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/35 border-t-white" />
            Sending…
          </>
        ) : (
          'Send reset link'
        )}
      </button>

      <p className="mt-[22px] text-center text-[13.5px] font-semibold text-ink-mute">
        Changed your mind?{' '}
        <Link href="/login" className="font-bold text-indigo hover:text-indigo-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
