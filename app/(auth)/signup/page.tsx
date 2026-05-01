import { Card } from '@/components/ui';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata = { title: 'Create account · Theus' };

export default function SignupPage() {
  return (
    <Card className="p-7">
      <SignUpForm />
    </Card>
  );
}
