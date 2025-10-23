-- Add is_paused column to workouts table
-- This column tracks whether a workout is currently paused

ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

-- Update existing workouts to have is_paused = false
UPDATE workouts 
SET is_paused = FALSE 
WHERE is_paused IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN workouts.is_paused IS 'Indicates whether the workout is currently paused';
