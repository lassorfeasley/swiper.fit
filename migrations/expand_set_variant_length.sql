-- Expand set name column lengths to support 25-char UI limit
-- Safe change: widen to text (no data loss) and keep DB permissive

alter table if exists public.sets
  alter column set_variant type text;

alter table if exists public.routine_sets
  alter column set_variant type text;

-- Optional (disabled): enforce 25-char limit at DB layer
-- Uncomment after verifying existing data fits
-- alter table public.sets add constraint sets_set_variant_len check (char_length(set_variant) <= 25);
-- alter table public.routine_sets add constraint routine_sets_variant_len check (char_length(set_variant) <= 25);


