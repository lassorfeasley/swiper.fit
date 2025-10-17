-- Fix unique constraint to allow bidirectional relationships
-- The current constraint prevents A->B and B->A relationships
-- We need to allow both directions but prevent duplicates in the same direction

-- Drop the existing unique constraint
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_owner_delegate_unique;

-- Create a new unique constraint that includes request_type
-- This allows bidirectional relationships but prevents duplicates in the same direction
ALTER TABLE account_shares ADD CONSTRAINT account_shares_owner_delegate_type_unique 
UNIQUE (owner_user_id, delegate_user_id, request_type);

-- Add a comment to document the constraint
COMMENT ON CONSTRAINT account_shares_owner_delegate_type_unique ON account_shares 
IS 'Allows bidirectional relationships (A->B and B->A) but prevents duplicates in same direction';
