-- Fix RLS policies to explicitly allow account_id field updates
-- This ensures users can set account_id on their own sets

-- Drop the existing UPDATE policy for sets
DROP POLICY IF EXISTS "Users can update sets from their own workouts or delegated workouts" ON sets;

-- Create a new UPDATE policy that explicitly allows account_id updates
CREATE POLICY "Users can update sets from their own workouts or delegated workouts" ON sets
FOR UPDATE USING (
  workout_id IN (
    SELECT id FROM workouts WHERE 
      user_id = auth.uid() OR
      user_id IN (
        SELECT owner_user_id 
        FROM account_shares 
        WHERE delegate_user_id = auth.uid() 
        AND revoked_at IS NULL
      )
  )
) WITH CHECK (
  -- Allow all fields to be updated, including account_id
  workout_id IN (
    SELECT id FROM workouts WHERE 
      user_id = auth.uid() OR
      user_id IN (
        SELECT owner_user_id 
        FROM account_shares 
        WHERE delegate_user_id = auth.uid() 
        AND revoked_at IS NULL
      )
  )
);

-- Also ensure the INSERT policy allows account_id
DROP POLICY IF EXISTS "Users can insert sets into their own workouts or delegated workouts" ON sets;

CREATE POLICY "Users can insert sets into their own workouts or delegated workouts" ON sets
FOR INSERT WITH CHECK (
  workout_id IN (
    SELECT id FROM workouts WHERE 
      user_id = auth.uid() OR
      user_id IN (
        SELECT owner_user_id 
        FROM account_shares 
        WHERE delegate_user_id = auth.uid() 
        AND revoked_at IS NULL
      )
  )
);

-- Add a comment to document the purpose
COMMENT ON POLICY "Users can update sets from their own workouts or delegated workouts" ON sets IS 'Allows users to update sets including account_id field for their own workouts or delegated workouts'; 