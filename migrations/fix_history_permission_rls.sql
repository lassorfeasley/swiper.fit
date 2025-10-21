-- Fix RLS policies to enforce can_review_history permission
-- This migration updates the overly permissive RLS policies to check specific permissions

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view their own workouts or delegated workouts" ON workouts;
DROP POLICY IF EXISTS "Users can view their own sets or delegated sets" ON sets;
DROP POLICY IF EXISTS "Users can view their own workout exercises or delegated workout exercises" ON workout_exercises;

-- Create new permission-aware policies for workouts
CREATE POLICY "Users can view their own workouts or delegated workouts with review permission" ON workouts
FOR SELECT USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
    AND can_review_history = true
  )
);

-- Create new permission-aware policies for sets
CREATE POLICY "Users can view their own sets or delegated sets with review permission" ON sets
FOR SELECT USING (
  workout_id IN (
    SELECT id FROM workouts WHERE (
      user_id = auth.uid() OR
      user_id IN (
        SELECT owner_user_id 
        FROM account_shares 
        WHERE delegate_user_id = auth.uid() 
        AND revoked_at IS NULL
        AND can_review_history = true
      )
    )
  )
);

-- Create new permission-aware policies for workout_exercises
CREATE POLICY "Users can view their own workout exercises or delegated workout exercises with review permission" ON workout_exercises
FOR SELECT USING (
  workout_id IN (
    SELECT id FROM workouts WHERE (
      user_id = auth.uid() OR
      user_id IN (
        SELECT owner_user_id 
        FROM account_shares 
        WHERE delegate_user_id = auth.uid() 
        AND revoked_at IS NULL
        AND can_review_history = true
      )
    )
  )
);

-- Note: INSERT, UPDATE, DELETE policies remain unchanged as they use different permission checks
-- (can_start_workouts, can_create_routines, etc.)
