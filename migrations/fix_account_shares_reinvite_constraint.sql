-- Fix account_shares_active_unique constraint to allow re-invitations after soft deletion
-- The current constraint doesn't exclude revoked records, causing re-invitation failures

-- Drop the existing constraint
DROP INDEX IF EXISTS account_shares_active_unique;

-- Create updated constraint that excludes revoked records
CREATE UNIQUE INDEX account_shares_active_unique
  ON account_shares (owner_user_id, delegate_user_id, request_type)
  WHERE delegate_user_id IS NOT NULL 
    AND status IN ('pending', 'active')
    AND revoked_at IS NULL;

-- Update the comment to reflect the change
COMMENT ON INDEX account_shares_active_unique IS 'Prevents duplicate member-to-member invites when status is pending/active and not revoked, allows re-invites after revocation';
