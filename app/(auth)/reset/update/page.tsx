import { redirect } from 'next/navigation';
import { NewPasswordForm } from '@/components/auth/NewPasswordForm';
import { getAuthUser } from '@/lib/supabase/server';

export const metadata = { title: 'New password · Theus' };

export default async function ResetUpdatePage() {
  // Only reachable through the emailed link (which signs you in via /auth/callback).
  const user = await getAuthUser();
  if (!user) redirect('/login?error=link');
  return <NewPasswordForm />;
}
