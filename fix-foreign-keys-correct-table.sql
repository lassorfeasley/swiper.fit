-- Fix foreign key constraints to point to profiles table instead of auth.users
-- The current constraints point to auth.users but the app expects profiles

-- Drop the existing incorrect foreign key constraints
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_owner_user_id_fkey;
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_delegate_user_id_fkey;

-- Create the correct foreign key constraints pointing to profiles table
ALTER TABLE account_shares 
ADD CONSTRAINT account_shares_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE account_shares 
ADD CONSTRAINT account_shares_delegate_user_id_fkey 
FOREIGN KEY (delegate_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add comments to document the constraints
COMMENT ON CONSTRAINT account_shares_owner_user_id_fkey ON account_shares 
IS 'Foreign key to profiles table for the account owner';

COMMENT ON CONSTRAINT account_shares_delegate_user_id_fkey ON account_shares 
IS 'Foreign key to profiles table for the delegate (nullable for non-member invitations)';

-- Verify the constraints were created correctly
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'account_shares'::regclass
    AND conname LIKE '%user_id_fkey'
ORDER BY conname;
