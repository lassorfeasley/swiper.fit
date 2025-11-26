-- Delete all pending legacy invitations from account_shares
-- This removes old, legacy invitations while preserving active connections.
-- Future invites will use the new token-based system (stored in 'invitations' table).

begin;

delete from public.account_shares
where status = 'pending';

commit;

