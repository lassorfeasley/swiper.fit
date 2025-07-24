-- Update RLS policies to support delegation
-- This allows managers to access delegated users' workouts

-- Drop existing RLS policies for workouts table
DROP POLICY IF EXISTS "Users can view their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can insert their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can update their own workouts" ON workouts;
DROP POLICY IF EXISTS "Users can delete their own workouts" ON workouts;

-- Create new RLS policies that support delegation
-- Users can view workouts they own OR workouts of users they're delegating to
CREATE POLICY "Users can view their own workouts or delegated workouts" ON workouts
FOR SELECT USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
  )
);

-- Users can insert workouts for themselves OR for users they're delegating to
CREATE POLICY "Users can insert their own workouts or delegated workouts" ON workouts
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
  )
);

-- Users can update workouts they own OR workouts of users they're delegating to
CREATE POLICY "Users can update their own workouts or delegated workouts" ON workouts
FOR UPDATE USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
  )
);

-- Users can delete workouts they own OR workouts of users they're delegating to
CREATE POLICY "Users can delete their own workouts or delegated workouts" ON workouts
FOR DELETE USING (
  user_id = auth.uid() OR
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
  )
);

-- Update RLS policies for sets table to support delegation
DROP POLICY IF EXISTS "Users can view sets from their own workouts" ON sets;
DROP POLICY IF EXISTS "Users can insert sets into their own workouts" ON sets;
DROP POLICY IF EXISTS "Users can update sets from their own workouts" ON sets;
DROP POLICY IF EXISTS "Users can delete sets from their own workouts" ON sets;

-- Create new RLS policies for sets that support delegation
CREATE POLICY "Users can view sets from their own workouts or delegated workouts" ON sets
FOR SELECT USING (
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
);

CREATE POLICY "Users can delete sets from their own workouts or delegated workouts" ON sets
FOR DELETE USING (
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

-- Update RLS policies for workout_exercises table to support delegation
DROP POLICY IF EXISTS "Users can view workout exercises from their own workouts" ON workout_exercises;
DROP POLICY IF EXISTS "Users can insert workout exercises into their own workouts" ON workout_exercises;
DROP POLICY IF EXISTS "Users can update workout exercises from their own workouts" ON workout_exercises;
DROP POLICY IF EXISTS "Users can delete workout exercises from their own workouts" ON workout_exercises;

-- Create new RLS policies for workout_exercises that support delegation
CREATE POLICY "Users can view workout exercises from their own workouts or delegated workouts" ON workout_exercises
FOR SELECT USING (
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

CREATE POLICY "Users can insert workout exercises into their own workouts or delegated workouts" ON workout_exercises
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

CREATE POLICY "Users can update workout exercises from their own workouts or delegated workouts" ON workout_exercises
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
);

CREATE POLICY "Users can delete workout exercises from their own workouts or delegated workouts" ON workout_exercises
FOR DELETE USING (
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