'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Field, Input } from '@/components/ui';
import { AuthHeader } from './AuthHeader';

export function ResetForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      });
      if (authError) {
        setError(authError.message);
        return;
      }
      setInfo('If that account exists, a reset link has been sent.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader
        kicker="forgot password"
        title="Reset password"
        subtitle="Enter your email and we'll send a reset link."
      />

      <div className="flex flex-col gap-4">
        <Field label="Email">
          {({ id }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </Field>
      </div>

      {error ? (
        <p className="mt-5 text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="mt-5 text-[13px] text-pos" role="status">
          {info}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="mt-7 w-full py-3.5">
        {pending ? 'Sending…' : 'Send reset link →'}
      </Button>

      <p className="mt-6 text-center text-[13px] text-ink-mute">
        <Link href="/login" className="text-accent font-medium hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
