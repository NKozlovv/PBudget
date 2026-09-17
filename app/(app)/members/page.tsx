import { PageHeader } from '@/components/nav/PageHeader';
import { getAuthUser } from '@/lib/supabase/server';
import { getOrCreateUserBudget } from '@/lib/data/budgets';
import {
  getBudgetOwnerId,
  listBudgetInvites,
  listBudgetMembers,
} from '@/lib/data/members';
import { MembersPanel } from '@/components/members/MembersPanel';

export const metadata = { title: 'Members · Theus' };

export default async function MembersPage() {
  const [user, budget] = await Promise.all([getAuthUser(), getOrCreateUserBudget()]);
  if (!user) throw new Error('Not authenticated');

  const [members, invites, ownerId] = await Promise.all([
    listBudgetMembers(budget.id),
    listBudgetInvites(budget.id),
    getBudgetOwnerId(budget.id),
  ]);

  const isOwner = ownerId === user.id;

  return (
    <>
      <PageHeader
        title="Members"
        meta={`${budget.name} · ${members.length} ${
          members.length === 1 ? 'member' : 'members'
        }${invites.length > 0 ? ` · ${invites.length} pending` : ''}`}
      />

      <div className="mt-10">
        <MembersPanel
          budgetId={budget.id}
          budgetName={budget.name}
          members={members}
          invites={invites}
          ownerId={ownerId}
          currentUserId={user.id}
          isOwner={isOwner}
        />
      </div>
    </>
  );
}
