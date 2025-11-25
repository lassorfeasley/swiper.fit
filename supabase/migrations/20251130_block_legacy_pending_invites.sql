-- ============================================================================
-- Enforce: no account_shares pending trainer/client invites
-- ============================================================================

begin;

drop trigger if exists account_shares_block_pending_invites on public.account_shares;
drop function if exists public.prevent_pending_invites cascade;

create or replace function public.prevent_pending_invites()
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
    raise exception 'Pending trainer/client invites must be stored in invitations table';
  end if;
  return new;
end;
$$;

create trigger account_shares_block_pending_invites
before insert or update on public.account_shares
for each row
when (new.request_type in ('trainer_invite', 'client_invite'))
execute function public.prevent_pending_invites();

commit;

