-- Add routine OG image metadata and regeneration rules

-- Columns to track OG image state
alter table public.routines
  add column if not exists og_image_generated_at timestamptz,
  add column if not exists og_image_version int,
  add column if not exists og_image_dirty boolean not null default false;

-- Helper: mark a single routine as dirty
create or replace function public.mark_routine_og_dirty(routine_uuid uuid)
returns void
language plpgsql
as $$
begin
  update public.routines
  set og_image_dirty = true
  where id = routine_uuid;
end;
$$;

-- Trigger: when a routine itself is created or key fields change
create or replace function public.mark_routine_og_dirty_on_routines()
returns trigger
language plpgsql
as $$
begin
  perform public.mark_routine_og_dirty(coalesce(NEW.id, OLD.id));
  return null;
end;
$$;

-- Trigger: when routine_exercises are added/removed
create or replace function public.mark_routine_og_dirty_on_routine_exercises()
returns trigger
language plpgsql
as $$
declare r_id uuid;
begin
  r_id := coalesce(NEW.routine_id, OLD.routine_id);
  if r_id is not null then
    perform public.mark_routine_og_dirty(r_id);
  end if;
  return null;
end;
$$;

-- Trigger: when routine_sets are added/removed
create or replace function public.mark_routine_og_dirty_on_routine_sets()
returns trigger
language plpgsql
as $$
declare r_id uuid;
begin
  select re.routine_id into r_id
  from public.routine_exercises re
  where re.id = coalesce(NEW.routine_exercise_id, OLD.routine_exercise_id)
  limit 1;
  if r_id is not null then
    perform public.mark_routine_og_dirty(r_id);
  end if;
  return null;
end;
$$;

-- Trigger: when user display name changes (affects all their routines)
create or replace function public.mark_routine_og_dirty_on_profiles()
returns trigger
language plpgsql
as $$
begin
  update public.routines
  set og_image_dirty = true
  where user_id = coalesce(NEW.id, OLD.id);
  return null;
end;
$$;

-- Optional: helper to mark all routines dirty (useful on template changes)
create or replace function public.mark_all_routines_og_dirty()
returns void
language sql
as $$
  update public.routines set og_image_dirty = true;
$$;

-- Wire up triggers
drop trigger if exists trg_routines_og_dirty on public.routines;
create trigger trg_routines_og_dirty
after insert or update of routine_name, is_public on public.routines
for each row execute function public.mark_routine_og_dirty_on_routines();

drop trigger if exists trg_routine_exercises_og_dirty on public.routine_exercises;
create trigger trg_routine_exercises_og_dirty
after insert or delete on public.routine_exercises
for each row execute function public.mark_routine_og_dirty_on_routine_exercises();

drop trigger if exists trg_routine_sets_og_dirty on public.routine_sets;
create trigger trg_routine_sets_og_dirty
after insert or delete on public.routine_sets
for each row execute function public.mark_routine_og_dirty_on_routine_sets();

drop trigger if exists trg_profiles_og_dirty on public.profiles;
create trigger trg_profiles_og_dirty
after update of first_name, last_name on public.profiles
for each row execute function public.mark_routine_og_dirty_on_profiles();



