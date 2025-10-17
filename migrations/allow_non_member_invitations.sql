-- Allow non-member invitations in account_shares table
-- This enables inviting people who don't have Swiper accounts yet

-- Make delegate_user_id nullable to support non-member invitations
ALTER TABLE account_shares ALTER COLUMN delegate_user_id DROP NOT NULL;

-- Drop the existing unique constraint that doesn't handle null values
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_owner_delegate_type_unique;

-- Create a partial unique index that only applies when delegate_user_id is not null
-- This prevents duplicate invitations between existing members
CREATE UNIQUE INDEX account_shares_active_unique ON account_shares (owner_user_id, delegate_user_id, request_type) 
WHERE delegate_user_id IS NOT NULL;

-- Add index on delegate_email for faster lookups of non-member invitations
CREATE INDEX idx_account_shares_delegate_email ON account_shares(delegate_email) 
WHERE delegate_user_id IS NULL;

-- Update RLS policies to support non-member invitations
-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view account shares they're involved in" ON account_shares;

-- Create updated SELECT policy that includes email-based access for non-members
CREATE POLICY "Users can view account shares they're involved in" ON account_shares
FOR SELECT USING (
  owner_user_id = auth.uid() OR 
  delegate_user_id = auth.uid() OR
  (delegate_user_id IS NULL AND delegate_email = auth.email())
);

-- Add comment to document the updated policy
COMMENT ON POLICY "Users can view account shares they're involved in" ON account_shares 
IS 'Allows users to view account_shares where they are owner, delegate, or invited by email (for non-members)';

-- Add comment to document the schema changes
COMMENT ON TABLE account_shares IS 'Stores sharing relationships between users. delegate_user_id can be null for non-member invitations.';
