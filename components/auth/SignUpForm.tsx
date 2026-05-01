'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Field, Input, Mono } from '@/components/ui';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        setInfo('Check your inbox for a confirmation link.');
      } else if (data.session) {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Mono size="sm" tone="mute">
        create account
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
      <Field label="Password" hint="At least 6 characters">
        {({ id }) => (
          <Input
            id={id}
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
        {pending ? 'Creating…' : 'Create account'}
      </Button>
      <p className="text-[13px] text-ink-soft">
        Already have one?{' '}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
