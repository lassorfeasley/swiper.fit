-- Add routine_name column to workouts table
-- This column stores the name of the routine that was used to create the workout

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS routine_name TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN workouts.routine_name IS 'The name of the routine that was used to create this workout';

-- Create an index for efficient lookups by routine name
CREATE INDEX IF NOT EXISTS idx_workouts_routine_name ON workouts(routine_name);
