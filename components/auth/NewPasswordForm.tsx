'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AuthHeader } from './AuthHeader';
import { AuthBanner } from './AuthBanner';

const input =
  'rounded-[15px] border border-white/80 bg-white/[0.72] px-4 py-[13px] text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]';

/**
 * Final step of "forgot password": the emailed link went through
 * /auth/callback, which exchanged its code for a session, so the visitor is
 * signed in just long enough to choose a new password here.
 */
export function NewPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) return setError('Use at least 6 characters.');
    if (password !== confirm) return setError('The two passwords don’t match.');
    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) {
        setError(authError.message);
        return;
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader title="Choose a new password" subtitle="You’ll be signed in right after." />
      {error ? <AuthBanner tone="err">{error}</AuthBanner> : null}
      <div className="flex flex-col gap-[14px]">
        <label className="flex flex-col gap-[7px]">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">New password</span>
          <input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={input} />
          <span className="text-[12px] font-semibold text-ink-mute">Minimum 6 characters</span>
        </label>
        <label className="flex flex-col gap-[7px]">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-mute">Repeat it</span>
          <input type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={input} />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex w-full items-center justify-center gap-[9px] rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-[14px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 ease-theus hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
      >
        {pending ? 'Saving…' : 'Save password'}
      </button>
    </form>
  );
}
