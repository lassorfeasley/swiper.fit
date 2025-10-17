import { supabase } from '@/supabaseClient';

/**
 * Creates a trainer invitation - when a trainer wants to manage a client's account
 * @param {string} clientEmail - Email of the client to invite
 * @param {string} trainerId - ID of the trainer sending the invitation
 * @param {object} permissions - Default permissions for the invitation
 * @returns {Promise<object>} Created invitation data
 */
export async function createTrainerInvite(clientEmail, trainerId, permissions = {}) {
  try {
    // Look up the client by email
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

    // Check for existing pending or active shares
    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at")
      .eq("owner_user_id", trainerId)
      .eq("delegate_user_id", clientId)
      .limit(1);

    if (existingError) {
      console.error("Existing shares check error:", existingError);
      throw new Error("Failed to check existing shares");
    }

    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      if (existingShare.status === 'pending') {
        throw new Error("A pending invitation already exists");
      } else if (existingShare.status === 'active') {
        throw new Error("Access already shared with this user");
      } else if (existingShare.status === 'declined') {
        // Allow creating a new invitation after a declined one
        console.log("Previous invitation was declined, creating new one");
      }
    }

    // Create the trainer invitation
    const invitationData = {
      owner_user_id: trainerId, // Trainer is the owner (will manage client's account)
      delegate_user_id: clientId, // Client is the delegate (will be managed)
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
 * Creates a client invitation - when a client wants a trainer to manage their account
 * @param {string} trainerEmail - Email of the trainer to invite
 * @param {string} clientId - ID of the client sending the invitation
 * @param {object} permissions - Default permissions for the invitation
 * @returns {Promise<object>} Created invitation data
 */
export async function createClientInvite(trainerEmail, clientId, permissions = {}) {
  try {
    // Look up the trainer by email
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

    // Check for existing pending or active shares
    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at")
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", trainerId)
      .limit(1);

    if (existingError) {
      console.error("Existing shares check error:", existingError);
      throw new Error("Failed to check existing shares");
    }

    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      if (existingShare.status === 'pending') {
        throw new Error("A pending invitation already exists");
      } else if (existingShare.status === 'active') {
        throw new Error("Access already shared with this user");
      } else if (existingShare.status === 'declined') {
        // Allow creating a new invitation after a declined one
        console.log("Previous invitation was declined, creating new one");
      }
    }

    // Create the client invitation
    const invitationData = {
      owner_user_id: clientId, // Client is the owner (will be managed)
      delegate_user_id: trainerId, // Trainer is the delegate (will manage client's account)
      delegate_email: trainerEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'client_invite',
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
      console.error("Failed to create client invitation:", error);
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
    // First, verify the user is the delegate (recipient) of this request
    const { data: request, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .single();

    if (fetchError || !request) {
      throw new Error("Request not found or you don't have permission to accept it");
    }

    // Check if request has expired
    if (new Date(request.expires_at) < new Date()) {
      throw new Error("This invitation has expired");
    }

    // Update the request to accepted status
    const { data, error } = await supabase
      .from("account_shares")
      .update({
        status: 'active',
        responded_at: new Date().toISOString()
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Failed to accept sharing request:", error);
      throw new Error("Failed to accept request");
    }

    console.log("Sharing request accepted successfully:", data);
    return data;

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
      .select()
      .single();

    if (error) {
      console.error("Failed to decline sharing request:", error);
      throw new Error("Failed to decline request");
    }

    console.log("Sharing request declined successfully:", data);
    return data;

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
