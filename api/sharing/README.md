# Sharing API Documentation

This API provides functions for managing trainer-client relationships with double opt-in invitations.

## Overview

The sharing system now supports two types of invitations:
- **Trainer Invitations**: Trainers invite clients to let them manage their workouts
- **Client Invitations**: Clients invite trainers to manage their workouts

All invitations require acceptance before access is granted.

## Database Schema

The `account_shares` table has been extended with new columns:
- `status`: 'pending', 'active', 'declined', 'revoked'
- `request_type`: 'legacy', 'trainer_invite', 'client_invite'
- `responded_at`: Timestamp when invitation was accepted/declined
- `expires_at`: Expiration date for pending invitations (14 days)

## API Functions

### Invitation Functions

#### `createTrainerInvite(clientEmail, trainerId, permissions)`
Creates an invitation where a trainer wants to manage a client's account.

**Parameters:**
- `clientEmail` (string): Email of the client to invite
- `trainerId` (string): ID of the trainer sending the invitation
- `permissions` (object, optional): Default permissions
  - `can_create_routines` (boolean, default: false)
  - `can_start_workouts` (boolean, default: false)
  - `can_review_history` (boolean, default: false)

**Returns:** Promise<object> - Created invitation data with client profile

**Example:**
```javascript
import { createTrainerInvite } from '@/api/sharing';

try {
  const invitation = await createTrainerInvite(
    'client@example.com',
    'trainer-user-id',
    {
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: false
    }
  );
  console.log('Invitation sent:', invitation);
} catch (error) {
  console.error('Failed to send invitation:', error.message);
}
```

#### `createClientInvite(trainerEmail, clientId, permissions)`
Creates an invitation where a client wants a trainer to manage their account.

**Parameters:**
- `trainerEmail` (string): Email of the trainer to invite
- `clientId` (string): ID of the client sending the invitation
- `permissions` (object, optional): Default permissions

**Returns:** Promise<object> - Created invitation data with trainer profile

**Example:**
```javascript
import { createClientInvite } from '@/api/sharing';

try {
  const invitation = await createClientInvite(
    'trainer@example.com',
    'client-user-id',
    {
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: true
    }
  );
  console.log('Invitation sent:', invitation);
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
  createTrainerInvite, 
  getPendingRequests, 
  acceptSharingRequest 
} from '@/api/sharing';

// In a React component
const handleSendInvitation = async () => {
  try {
    await createTrainerInvite(email, userId, permissions);
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
