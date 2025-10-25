-- Add missing foreign key constraints to account_shares table
-- This fixes the relationship error in getPendingInvitations

-- Add foreign key constraint for owner_user_id -> profiles(id)
ALTER TABLE account_shares 
ADD CONSTRAINT account_shares_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for delegate_user_id -> profiles(id)
-- Note: This is nullable, so we need to handle NULL values
ALTER TABLE account_shares 
ADD CONSTRAINT account_shares_delegate_user_id_fkey 
FOREIGN KEY (delegate_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add comments to document the constraints
COMMENT ON CONSTRAINT account_shares_owner_user_id_fkey ON account_shares 
IS 'Foreign key to profiles table for the account owner';

COMMENT ON CONSTRAINT account_shares_delegate_user_id_fkey ON account_shares 
IS 'Foreign key to profiles table for the delegate (nullable for non-member invitations)';
