-- Corrects the accept_invitation RPC logic which inverted owner/delegate roles.
-- intended_role = 'manager' means the RECIPIENT is the manager (delegate).
-- intended_role = 'managed' means the RECIPIENT is the managed (owner).

create or replace function public.accept_invitation(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.invitations%rowtype;
  current_user_id uuid;
  owner_id uuid;
  delegate_id uuid;
  permissions jsonb := '{}'::jsonb;
  can_create boolean := false;
  can_start boolean := false;
  can_review boolean := false;
  request_label text;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'accept_invitation requires an authenticated user';
  end if;

  select *
    into invite_record
    from public.invitations
    where token = invite_token
      and status = 'pending'
      and expires_at > now()
    for update;

  if not found then
    raise exception 'Invitation not found, expired, or already handled';
  end if;

  if invite_record.inviter_id = current_user_id then
    raise exception 'You cannot accept an invitation you created';
  end if;

  permissions := coalesce(invite_record.permissions, '{}'::jsonb);
  can_create := coalesce((permissions ->> 'can_create_routines')::boolean, false);
  can_start  := coalesce((permissions ->> 'can_start_workouts')::boolean, false);
  can_review := coalesce((permissions ->> 'can_review_history')::boolean, false);

  if invite_record.intended_role = 'manager' then
    -- Recipient (current_user) is the Manager (Delegate)
    -- Inviter is the Managed (Owner)
    owner_id := invite_record.inviter_id;
    delegate_id := current_user_id;
    request_label := 'trainer_invite';
  else
    -- Recipient (current_user) is the Managed (Owner)
    -- Inviter is the Manager (Delegate)
    owner_id := current_user_id;
    delegate_id := invite_record.inviter_id;
    request_label := 'client_invite';
  end if;

  if exists (
    select 1
    from public.account_shares
    where owner_user_id = owner_id
      and delegate_user_id = delegate_id
      and status = 'active'
      and (revoked_at is null)
  ) then
    raise exception 'An active sharing relationship already exists';
  end if;

  insert into public.account_shares (
    owner_user_id,
    delegate_user_id,
    delegate_email,
    status,
    request_type,
    can_create_routines,
    can_start_workouts,
    can_review_history
  )
  values (
    owner_id,
    delegate_id,
    lower(invite_record.recipient_email),
    'active',
    request_label,
    can_create,
    can_start,
    can_review
  );

  update public.invitations
    set status = 'accepted'
    where id = invite_record.id;
end;
$$;

