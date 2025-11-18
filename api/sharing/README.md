# Sharing API Documentation

This API provides functions for managing trainer-client relationships with double opt-in invitations.

## Overview

The sharing system now supports two types of invitations:
- **Trainer Invitations**: Trainers invite clients to let them manage their workouts
- **Client Invitations**: Clients invite trainers to manage their workouts

All invitations require acceptance before access is granted.

## Bidirectional Relationships

The system supports bidirectional trainer-client relationships:
- User A can be User B's trainer (A manages B's account)
- User B can simultaneously be User A's trainer (B manages A's account)
- Each direction is managed independently with its own permissions
- Removing one direction does not affect the other direction

## Database Schema

The `account_shares` table has been extended with new columns:
- `status`: 'pending', 'active', 'declined', 'revoked'
- `request_type`: 'legacy', 'trainer_invite', 'client_invite'
- `responded_at`: Timestamp when invitation was accepted/declined
- `expires_at`: Expiration date for pending invitations (14 days)

## API Functions

### Invitation Functions

#### `inviteClientToBeManaged(clientEmail, trainerId, permissions)`
Invites a client to be managed by a trainer.
Creates an invitation where the trainer will manage the client's account.

**Relationship created:** `owner=client`, `delegate=trainer`
This means the trainer (delegate) manages the client's (owner) account.

**Parameters:**
- `clientEmail` (string): Email of the client to invite
- `trainerId` (string): ID of the trainer sending the invitation (will be the delegate)
- `permissions` (object, optional): Default permissions
  - `can_create_routines` (boolean, default: false)
  - `can_start_workouts` (boolean, default: false)
  - `can_review_history` (boolean, default: false)

**Returns:** Promise<void>

**Example:**
```javascript
import { inviteClientToBeManaged } from '@/lib/sharingApi';

try {
  await inviteClientToBeManaged(
    'client@example.com',
    'trainer-user-id',
    {
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: false
    }
  );
  console.log('Invitation sent');
} catch (error) {
  console.error('Failed to send invitation:', error.message);
}
```

#### `inviteTrainerToManage(trainerEmail, clientId, permissions)`
Invites a trainer to manage a client's account.
Creates an invitation where the trainer will manage the client's account.

**Relationship created:** `owner=client`, `delegate=trainer`
This means the trainer (delegate) manages the client's (owner) account.

**Parameters:**
- `trainerEmail` (string): Email of the trainer to invite
- `clientId` (string): ID of the client sending the invitation (will be the owner)
- `permissions` (object, optional): Default permissions
  - `can_create_routines` (boolean, default: false)
  - `can_start_workouts` (boolean, default: false)
  - `can_review_history` (boolean, default: false)

**Returns:** Promise<void>

**Example:**
```javascript
import { inviteTrainerToManage } from '@/lib/sharingApi';

try {
  await inviteTrainerToManage(
    'trainer@example.com',
    'client-user-id',
    {
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: true
    }
  );
  console.log('Invitation sent');
} catch (error) {
  console.error('Failed to send invitation:', error.message);
}
```

#### `acceptSharingRequest(requestId, userId)`
Accepts a pending sharing request.

**Parameters:**
- `requestId` (string): ID of the sharing request
- `userId` (string): ID of the user accepting the request

**Returns:** Promise<object> - Updated sharing data

**Example:**
```javascript
import { acceptSharingRequest } from '@/api/sharing';

try {
  const acceptedShare = await acceptSharingRequest(
    'request-id',
    'user-id'
  );
  console.log('Request accepted:', acceptedShare);
} catch (error) {
  console.error('Failed to accept request:', error.message);
}
```

#### `declineSharingRequest(requestId, userId)`
Declines a pending sharing request.

**Parameters:**
- `requestId` (string): ID of the sharing request
- `userId` (string): ID of the user declining the request

**Returns:** Promise<object> - Updated sharing data

**Example:**
```javascript
import { declineSharingRequest } from '@/api/sharing';

try {
  const declinedShare = await declineSharingRequest(
    'request-id',
    'user-id'
  );
  console.log('Request declined:', declinedShare);
} catch (error) {
  console.error('Failed to decline request:', error.message);
}
```

#### `getPendingRequests(userId)`
Gets all pending sharing requests for a user.

**Parameters:**
- `userId` (string): ID of the user

**Returns:** Promise<Array> - Array of pending requests

**Example:**
```javascript
import { getPendingRequests } from '@/api/sharing';

try {
  const pendingRequests = await getPendingRequests('user-id');
  console.log('Pending requests:', pendingRequests);
} catch (error) {
  console.error('Failed to fetch requests:', error.message);
}
```

#### `getPendingRequestCount(userId)`
Gets the count of pending requests for notification badges.

**Parameters:**
- `userId` (string): ID of the user

**Returns:** Promise<number> - Count of pending requests

**Example:**
```javascript
import { getPendingRequestCount } from '@/api/sharing';

try {
  const count = await getPendingRequestCount('user-id');
  console.log('Pending requests count:', count);
} catch (error) {
  console.error('Failed to fetch count:', error.message);
}
```

### Legacy Sharing Functions

These functions maintain backward compatibility with the existing sharing system.

#### `createLegacyShare(shareData)`
Creates an immediate share without invitation (legacy behavior).

#### `updateSharePermissions(shareId, permissions)`
Updates permissions for an existing share.

#### `revokeShare(shareId)`
Revokes a share (soft delete).

#### `getOwnedShares(userId)`
Gets shares where the user is the owner.

#### `getDelegateShares(userId)`
Gets shares where the user is the delegate.

#### `canManageAccount(managerId, clientId)`
Checks if a user can manage another user's account.

#### `getAllSharingRelationships(userId)`
Gets all sharing relationships for a user (owned, delegated, and pending).

## Error Handling

All functions throw errors with descriptive messages:
- "No user found with that email address"
- "You cannot invite yourself"
- "A pending invitation already exists"
- "Access already shared with this user"
- "This invitation has expired"
- "Request not found or you don't have permission to accept it"

## Usage in React Components

```javascript
import { 
  inviteTrainerToManage, 
  getPendingInvitations, 
  acceptInvitation 
} from '@/lib/sharingApi';

// In a React component
const handleSendInvitation = async () => {
  try {
    await inviteTrainerToManage(trainerEmail, clientId, permissions);
    toast.success('Invitation sent successfully');
  } catch (error) {
    toast.error(error.message);
  }
};

const handleAcceptRequest = async (requestId) => {
  try {
    await acceptSharingRequest(requestId, userId);
    toast.success('Request accepted');
    // Refresh the requests list
    refetchRequests();
  } catch (error) {
    toast.error(error.message);
  }
};
```

## Migration Notes

- Existing shares automatically get `status: 'active'` and `request_type: 'legacy'`
- The `revoked_at` column is still supported for backward compatibility
- New invitations expire after 14 days if not responded to
- Expired invitations are automatically marked as 'declined'
