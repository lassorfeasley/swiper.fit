-- Verification script to ensure invitation data is healthy after cleanup.
-- 1. Shows any remaining legacy pending account_shares rows
-- 2. Shows duplicates between account_shares and invitations
-- 3. Counts invitations still pending per user

-- Pending legacy rows (should be zero)
select id, owner_user_id, delegate_user_id, request_type, status, created_at
from public.account_shares
where status = 'pending'
  and request_type in ('trainer_invite', 'client_invite');

-- Duplicates between legacy rows and new invitations (by owner/delegate/email)
select
  legacy.id as legacy_id,
  legacy.owner_user_id,
  legacy.delegate_user_id,
  legacy.delegate_email,
  inv.id as invitation_id,
  inv.intended_role,
  inv.status as invitation_status
from public.account_shares legacy
join public.invitations inv
  on inv.recipient_email = legacy.delegate_email
  and (
    (inv.intended_role = 'manager' and legacy.request_type = 'trainer_invite')
    or (inv.intended_role = 'managed' and legacy.request_type = 'client_invite')
  )
where legacy.status = 'pending';

-- Pending invitations grouped by inviter for capacity planning
select inviter_id, intended_role, count(*) as pending_invites
from public.invitations
where status = 'pending'
group by inviter_id, intended_role
order by pending_invites desc;

