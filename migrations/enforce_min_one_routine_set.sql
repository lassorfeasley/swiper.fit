-- Prevent deleting the last routine_set for a routine_exercise
create or replace function public.prevent_zero_routine_sets()
returns trigger
language plpgsql
as $$
declare
  remaining integer;
begin
  -- Count remaining sets for this routine_exercise (excluding the row being deleted)
  select count(*) into remaining
  from routine_sets
  where routine_exercise_id = old.routine_exercise_id
    and id <> old.id;

  if remaining = 0 then
    raise exception 'Cannot delete the last set for this routine exercise. Delete the exercise instead.'
      using errcode = 'P0001';
  end if;

  return old;
end;
$$;

drop trigger if exists trg_prevent_zero_routine_sets on public.routine_sets;

create trigger trg_prevent_zero_routine_sets
before delete on public.routine_sets
for each row
execute function public.prevent_zero_routine_sets();


