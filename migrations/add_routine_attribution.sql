-- Add routine attribution columns to track creator and sharing lineage

-- Add created_by column (references the original creator)
ALTER TABLE public.routines 
  ADD COLUMN created_by UUID REFERENCES public.profiles(id);

-- Add shared_by column (references the person who shared it)
ALTER TABLE public.routines 
  ADD COLUMN shared_by UUID REFERENCES public.profiles(id);

-- Backfill existing routines: set both created_by and shared_by to current user_id
-- Only update routines where the user_id exists in profiles table
UPDATE public.routines 
  SET created_by = user_id, shared_by = user_id 
  WHERE (created_by IS NULL OR shared_by IS NULL)
  AND user_id IN (SELECT id FROM public.profiles);

-- Add indexes for performance
CREATE INDEX idx_routines_created_by ON public.routines(created_by);
CREATE INDEX idx_routines_shared_by ON public.routines(shared_by);

-- Add comments to document the columns
COMMENT ON COLUMN public.routines.created_by IS 'Permanent attribution to the original creator of the routine';
COMMENT ON COLUMN public.routines.shared_by IS 'Tracks who shared this routine instance (changes on each share)';
