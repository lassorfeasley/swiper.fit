-- Comprehensive fix for account_shares foreign key issues
-- This script ensures the foreign keys are properly created and recognized by Supabase

-- First, check if constraints already exist and drop them if they do
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_shares_owner_user_id_fkey') THEN
        ALTER TABLE account_shares DROP CONSTRAINT account_shares_owner_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_shares_delegate_user_id_fkey') THEN
        ALTER TABLE account_shares DROP CONSTRAINT account_shares_delegate_user_id_fkey;
    END IF;
END $$;

-- Create the foreign key constraints with explicit naming
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

-- Verify the constraints were created
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'account_shares'::regclass
    AND conname LIKE '%user_id_fkey'
ORDER BY conname;
