-- Add account_id column to sets table
-- This tracks which account completed each set for shared workout scenarios

ALTER TABLE sets 
ADD COLUMN account_id UUID REFERENCES auth.users(id);

-- Add a comment to document the purpose
COMMENT ON COLUMN sets.account_id IS 'The account that completed this set (for shared workout scenarios)';

-- Create an index for efficient lookups
CREATE INDEX idx_sets_account_id ON sets(account_id); 