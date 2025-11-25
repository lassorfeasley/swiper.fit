-- ============================================================================
-- Migration: Disable legacy pending account_share inserts
-- Prevents new rows on account_shares with request_type trainer/client invite
-- from being inserted with status 'pending'. All new invitations must be
-- stored in the invitations table instead.
-- ============================================================================

begin;

create or replace function public.prevent_legacy_pending_invites()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    new.request_type in ('trainer_invite', 'client_invite')
    and new.status = 'pending'
  ) then
    raise exception 'Legacy pending invitation inserts are disabled. Use invitations table instead.';
  end if;
  return new;
end;
$$;

drop trigger if exists account_shares_block_legacy_pending on public.account_shares;

create trigger account_shares_block_legacy_pending
before insert or update on public.account_shares
for each row
when (new.request_type in ('trainer_invite', 'client_invite') and new.status = 'pending')
execute function public.prevent_legacy_pending_invites();

commit;

