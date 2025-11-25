-- Cleanup script: removes legacy pending account_shares invitations.
-- Run manually via Supabase SQL editor or psql when ready.
-- This will delete all rows where request_type indicates the legacy invite
-- flow and the status is still pending.

begin;

delete from public.account_shares
where status = 'pending'
  and request_type in ('trainer_invite', 'client_invite');

commit;

