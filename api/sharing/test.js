/**
 * Test file for sharing API functions
 * This file contains example usage and basic validation tests
 * Run this in the browser console or as a test script
 */

import { 
  createTrainerInvite,
  createClientInvite,
  acceptSharingRequest,
  declineSharingRequest,
  getPendingRequests,
  getPendingRequestCount,
  createLegacyShare,
  updateSharePermissions,
  revokeShare,
  getOwnedShares,
  getDelegateShares,
  canManageAccount,
  getAllSharingRelationships
} from './index.js';

// Test data (replace with actual user IDs and emails)
const TEST_DATA = {
  trainerId: 'trainer-user-id',
  clientId: 'client-user-id',
  trainerEmail: 'trainer@example.com',
  clientEmail: 'client@example.com'
};

/**
 * Test trainer invitation flow
 */
export async function testTrainerInvitation() {
  console.log('🧪 Testing trainer invitation flow...');
  
  try {
    // 1. Create trainer invitation
    console.log('1. Creating trainer invitation...');
    const invitation = await createTrainerInvite(
      TEST_DATA.clientEmail,
      TEST_DATA.trainerId,
      {
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: false
      }
    );
    console.log('✅ Trainer invitation created:', invitation);

    // 2. Get pending requests for client
    console.log('2. Getting pending requests for client...');
    const pendingRequests = await getPendingRequests(TEST_DATA.clientId);
    console.log('✅ Pending requests:', pendingRequests);

    // 3. Get pending request count
    console.log('3. Getting pending request count...');
    const count = await getPendingRequestCount(TEST_DATA.clientId);
    console.log('✅ Pending request count:', count);

    // 4. Accept the invitation
    console.log('4. Accepting invitation...');
    const acceptedShare = await acceptSharingRequest(
      invitation.id,
      TEST_DATA.clientId
    );
    console.log('✅ Invitation accepted:', acceptedShare);

    // 5. Verify management permissions
    console.log('5. Verifying management permissions...');
    const canManage = await canManageAccount(TEST_DATA.trainerId, TEST_DATA.clientId);
    console.log('✅ Can manage account:', canManage);

    return {
      success: true,
      invitation,
      acceptedShare,
      canManage
    };

  } catch (error) {
    console.error('❌ Trainer invitation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test client invitation flow
 */
export async function testClientInvitation() {
  console.log('🧪 Testing client invitation flow...');
  
  try {
    // 1. Create client invitation
    console.log('1. Creating client invitation...');
    const invitation = await createClientInvite(
      TEST_DATA.trainerEmail,
      TEST_DATA.clientId,
      {
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true
      }
    );
    console.log('✅ Client invitation created:', invitation);

    // 2. Get pending requests for trainer
    console.log('2. Getting pending requests for trainer...');
    const pendingRequests = await getPendingRequests(TEST_DATA.trainerId);
    console.log('✅ Pending requests:', pendingRequests);

    // 3. Accept the invitation
    console.log('3. Accepting invitation...');
    const acceptedShare = await acceptSharingRequest(
      invitation.id,
      TEST_DATA.trainerId
    );
    console.log('✅ Invitation accepted:', acceptedShare);

    return {
      success: true,
      invitation,
      acceptedShare
    };

  } catch (error) {
    console.error('❌ Client invitation test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test legacy sharing functions
 */
export async function testLegacySharing() {
  console.log('🧪 Testing legacy sharing functions...');
  
  try {
    // 1. Create legacy share
    console.log('1. Creating legacy share...');
    const legacyShare = await createLegacyShare({
      owner_user_id: TEST_DATA.trainerId,
      delegate_user_id: TEST_DATA.clientId,
      delegate_email: TEST_DATA.clientEmail,
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: true
    });
    console.log('✅ Legacy share created:', legacyShare);

    // 2. Update permissions
    console.log('2. Updating permissions...');
    const updatedShare = await updateSharePermissions(legacyShare.id, {
      can_create_routines: false
    });
    console.log('✅ Permissions updated:', updatedShare);

    // 3. Get owned shares
    console.log('3. Getting owned shares...');
    const ownedShares = await getOwnedShares(TEST_DATA.trainerId);
    console.log('✅ Owned shares:', ownedShares);

    // 4. Get delegate shares
    console.log('4. Getting delegate shares...');
    const delegateShares = await getDelegateShares(TEST_DATA.clientId);
    console.log('✅ Delegate shares:', delegateShares);

    // 5. Revoke share
    console.log('5. Revoking share...');
    await revokeShare(legacyShare.id);
    console.log('✅ Share revoked');

    return {
      success: true,
      legacyShare,
      updatedShare,
      ownedShares,
      delegateShares
    };

  } catch (error) {
    console.error('❌ Legacy sharing test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test error handling
 */
export async function testErrorHandling() {
  console.log('🧪 Testing error handling...');
  
  const tests = [
    {
      name: 'Self-invitation',
      test: () => createTrainerInvite(TEST_DATA.trainerEmail, TEST_DATA.trainerId)
    },
    {
      name: 'Invalid email',
      test: () => createTrainerInvite('invalid@nonexistent.com', TEST_DATA.trainerId)
    },
    {
      name: 'Accept non-existent request',
      test: () => acceptSharingRequest('non-existent-id', TEST_DATA.clientId)
    }
  ];

  for (const test of tests) {
    try {
      await test.test();
      console.log(`❌ ${test.name} should have failed but didn't`);
    } catch (error) {
      console.log(`✅ ${test.name} correctly failed:`, error.message);
    }
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🚀 Starting sharing API tests...');
  
  const results = {
    trainerInvitation: await testTrainerInvitation(),
    clientInvitation: await testClientInvitation(),
    legacySharing: await testLegacySharing(),
    errorHandling: await testErrorHandling()
  };

  console.log('📊 Test Results:', results);
  
  const successCount = Object.values(results).filter(r => r.success !== false).length;
  const totalCount = Object.keys(results).length;
  
  console.log(`✅ Tests completed: ${successCount}/${totalCount} passed`);
  
  return results;
}

// Export test functions for individual testing
export {
  testTrainerInvitation,
  testClientInvitation,
  testLegacySharing,
  testErrorHandling
};
