-- Add RLS policies to account_shares table for real-time subscriptions
-- This ensures users can read account_shares records they're involved in

-- Enable RLS on account_shares table if not already enabled
ALTER TABLE account_shares ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own account shares" ON account_shares;
DROP POLICY IF EXISTS "Users can view account shares they're involved in" ON account_shares;
DROP POLICY IF EXISTS "Users can insert their own account shares" ON account_shares;
DROP POLICY IF EXISTS "Users can update their own account shares" ON account_shares;
DROP POLICY IF EXISTS "Users can delete their own account shares" ON account_shares;

-- Users can view account_shares where they are the owner OR the delegate
CREATE POLICY "Users can view account shares they're involved in" ON account_shares
FOR SELECT USING (
  owner_user_id = auth.uid() OR 
  delegate_user_id = auth.uid()
);

-- Users can insert account_shares where they are the owner
CREATE POLICY "Users can insert their own account shares" ON account_shares
FOR INSERT WITH CHECK (
  owner_user_id = auth.uid()
);

-- Users can update account_shares where they are the owner
CREATE POLICY "Users can update their own account shares" ON account_shares
FOR UPDATE USING (
  owner_user_id = auth.uid()
);

-- Users can delete (soft delete) account_shares where they are the owner
CREATE POLICY "Users can delete their own account shares" ON account_shares
FOR DELETE USING (
  owner_user_id = auth.uid()
);

-- Add comments to document the policies
COMMENT ON POLICY "Users can view account shares they're involved in" ON account_shares IS 'Allows users to view account_shares where they are either the owner or delegate';
COMMENT ON POLICY "Users can insert their own account shares" ON account_shares IS 'Allows users to create account_shares where they are the owner';
COMMENT ON POLICY "Users can update their own account shares" ON account_shares IS 'Allows users to update account_shares where they are the owner';
COMMENT ON POLICY "Users can delete their own account shares" ON account_shares IS 'Allows users to delete account_shares where they are the owner'; 