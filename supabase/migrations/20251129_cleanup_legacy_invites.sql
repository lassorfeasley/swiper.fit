-- ============================================================================
-- Cleanup legacy pending account_shares rows on invite accept/decline
-- ============================================================================

begin;

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
    owner_id := current_user_id;
    delegate_id := invite_record.inviter_id;
    request_label := 'trainer_invite';
  else
    owner_id := invite_record.inviter_id;
    delegate_id := current_user_id;
    request_label := 'client_invite';
  end if;

  if owner_id = delegate_id then
    raise exception 'You cannot connect your own account to itself';
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

  delete from public.account_shares
  where status = 'pending'
    and request_type in ('trainer_invite', 'client_invite')
    and (
      (owner_user_id = owner_id and delegate_user_id = delegate_id)
      or (lower(delegate_email) = lower(invite_record.recipient_email))
    );

  update public.invitations
    set status = 'accepted'
    where id = invite_record.id;
end;
$$;

create or replace function public.decline_invitation(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.invitations%rowtype;
  owner_id uuid;
  delegate_id uuid;
begin
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

  if invite_record.intended_role = 'manager' then
    owner_id := invite_record.recipient_user_id;
    delegate_id := invite_record.inviter_id;
  else
    owner_id := invite_record.inviter_id;
    delegate_id := invite_record.recipient_user_id;
  end if;

  update public.invitations
    set status = 'declined'
    where id = invite_record.id;

  delete from public.account_shares
  where status = 'pending'
    and request_type in ('trainer_invite', 'client_invite')
    and (
      (owner_id is not null and delegate_id is not null and owner_user_id = owner_id and delegate_user_id = delegate_id)
      or (lower(delegate_email) = lower(invite_record.recipient_email))
    );
end;
$$;

commit;

