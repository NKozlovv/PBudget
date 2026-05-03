'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardHeader, Field, Input, Modal, Mono, Pill } from '@/components/ui';
import {
  cancelInviteAction,
  inviteMemberAction,
  revokeMemberAction,
} from '@/app/actions/members';
import type { BudgetInvite, BudgetMember } from '@/lib/supabase/types';

type Mode =
  | { kind: 'idle' }
  | { kind: 'revoke'; member: BudgetMember }
  | { kind: 'cancel'; invite: BudgetInvite };

export function MembersPanel({
  budgetId,
  budgetName,
  members,
  invites,
  ownerId,
  currentUserId,
  isOwner,
}: {
  budgetId: string;
  budgetName: string;
  members: BudgetMember[];
  invites: BudgetInvite[];
  ownerId: string | null;
  currentUserId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);
    const res = await inviteMemberAction({ budget_id: budgetId, email });
    setPending(false);
    if (res.ok) {
      setEmail('');
      setInfo(`Invitation sent. They'll see ${budgetName} after they sign up at /signup with that email.`);
      router.refresh();
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {isOwner ? (
        <Card>
          <CardHeader title="Invite by email" subtitle={<Mono size="xs">owner only</Mono>} />
          <form onSubmit={handleInvite} className="mt-5 flex flex-col gap-4">
            <div className="flex items-end gap-3">
              <Field label="Email" className="flex-1">
                {({ id }) => (
                  <Input
                    id={id}
                    type="email"
                    placeholder="partner@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                )}
              </Field>
              <Button type="submit" disabled={pending}>
                {pending ? 'Sending…' : 'Invite'}
              </Button>
            </div>
            {error ? (
              <p className="text-[13px] text-neg" role="alert">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="text-[13px] text-pos" role="status">
                {info}
              </p>
            ) : null}
            <p className="text-[12px] text-ink-mute">
              Invitations are auto-accepted when the invited email signs up. Existing accounts
              would need to sign out and sign up with that email — there&apos;s no separate
              accept-invite UI yet.
            </p>
          </form>
        </Card>
      ) : null}

      <Card padded={false}>
        <div className="flex items-baseline justify-between border-b border-rule px-5 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight">Members</h3>
          <Mono size="xs">
            {members.length} active
          </Mono>
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-mute">No members yet.</p>
        ) : (
          <ul className="divide-y divide-rule/60">
            {members.map((m) => {
              const isYou = m.user_id === currentUserId;
              const isOwnerRow = m.user_id === ownerId;
              return (
                <li key={m.user_id} className="flex items-center gap-4 px-5 py-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-bg"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--accent), color-mix(in oklab, var(--accent) 70%, var(--ink)))',
                    }}
                    aria-hidden
                  >
                    {(isYou ? 'Y' : '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[13px] text-ink">
                      <span>{isYou ? 'You' : 'Member'}</span>
                      {isOwnerRow ? <Pill variant="accent">owner</Pill> : null}
                      {!isOwnerRow ? <Pill variant="outline">{m.role}</Pill> : null}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.06em] text-ink-mute font-medium">
                      id: {m.user_id.slice(0, 8)}…{m.user_id.slice(-4)}
                    </div>
                  </div>
                  {isOwner && !isOwnerRow ? (
                    <button
                      type="button"
                      onClick={() => setMode({ kind: 'revoke', member: m })}
                      className="text-[12px] text-ink-soft hover:text-neg hover:underline"
                    >
                      Revoke
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card padded={false}>
        <div className="flex items-baseline justify-between border-b border-rule px-5 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight">Pending invites</h3>
          <Mono size="xs">{invites.length}</Mono>
        </div>
        {invites.length === 0 ? (
          <p className="px-5 py-6 text-sm text-ink-mute">No pending invites.</p>
        ) : (
          <ul className="divide-y divide-rule/60">
            {invites.map((i) => {
              const sentAt = new Date(i.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              return (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] text-ink">{i.email}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.06em] text-ink-mute font-medium">
                      sent {sentAt}
                    </div>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setMode({ kind: 'cancel', invite: i })}
                      className="text-[12px] text-ink-soft hover:text-neg hover:underline"
                    >
                      Cancel
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {mode.kind === 'revoke' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Revoke access?"
          description="This member will lose access to the budget immediately."
        >
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-rule bg-bg p-3 text-[13px]">
              <Mono size="xs" className="block">
                user
              </Mono>
              <div className="mt-1 text-ink-soft">{mode.member.user_id}</div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const res = await revokeMemberAction({
                    budget_id: budgetId,
                    user_id: mode.member.user_id,
                  });
                  if (res.ok) {
                    setMode({ kind: 'idle' });
                    router.refresh();
                  } else {
                    setError(res.error);
                    setMode({ kind: 'idle' });
                  }
                }}
              >
                Revoke
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {mode.kind === 'cancel' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title={`Cancel invite to ${mode.invite.email}?`}
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
              Keep invite
            </Button>
            <Button
              onClick={async () => {
                const res = await cancelInviteAction(mode.invite.id);
                if (res.ok) {
                  setMode({ kind: 'idle' });
                  router.refresh();
                } else {
                  setError(res.error);
                  setMode({ kind: 'idle' });
                }
              }}
            >
              Cancel invite
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
