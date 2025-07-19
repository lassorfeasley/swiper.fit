-- Add section_override column to workout_exercises table
-- This allows users to override the section of an exercise for a specific workout

ALTER TABLE workout_exercises 
ADD COLUMN section_override TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN workout_exercises.section_override IS 'Override the section (warmup/training/cooldown) for this exercise in this specific workout'; 