-- Fix RLS policies for routines table
-- This migration creates the missing RLS policies for the routines table

-- Enable RLS on routines table if not already enabled
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own routines" ON routines;
DROP POLICY IF EXISTS "Users can view public routines" ON routines;
DROP POLICY IF EXISTS "Users can view delegated routines" ON routines;
DROP POLICY IF EXISTS "Users can insert their own routines" ON routines;
DROP POLICY IF EXISTS "Users can update their own routines" ON routines;
DROP POLICY IF EXISTS "Users can delete their own routines" ON routines;

-- Users can view their own routines
CREATE POLICY "Users can view their own routines" ON routines
FOR SELECT USING (
  user_id = auth.uid()
);

-- Anyone can view public routines (for public routine pages)
CREATE POLICY "Users can view public routines" ON routines
FOR SELECT USING (
  is_public = true
);

-- Users can view routines they have permission to access through delegation
CREATE POLICY "Users can view delegated routines" ON routines
FOR SELECT USING (
  user_id IN (
    SELECT owner_user_id 
    FROM account_shares 
    WHERE delegate_user_id = auth.uid() 
    AND revoked_at IS NULL
    AND can_create_routines = true
  )
);

-- Users can insert their own routines
CREATE POLICY "Users can insert their own routines" ON routines
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Users can update their own routines
CREATE POLICY "Users can update their own routines" ON routines
FOR UPDATE USING (
  user_id = auth.uid()
);

-- Users can delete their own routines
CREATE POLICY "Users can delete their own routines" ON routines
FOR DELETE USING (
  user_id = auth.uid()
);

-- Add comments to document the policies
COMMENT ON POLICY "Users can view their own routines" ON routines IS 'Allows users to view routines they own';
COMMENT ON POLICY "Users can view public routines" ON routines IS 'Allows anyone to view public routines for sharing';
COMMENT ON POLICY "Users can view delegated routines" ON routines IS 'Allows users to view routines of users they manage with create permission';
COMMENT ON POLICY "Users can insert their own routines" ON routines IS 'Allows users to create routines for themselves';
COMMENT ON POLICY "Users can update their own routines" ON routines IS 'Allows users to update routines they own';
COMMENT ON POLICY "Users can delete their own routines" ON routines IS 'Allows users to delete routines they own';
