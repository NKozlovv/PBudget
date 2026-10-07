import { SignUpForm } from '@/components/auth/SignUpForm';
import { isUuid } from '@/lib/safeNext';

export const metadata = { title: 'Create account · Theus' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string; email?: string }>;
}) {
  const { invite, email } = await searchParams;
  return <SignUpForm inviteToken={isUuid(invite) ? invite : undefined} prefillEmail={email} />;
}
