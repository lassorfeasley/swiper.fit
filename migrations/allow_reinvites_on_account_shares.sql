-- Allow re-invites between the same owner/delegate after a relationship is declined or revoked

-- 1) Clean up legacy constraints that still enforce uniqueness regardless of status
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_owner_delegate_unique;
ALTER TABLE account_shares DROP CONSTRAINT IF EXISTS account_shares_owner_delegate_type_unique;

-- 2) Replace previous member->member unique index with a PARTIAL one that only blocks duplicates
--    when a relationship is pending or active (allows re-invite after decline/revoke)
DROP INDEX IF EXISTS account_shares_active_unique;
CREATE UNIQUE INDEX account_shares_active_unique
  ON account_shares (owner_user_id, delegate_user_id, request_type)
  WHERE delegate_user_id IS NOT NULL AND status IN ('pending', 'active');

-- 3) Ensure we only block duplicate non-member pending invites per email and direction
DROP INDEX IF EXISTS account_shares_delegate_email_pending_unique;
CREATE UNIQUE INDEX account_shares_delegate_email_pending_unique
  ON account_shares (owner_user_id, delegate_email, request_type)
  WHERE delegate_user_id IS NULL AND status = 'pending';

-- Optional: If an older non-unique email index exists, remove it to avoid redundancy
DROP INDEX IF EXISTS idx_account_shares_delegate_email;

COMMENT ON INDEX account_shares_active_unique IS 'Prevents duplicate member-to-member invites when status is pending/active, allows re-invites otherwise';
COMMENT ON INDEX account_shares_delegate_email_pending_unique IS 'Prevents duplicate pending non-member invites per owner/email/direction';


