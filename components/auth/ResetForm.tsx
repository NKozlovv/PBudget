'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Field, Input, Mono } from '@/components/ui';

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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Mono size="sm" tone="mute">
        reset password
      </Mono>
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
      {error ? (
        <p className="text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}
      {info ? <p className="text-[13px] text-pos">{info}</p> : null}
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="text-[13px] text-ink-soft">
        <Link href="/login" className="text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
