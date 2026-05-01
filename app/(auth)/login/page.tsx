import { Suspense } from 'react';
import { Card } from '@/components/ui';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata = { title: 'Sign in · Theus' };

export default function LoginPage() {
  return (
    <Card className="p-7">
      <Suspense fallback={null}>
        <SignInForm />
      </Suspense>
    </Card>
  );
}
