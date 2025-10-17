import { supabase } from '@/supabaseClient';

/**
 * Creates a trainer invitation - when a trainer (account manager) wants to manage a client's (account owner) account
 * Supports bidirectional relationships: A can be trainer for B while B is trainer for A
 * @param {string} clientEmail - Email of the client (account owner) to invite
 * @param {string} trainerId - ID of the trainer (account manager) sending the invitation
 * @param {object} permissions - Default permissions for the invitation
 * @returns {Promise<object>} Created invitation data
 */
export async function createTrainerInvite(clientEmail, trainerId, permissions = {}) {
  try {
    // Look up the client (account owner) by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("email", clientEmail.trim().toLowerCase())
      .limit(1);

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw new Error("Failed to look up user");
    }

    if (!profiles?.length) {
      throw new Error("No user found with that email address");
    }

    const clientProfile = profiles[0];
    const clientId = clientProfile.id;

    // Check if user is trying to invite themselves
    if (clientId === trainerId) {
      throw new Error("You cannot invite yourself");
    }

    // Check for existing pending or active shares in this specific direction only
    // This allows bidirectional relationships (A can be trainer for B while B is trainer for A)
    console.log(`[createTrainerInvite] Checking for existing shares:`, {
      trainerId,
      clientId,
      clientEmail
    });
    
    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at, request_type")
      .eq("owner_user_id", trainerId)
      .eq("delegate_user_id", clientId)
      .limit(1);

    console.log(`[createTrainerInvite] Existing shares check result:`, { existingShares, existingError });

    if (existingError) {
      console.error("Existing shares check error:", existingError);
      throw new Error("Failed to check existing shares");
    }

    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      console.log(`[createTrainerInvite] Found existing share:`, existingShare);
      
      if (existingShare.status === 'pending') {
        throw new Error("A pending invitation already exists");
      } else if (existingShare.status === 'active') {
        // Check if this is the same direction (trainer → client)
        if (existingShare.request_type === 'trainer_invite') {
          throw new Error("Access already shared with this user");
        } else {
          // Different direction (client → trainer), allow bidirectional relationship
          console.log("Different direction relationship exists, allowing bidirectional");
        }
      } else if (existingShare.status === 'declined') {
        // Allow creating a new invitation after a declined one
        console.log("Previous invitation was declined, creating new one");
      }
    }

    // Create the trainer invitation
    const invitationData = {
      owner_user_id: trainerId, // Trainer (account manager) is the owner (will manage client's account)
      delegate_user_id: clientId, // Client (account owner) is the delegate (will be managed)
      delegate_email: clientEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'trainer_invite',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    const { data, error } = await supabase
      .from("account_shares")
      .insert(invitationData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create trainer invitation:", error);
      throw new Error("Failed to create invitation");
    }

    console.log("Trainer invitation created successfully:", data);
    return {
      ...data,
      clientProfile
    };

  } catch (error) {
    console.error("Error creating trainer invitation:", error);
    throw error;
  }
}

/**
 * Creates a client invitation - when a client (account owner) wants a trainer (account manager) to manage their account
 * Supports bidirectional relationships: A can be trainer for B while B is trainer for A
 * @param {string} trainerEmail - Email of the trainer (account manager) to invite
 * @param {string} clientId - ID of the client (account owner) sending the invitation
 * @param {object} permissions - Default permissions for the invitation
 * @returns {Promise<object>} Created invitation data
 */
export async function createClientInvite(trainerEmail, clientId, permissions = {}) {
  try {
    // Look up the trainer (account manager) by email
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("email", trainerEmail.trim().toLowerCase())
      .limit(1);

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw new Error("Failed to look up user");
    }

    if (!profiles?.length) {
      throw new Error("No user found with that email address");
    }

    const trainerProfile = profiles[0];
    const trainerId = trainerProfile.id;

    // Check if user is trying to invite themselves
    if (trainerId === clientId) {
      throw new Error("You cannot invite yourself");
    }

    // Check for existing pending or active shares in this specific direction only
    // This allows bidirectional relationships (A can be trainer for B while B is trainer for A)
    console.log(`[createClientInvite] Checking for existing shares:`, {
      clientId,
      trainerId,
      trainerEmail
    });
    
    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at, request_type")
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", trainerId)
      .limit(1);

    console.log(`[createClientInvite] Existing shares check result:`, { existingShares, existingError });

    if (existingError) {
      console.error("Existing shares check error:", existingError);
      throw new Error("Failed to check existing shares");
    }

    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      console.log(`[createClientInvite] Found existing share:`, existingShare);
      
      if (existingShare.status === 'pending') {
        throw new Error("A pending invitation already exists");
      } else if (existingShare.status === 'active') {
        // Check if this is the same direction (client → trainer)
        if (existingShare.request_type === 'client_invite') {
          throw new Error("Access already shared with this user");
        } else {
          // Different direction (trainer → client), allow bidirectional relationship
          console.log("Different direction relationship exists, allowing bidirectional");
        }
      } else if (existingShare.status === 'declined') {
        // Allow creating a new invitation after a declined one
        console.log("Previous invitation was declined, creating new one");
      }
    }

    // Create the client invitation
    const invitationData = {
      owner_user_id: clientId, // Client (account owner) is the owner (will be managed)
      delegate_user_id: trainerId, // Trainer (account manager) is the delegate (will manage client's account)
      delegate_email: trainerEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'client_invite',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    console.log(`[createClientInvite] Attempting to insert:`, invitationData);
    
    const { data, error } = await supabase
      .from("account_shares")
      .insert(invitationData)
      .select()
      .single();

    console.log(`[createClientInvite] Insert result:`, { data, error });

    if (error) {
      console.error("Failed to create client invitation:", error);
      console.error("Full error details:", JSON.stringify(error, null, 2));
      throw new Error("Failed to create invitation");
    }

    console.log("Client invitation created successfully:", data);
    return {
      ...data,
      trainerProfile
    };

  } catch (error) {
    console.error("Error creating client invitation:", error);
    throw error;
  }
}

/**
 * Accepts a sharing request
 * @param {string} requestId - ID of the sharing request to accept
 * @param {string} userId - ID of the user accepting the request
 * @returns {Promise<object>} Updated sharing data
 */
export async function acceptSharingRequest(requestId, userId) {
  try {
    console.log(`[acceptSharingRequest] Starting with requestId: ${requestId}, userId: ${userId}`);
    
    // First, verify the user is the delegate (recipient) of this request
    const { data: request, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .single();

    console.log(`[acceptSharingRequest] Verification query result:`, { request, fetchError });

    if (fetchError || !request) {
      console.log(`[acceptSharingRequest] Verification failed:`, { fetchError, request });
      throw new Error("Request not found or you don't have permission to accept it");
    }

    // Check if request has expired
    if (new Date(request.expires_at) < new Date()) {
      console.log(`[acceptSharingRequest] Request expired:`, request.expires_at);
      throw new Error("This invitation has expired");
    }

    console.log(`[acceptSharingRequest] Request verified, proceeding with update...`);
    console.log(`[acceptSharingRequest] Request details:`, {
      id: request.id,
      owner_user_id: request.owner_user_id,
      delegate_user_id: request.delegate_user_id,
      status: request.status,
      request_type: request.request_type,
      expires_at: request.expires_at
    });

    // Update the request to accepted status using a more robust approach
    const { data, error } = await supabase
      .from("account_shares")
      .update({
        status: 'active',
        responded_at: new Date().toISOString()
      })
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .select();

    console.log(`[acceptSharingRequest] Update query result:`, { data, error });

    if (error) {
      console.error("Failed to accept sharing request:", error);
      throw new Error("Failed to accept request");
    }

    if (!data || data.length === 0) {
      console.log(`[acceptSharingRequest] No rows updated, checking database state...`);
      
      // Check what's actually in the database right now
      const { data: currentRequest, error: checkError } = await supabase
        .from("account_shares")
        .select("*")
        .eq("id", requestId)
        .single();
      
      console.log(`[acceptSharingRequest] Current database state:`, { currentRequest, checkError });
      
      console.log(`[acceptSharingRequest] Trying alternative approach...`);
      
      // Alternative approach: Try to update without the status condition
      const { data: altData, error: altError } = await supabase
        .from("account_shares")
        .update({
          status: 'active',
          responded_at: new Date().toISOString()
        })
        .eq("id", requestId)
        .eq("delegate_user_id", userId)
        .select();

      console.log(`[acceptSharingRequest] Alternative update result:`, { altData, altError });

      if (altError) {
        console.error("Failed to accept sharing request (alternative):", altError);
        throw new Error("Failed to accept request");
      }

      if (!altData || altData.length === 0) {
        console.log(`[acceptSharingRequest] Alternative update also failed:`, { altData });
        
        // Check if this might be an RLS issue by trying a simple select
        const { data: testSelect, error: testError } = await supabase
          .from("account_shares")
          .select("id, status")
          .eq("id", requestId)
          .eq("delegate_user_id", userId);
        
        console.log(`[acceptSharingRequest] Test select result:`, { testSelect, testError });
        
        throw new Error("Request not found or already processed");
      }

      console.log("Sharing request accepted successfully (alternative):", altData);
      return altData[0];
    }

    console.log("Sharing request accepted successfully:", data);
    return data[0];

  } catch (error) {
    console.error("Error accepting sharing request:", error);
    throw error;
  }
}

/**
 * Declines a sharing request
 * @param {string} requestId - ID of the sharing request to decline
 * @param {string} userId - ID of the user declining the request
 * @returns {Promise<object>} Updated sharing data
 */
export async function declineSharingRequest(requestId, userId) {
  try {
    // First, verify the user is the delegate (recipient) of this request
    const { data: request, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      throw new Error("Request not found or you don't have permission to decline it");
    }

    // Update the request to declined status
    const { data, error } = await supabase
      .from("account_shares")
      .update({
        status: 'declined',
        responded_at: new Date().toISOString()
      })
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .select();

    if (error) {
      console.error("Failed to decline sharing request:", error);
      throw new Error("Failed to decline request");
    }

    if (!data || data.length === 0) {
      throw new Error("Request not found or already processed");
    }

    console.log("Sharing request declined successfully:", data);
    return data[0];

  } catch (error) {
    console.error("Error declining sharing request:", error);
    throw error;
  }
}

/**
 * Gets all pending sharing requests for a user
 * @param {string} userId - ID of the user to get requests for
 * @returns {Promise<Array>} Array of pending requests
 */
export async function getPendingRequests(userId) {
  try {
    const { data: requests, error } = await supabase
      .from("account_shares")
      .select(`
        id,
        owner_user_id,
        delegate_user_id,
        delegate_email,
        request_type,
        status,
        created_at,
        expires_at,
        can_create_routines,
        can_start_workouts,
        can_review_history
      `)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch pending requests:", error);
      throw new Error("Failed to fetch pending requests");
    }

    // Fetch profile data separately for each request
    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", request.owner_user_id)
          .single();
        
        return {
          ...request,
          profiles: profile
        };
      })
    );

    return requestsWithProfiles;
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    throw new Error("Failed to fetch pending requests");
  }
}

/**
 * Gets the count of pending requests for a user (for notification badges)
 * @param {string} userId - ID of the user to get count for
 * @returns {Promise<number>} Count of pending requests
 */
export async function getPendingRequestCount(userId) {
  try {
    const { count, error } = await supabase
      .from("account_shares")
      .select("*", { count: 'exact', head: true })
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Failed to fetch pending request count:", error);
      throw new Error("Failed to fetch pending request count");
    }

    return count || 0;

  } catch (error) {
    console.error("Error fetching pending request count:", error);
    throw error;
  }
}
