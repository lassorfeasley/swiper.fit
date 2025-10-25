-- Fix account_shares_active_unique constraint to allow re-invitations after soft deletion
-- Run this SQL in your Supabase SQL editor or database client

-- First, add missing foreign key constraints
ALTER TABLE account_shares 
ADD CONSTRAINT IF NOT EXISTS account_shares_owner_user_id_fkey 
FOREIGN KEY (owner_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE account_shares 
ADD CONSTRAINT IF NOT EXISTS account_shares_delegate_user_id_fkey 
FOREIGN KEY (delegate_user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add is_paused column to workouts table if it doesn't exist
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE;

-- Update existing workouts to have is_paused = false
UPDATE workouts 
SET is_paused = FALSE 
WHERE is_paused IS NULL;

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

-- Also update the non-member email constraint to exclude revoked records
DROP INDEX IF EXISTS account_shares_delegate_email_pending_unique;
CREATE UNIQUE INDEX account_shares_delegate_email_pending_unique
  ON account_shares (owner_user_id, delegate_email, request_type)
  WHERE delegate_user_id IS NULL 
    AND status = 'pending'
    AND revoked_at IS NULL;

COMMENT ON INDEX account_shares_delegate_email_pending_unique IS 'Prevents duplicate pending non-member invites per owner/email/direction, excluding revoked records';
