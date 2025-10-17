-- Fix RLS policy for account_shares to allow delegates to accept/decline requests
-- This allows both owners and delegates to update account_shares records

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update their own account shares" ON account_shares;

-- Create a new UPDATE policy that allows both owners and delegates to update
CREATE POLICY "Users can update account shares they're involved in" ON account_shares
FOR UPDATE USING (
  owner_user_id = auth.uid() OR 
  delegate_user_id = auth.uid()
);

-- Add a comment to document the policy
COMMENT ON POLICY "Users can update account shares they're involved in" ON account_shares IS 'Allows users to update account_shares where they are either the owner or delegate';
