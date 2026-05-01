'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Field, Input, Mono } from '@/components/ui';

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Mono size="sm" tone="mute">
        sign in
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
      <Field label="Password">
        {({ id }) => (
          <Input
            id={id}
            type="password"
            autoComplete="current-password"
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
      <Button type="submit" disabled={pending} className="mt-2">
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
      <div className="flex items-center justify-between text-[13px] text-ink-soft">
        <Link href="/signup" className="hover:text-ink">
          Create account
        </Link>
        <Link href="/reset" className="hover:text-ink">
          Forgot password
        </Link>
      </div>
    </form>
  );
}
