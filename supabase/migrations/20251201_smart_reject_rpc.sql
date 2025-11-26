-- RPC to reject an invitation by ID, checking both account_shares (legacy) and invitations (token) tables.
-- This unifies the rejection logic and makes it robust against missing tokens in the frontend.

create or replace function public.reject_invitation_by_id(target_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  token_val uuid;
  legacy_found integer;
begin
  -- 1. Try to reject legacy share (account_shares table)
  -- We only update if it's currently active or pending
  update public.account_shares
  set status = 'declined',
      revoked_at = now()
  where id = target_id
    and (status = 'pending' or status = 'active');

  get diagnostics legacy_found = row_count;

  if legacy_found > 0 then
    return true;
  end if;

  -- 2. Try to find and reject token invitation (invitations table)
  -- We select the token first just to verify existence, but we update by ID
  update public.invitations
  set status = 'declined'
  where id = target_id
    and status = 'pending';

  if found then
    return true;
  end if;

  return false;
end;
$$;

