'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button, Field, Icon, Input } from '@/components/ui';
import { AuthHeader } from './AuthHeader';
import { SocialButtons } from './SocialButtons';

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
    <form onSubmit={onSubmit} noValidate>
      <AuthHeader
        kicker="welcome back"
        title="Sign in"
        subtitle="Pick up where you left off."
      />

      <SocialButtons />

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

        <div className="flex justify-end -mt-1">
          <Link
            href="/reset"
            className="text-[12px] text-accent hover:underline underline-offset-4"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-5 text-[13px] text-neg" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        className="mt-7 w-full py-3.5 inline-flex items-center justify-center gap-2"
      >
        {pending ? (
          'Signing in…'
        ) : (
          <>
            Sign in <Icon name="arrow-right" size={15} />
          </>
        )}
      </Button>

      <p className="mt-6 text-center text-[13px] text-ink-mute">
        New here?{' '}
        <Link href="/signup" className="text-accent font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
