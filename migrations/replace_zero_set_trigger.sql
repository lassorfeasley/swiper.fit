-- Replace the "prevent zero sets" trigger with an automatic parent delete
-- When the last routine_set for a routine_exercise is deleted, delete the parent row

-- Drop the old trigger and function if they exist
drop trigger if exists trg_prevent_zero_routine_sets on public.routine_sets;
drop function if exists public.prevent_zero_routine_sets();

-- Create a new AFTER DELETE trigger that deletes the parent when no sets remain
create or replace function public.delete_routine_exercise_if_no_sets()
returns trigger
language plpgsql
as $$
declare
  remaining integer;
begin
  select count(*) into remaining
  from routine_sets
  where routine_exercise_id = old.routine_exercise_id;

  if remaining = 0 then
    delete from routine_exercises where id = old.routine_exercise_id;
  end if;

  return old;
end;
$$;

drop trigger if exists trg_delete_routine_exercise_when_last_set on public.routine_sets;

create trigger trg_delete_routine_exercise_when_last_set
after delete on public.routine_sets
for each row
execute function public.delete_routine_exercise_if_no_sets();


