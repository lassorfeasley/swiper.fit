-- ============================================================================
-- Invitation System Refactor Migration
-- Creates invitation enums/table and the accept_invitation RPC helper.
-- ============================================================================

begin;

-- --------------------------------------------------------------------------
-- Enum definitions
-- --------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_role') then
    create type public.invitation_role as enum ('manager', 'managed');
  end if;
end
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'invitation_status') then
    create type public.invitation_status as enum ('pending', 'accepted', 'declined');
  end if;
end
$$;

-- --------------------------------------------------------------------------
-- Invitations table
-- --------------------------------------------------------------------------
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token uuid not null default gen_random_uuid(),
  inviter_id uuid not null references auth.users (id) on delete cascade,
  recipient_email text not null,
  recipient_user_id uuid references auth.users (id) on delete set null,
  intended_role public.invitation_role not null,
  permissions jsonb not null default '{}'::jsonb,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now()
);

create unique index if not exists invitations_token_key on public.invitations(token);
create index if not exists invitations_inviter_idx on public.invitations(inviter_id);
create index if not exists invitations_status_idx on public.invitations(status, expires_at);
create index if not exists invitations_recipient_user_idx on public.invitations(recipient_user_id);
create index if not exists invitations_recipient_email_idx on public.invitations(lower(recipient_email));

-- --------------------------------------------------------------------------
-- accept_invitation RPC
-- --------------------------------------------------------------------------
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
    -- Inviter will manage the accepter's account
    owner_id := current_user_id;
    delegate_id := invite_record.inviter_id;
    request_label := 'trainer_invite';
  else
    -- Inviter wants to be managed by accepter
    owner_id := invite_record.inviter_id;
    delegate_id := current_user_id;
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

create or replace function public.decline_invitation(invite_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  updated_count := (
    select count(*)
    from public.invitations
    where token = invite_token
      and status = 'pending'
      and expires_at > now()
  );

  if updated_count = 0 then
    raise exception 'Invitation not found, expired, or already handled';
  end if;

  update public.invitations
    set status = 'declined'
    where token = invite_token;
end;
$$;

commit;

