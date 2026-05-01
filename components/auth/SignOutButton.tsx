'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
