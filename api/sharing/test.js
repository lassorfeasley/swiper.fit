/**
 * Test file for sharing API functions
 * This file contains example usage and basic validation tests
 * Run this in the browser console or as a test script
 */

// Import functions dynamically to make them available globally
let sharingAPI = null;

async function loadAPI() {
  if (!sharingAPI) {
    sharingAPI = await import('./index.js');
  }
  return sharingAPI;
}

// Make functions available globally for console testing
window.testSharingAPI = async () => {
  const api = await loadAPI();
  return {
    createTrainerInvite: api.createTrainerInvite,
    createClientInvite: api.createClientInvite,
    acceptSharingRequest: api.acceptSharingRequest,
    declineSharingRequest: api.declineSharingRequest,
    getPendingRequests: api.getPendingRequests,
    getPendingRequestCount: api.getPendingRequestCount,
    createLegacyShare: api.createLegacyShare,
    updateSharePermissions: api.updateSharePermissions,
    revokeShare: api.revokeShare,
    getOwnedShares: api.getOwnedShares,
    getDelegateShares: api.getDelegateShares,
    canManageAccount: api.canManageAccount,
    getAllSharingRelationships: api.getAllSharingRelationships
  };
};

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
window.testTrainerInvitation = async () => {
  console.log('🧪 Testing trainer invitation flow...');
  
  try {
    const api = await loadAPI();
    
    // 1. Create trainer invitation
    console.log('1. Creating trainer invitation...');
    const invitation = await api.createTrainerInvite(
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
    const pendingRequests = await api.getPendingRequests(TEST_DATA.clientId);
    console.log('✅ Pending requests:', pendingRequests);

    // 3. Get pending request count
    console.log('3. Getting pending request count...');
    const count = await api.getPendingRequestCount(TEST_DATA.clientId);
    console.log('✅ Pending request count:', count);

    // 4. Accept the invitation
    console.log('4. Accepting invitation...');
    const acceptedShare = await api.acceptSharingRequest(
      invitation.id,
      TEST_DATA.clientId
    );
    console.log('✅ Invitation accepted:', acceptedShare);

    // 5. Verify management permissions
    console.log('5. Verifying management permissions...');
    const canManage = await api.canManageAccount(TEST_DATA.trainerId, TEST_DATA.clientId);
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
};

/**
 * Test client invitation flow
 */
window.testClientInvitation = async () => {
  console.log('🧪 Testing client invitation flow...');
  
  try {
    const api = await loadAPI();
    
    // 1. Create client invitation
    console.log('1. Creating client invitation...');
    const invitation = await api.createClientInvite(
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
    const pendingRequests = await api.getPendingRequests(TEST_DATA.trainerId);
    console.log('✅ Pending requests:', pendingRequests);

    // 3. Accept the invitation
    console.log('3. Accepting invitation...');
    const acceptedShare = await api.acceptSharingRequest(
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
};

/**
 * Simple test to check if API is working
 */
window.testAPI = async () => {
  console.log('🧪 Testing API connection...');
  
  try {
    const api = await loadAPI();
    console.log('✅ API loaded successfully');
    console.log('Available functions:', Object.keys(api));
    
    // Test a simple function that doesn't require real data
    const count = await api.getPendingRequestCount('test-user-id');
    console.log('✅ API call successful, pending count:', count);
    
    return { success: true, api };
  } catch (error) {
    console.error('❌ API test failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Test with real user data
 */
window.testWithRealData = async (userId) => {
  console.log('🧪 Testing with real user data...');
  
  try {
    const api = await loadAPI();
    
    // Test getting pending requests
    const pendingRequests = await api.getPendingRequests(userId);
    console.log('✅ Pending requests:', pendingRequests);
    
    // Test getting request count
    const count = await api.getPendingRequestCount(userId);
    console.log('✅ Pending request count:', count);
    
    // Test getting owned shares
    const ownedShares = await api.getOwnedShares(userId);
    console.log('✅ Owned shares:', ownedShares);
    
    // Test getting delegate shares
    const delegateShares = await api.getDelegateShares(userId);
    console.log('✅ Delegate shares:', delegateShares);
    
    return {
      success: true,
      pendingRequests,
      count,
      ownedShares,
      delegateShares
    };
    
  } catch (error) {
    console.error('❌ Real data test failed:', error);
    return { success: false, error: error.message };
  }
};

// Console instructions
console.log(`
🧪 Sharing API Test Functions Available:

1. testAPI() - Test basic API connection
2. testWithRealData(userId) - Test with real user data
3. testTrainerInvitation() - Test trainer invitation flow
4. testClientInvitation() - Test client invitation flow

Usage examples:
- testAPI()
- testWithRealData('your-user-id-here')
- testTrainerInvitation()

Note: Replace TEST_DATA values with real user IDs and emails for full testing.
`);
