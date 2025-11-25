-- Final cleanup of legacy pending account_shares invites.
-- Run after deploying 20251130_block_legacy_pending_invites.sql.

begin;

delete from public.account_shares
where request_type in ('trainer_invite', 'client_invite')
  and status = 'pending';

commit;

