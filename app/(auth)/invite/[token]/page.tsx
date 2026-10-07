import Link from 'next/link';
import { AuthHeader } from '@/components/auth/AuthHeader';
import { AuthBanner } from '@/components/auth/AuthBanner';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { AcceptInvite } from '@/components/invite/AcceptInvite';
import { createClient, getAuthUser } from '@/lib/supabase/server';
import { isUuid } from '@/lib/safeNext';

export const metadata = { title: 'Join a budget · Theus' };

const primary =
  'flex w-full items-center justify-center rounded-full bg-[linear-gradient(180deg,#5a6be8,#4152d6)] py-[14px] text-[15px] font-bold text-white shadow-[0_8px_20px_rgba(74,92,224,.34),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 ease-theus hover:-translate-y-0.5';
const secondary =
  'flex w-full items-center justify-center rounded-full border border-white/90 bg-white/70 py-[14px] text-[15px] font-bold text-ink transition-colors duration-200 hover:bg-white';

type Preview = { budget_name: string; email: string; expired: boolean };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let preview: Preview | null = null;
  if (isUuid(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('get_invite_preview', { p_token: token });
    preview = ((Array.isArray(data) ? data[0] : data) as Preview | null) ?? null;
  }

  if (!preview) {
    return (
      <div>
        <AuthHeader title="Invite not valid" subtitle="This link was already used, cancelled, or is incomplete." />
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className={primary}>
            Go to Theus
          </Link>
        </div>
      </div>
    );
  }

  if (preview.expired) {
    return (
      <div>
        <AuthHeader title="Invite expired" subtitle="Ask whoever invited you to send a new one." />
        <Link href="/login" className={secondary}>
          Sign in
        </Link>
      </div>
    );
  }

  const user = await getAuthUser();
  const q = `invite=${encodeURIComponent(token)}&email=${encodeURIComponent(preview.email)}`;

  if (!user) {
    return (
      <div>
        <AuthHeader title={`Join “${preview.budget_name}”`} subtitle="You’ve been invited to share this budget on Theus." />
        <AuthBanner tone="info">
          Invitation for <strong>{preview.email}</strong>. Use this exact address to sign up or sign in.
        </AuthBanner>
        <div className="flex flex-col gap-3">
          <Link href={`/signup?${q}`} className={primary}>
            Create account
          </Link>
          <Link href={`/login?next=${encodeURIComponent('/invite/' + token)}&email=${encodeURIComponent(preview.email)}`} className={secondary}>
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  if ((user.email ?? '').toLowerCase() !== preview.email.toLowerCase()) {
    return (
      <div>
        <AuthHeader title="Wrong account" subtitle={`This invite is for ${preview.email}.`} />
        <AuthBanner tone="err">
          You’re signed in as {user.email}. Sign out, then open the invite link again with the invited address.
        </AuthBanner>
        <SignOutButton />
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title={`Join “${preview.budget_name}”`} subtitle="Accept to see this budget’s accounts and transactions." />
      <AcceptInvite token={token} />
    </div>
  );
}
