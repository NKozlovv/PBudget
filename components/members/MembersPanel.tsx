'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Modal } from '@/components/ui';
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

type Tone = 'ok' | 'info' | 'err';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-teal/[0.18] text-in',
  info: 'bg-indigo/[0.14] text-indigo-dark',
  err: 'bg-coral/[0.18] text-out',
};

function dateSent(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Members screen — Theus Members design handoff. One glass hero card:
 * title + invite box (owner) or a read-only notice (member), then a
 * two-column "has access" / "waiting to sign up" layout.
 *
 * No display name/email is stored for anyone but the signed-in viewer —
 * only a user_id — so another member's row can't show a real name. Shown
 * honestly instead: "Member" + a fragment of their id, matching what the
 * data actually supports (see docs/rehaul-progress.md's Members entry for
 * the small backend change — storing the invited email on acceptance —
 * that would let this show a real name later).
 */
export function MembersPanel({
  budgetId,
  budgetName,
  members,
  invites,
  ownerId,
  currentUserId,
  currentUserEmail,
  isOwner,
}: {
  budgetId: string;
  budgetName: string;
  members: BudgetMember[];
  invites: BudgetInvite[];
  ownerId: string | null;
  currentUserId: string;
  currentUserEmail: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>({ kind: 'idle' });
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; tone: Tone } | null>(null);

  async function handleInvite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setPending(true);
    const sent = email;
    const res = await inviteMemberAction({ budget_id: budgetId, email });
    setPending(false);
    if (res.ok) {
      setEmail('');
      setFeedback({
        msg: `Invited ${sent}. They get access as soon as they sign up with that address.`,
        tone: 'ok',
      });
      router.refresh();
    } else {
      setFeedback({ msg: res.error, tone: res.error.toLowerCase().includes('already') ? 'info' : 'err' });
    }
  }

  const youInitials = (currentUserEmail.split('@')[0] ?? 'you').slice(0, 2).toUpperCase();

  return (
    <section className="glass flex flex-col gap-5 !rounded-[34px] p-[24px] px-[26px]">
      <div className="min-w-0 flex-1 basis-[280px]">
        <h1 className="text-[26px] font-extrabold -tracking-[0.03em] text-ink">Members</h1>
        <p className="mt-[7px] max-w-[64ch] text-[14px] font-medium text-ink-soft">
          Everyone here sees the whole budget — every account, every transaction. There are two
          roles and no levels in between.
        </p>
      </div>

      {isOwner ? (
        <div className="glass-inner flex flex-col gap-[11px] !rounded-[22px] p-4 px-[18px]">
          <div>
            <div className="text-[16px] font-extrabold -tracking-[0.02em] text-ink">Invite someone</div>
            <p className="mt-1.5 max-w-[70ch] text-[13.5px] font-medium text-ink-soft">
              They get access the moment they sign up with this exact address. There is nothing
              for them to accept, so the address has to be right.
            </p>
          </div>
          <form onSubmit={handleInvite} className="flex flex-wrap gap-[9px]">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.com"
              className="min-w-[260px] flex-1 rounded-[15px] border border-white/90 bg-white/80 px-4 py-3 text-[15px] font-semibold text-ink outline-none transition-shadow duration-150 focus:border-indigo focus:[box-shadow:0_0_0_3px_rgba(74,92,224,.18)]"
            />
            <Button type="submit" disabled={pending}>
              {pending ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
          {feedback ? (
            <div className={`rounded-[15px] px-[14px] py-[11px] text-[13px] font-bold leading-relaxed ${TONE_CLASS[feedback.tone]}`}>
              {feedback.msg}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex items-start gap-[11px] rounded-[20px] border border-white/60 bg-indigo/[0.12] p-4 px-[18px] text-[13.5px] font-semibold leading-relaxed text-indigo-dark">
          <span className="shrink-0 whitespace-nowrap rounded-full bg-indigo/20 px-[9px] py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]">
            Read only
          </span>
          <span>You are a member of {budgetName}. Only the owner can invite or remove people.</span>
        </div>
      )}

      <div className="grid items-start gap-[14px]" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <div className="flex flex-col gap-[11px]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-extrabold -tracking-[0.02em] text-ink">Has access</h2>
            <span className="text-[12.5px] font-semibold text-ink-mute">
              {members.length} {members.length === 1 ? 'person' : 'people'}
            </span>
          </div>
          {members.length === 0 ? (
            <p className="text-[13px] text-ink-mute">No members yet.</p>
          ) : (
            members.map((m) => {
              const isYou = m.user_id === currentUserId;
              const isOwnerRow = m.user_id === ownerId;
              return (
                <div
                  key={m.user_id}
                  className="flex flex-wrap items-center gap-[13px] rounded-[20px] border border-white/50 bg-white/[0.5] p-[15px] px-[17px] transition-transform duration-200 ease-theus hover:-translate-y-0.5"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                    style={
                      isYou
                        ? { background: 'linear-gradient(135deg,#4a5ce0,#1fb9a4)', color: '#fff' }
                        : { background: 'rgba(31,39,66,.06)', color: '#5b6278', border: '1px dashed rgba(31,39,66,.22)' }
                    }
                  >
                    {isYou ? youInitials : m.user_id.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1 basis-[140px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[15px] font-extrabold -tracking-[0.015em] text-ink">
                        {isYou ? 'You' : `Member · ${m.user_id.slice(0, 8)}`}
                      </span>
                      <span
                        className={`whitespace-nowrap rounded-full px-[9px] py-[2px] text-[10.5px] font-bold uppercase tracking-[0.06em] ${
                          isOwnerRow ? 'bg-indigo/[0.16] text-indigo-dark' : 'bg-[rgba(31,39,66,.07)] text-ink-soft'
                        }`}
                      >
                        {isOwnerRow ? 'owner' : m.role}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[12px] font-semibold text-ink-mute">
                      {isYou ? currentUserEmail : `${m.user_id.slice(0, 19)}…`}
                    </div>
                  </div>
                  {isOwner && !isOwnerRow ? (
                    <button
                      type="button"
                      onClick={() => setMode({ kind: 'revoke', member: m })}
                      className="shrink-0 rounded-full border border-out/45 bg-white/50 px-[15px] py-[9px] text-[13px] font-semibold text-out transition-colors duration-200 hover:bg-coral/[0.14]"
                    >
                      Revoke
                    </button>
                  ) : isYou && isOwner ? (
                    <span className="shrink-0 text-[12px] font-semibold text-ink-mute">Cannot be removed</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        <div className="flex flex-col gap-[11px]">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-extrabold -tracking-[0.02em] text-ink">Waiting to sign up</h2>
            <span className="text-[12.5px] font-semibold text-ink-mute">
              {invites.length} pending
            </span>
          </div>
          {invites.length === 0 ? (
            <p className="text-[13px] text-ink-mute">No pending invites.</p>
          ) : (
            <>
              {invites.map((i) => (
                <div
                  key={i.id}
                  className="flex flex-wrap items-center gap-[13px] rounded-[20px] border border-dashed border-[rgba(31,39,66,.18)] bg-white/[0.42] p-[15px] px-[17px] transition-transform duration-200 ease-theus hover:-translate-y-0.5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(31,39,66,.06)] text-ink-mute">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3 7 9 6 9-6" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1 basis-[150px]">
                    <div className="truncate text-[14.5px] font-bold -tracking-[0.01em] text-ink">{i.email}</div>
                    <div className="mt-1 text-[12px] font-semibold text-ink-mute">Invited {dateSent(i.created_at)}</div>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setMode({ kind: 'cancel', invite: i })}
                      className="shrink-0 rounded-full border border-white/90 bg-white/[0.66] px-[15px] py-[9px] text-[13px] font-semibold text-ink transition-colors duration-200 hover:bg-white"
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              ))}
              <div className="rounded-[18px] border border-white/50 bg-white/40 p-[14px] px-4 text-[12.5px] font-semibold leading-relaxed text-ink-soft">
                A pending invite is just an email on a list. Nothing is sent again, and nothing
                expires.
              </div>
            </>
          )}
        </div>
      </div>

      {mode.kind === 'revoke' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Revoke access?"
          description="They lose access to every account and transaction in this budget immediately. Anything they entered stays."
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
              Keep access
            </Button>
            <Button
              onClick={async () => {
                const res = await revokeMemberAction({
                  budget_id: budgetId,
                  user_id: mode.member.user_id,
                });
                setMode({ kind: 'idle' });
                if (res.ok) router.refresh();
                else setFeedback({ msg: res.error, tone: 'err' });
              }}
            >
              Revoke access
            </Button>
          </div>
        </Modal>
      ) : null}

      {mode.kind === 'cancel' ? (
        <Modal
          open
          onOpenChange={(o) => !o && setMode({ kind: 'idle' })}
          title="Cancel this invite?"
          description={`${mode.invite.email} will not get access when they sign up. You can invite them again any time.`}
        >
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setMode({ kind: 'idle' })}>
              Keep it
            </Button>
            <Button
              onClick={async () => {
                const res = await cancelInviteAction(mode.invite.id);
                setMode({ kind: 'idle' });
                if (res.ok) router.refresh();
                else setFeedback({ msg: res.error, tone: 'err' });
              }}
            >
              Cancel invite
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
