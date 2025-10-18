import { supabase } from '@/supabaseClient';
import { postEmailEvent } from '@/lib/emailEvents';

/**
 * Consolidated Sharing API
 * Handles all sharing-related operations including invitations, legacy shares, and permissions
 */

// ============================================================================
// INVITATION FUNCTIONS
// ============================================================================

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
      // Non-member invitation - create invitation with null delegate_user_id
      console.log(`[createTrainerInvite] No user found, creating non-member invitation for: ${clientEmail}`);
      
      // Prevent duplicate pending non-member invites to the same email
      const { count: pendingDupCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", trainerId)
        .is("delegate_user_id", null)
        .eq("delegate_email", clientEmail.trim().toLowerCase())
        .eq("request_type", "trainer_invite")
        .eq("status", "pending");
      if ((pendingDupCount || 0) > 0) {
        throw new Error("A pending invitation already exists for this email");
      }
      
      const invitationData = {
        owner_user_id: trainerId, // Trainer (account manager) is the owner
        delegate_user_id: null, // No user ID yet - they need to sign up
        delegate_email: clientEmail.trim().toLowerCase(),
        status: 'pending',
        request_type: 'trainer_invite',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
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
        console.error("Failed to create non-member trainer invitation:", error);
        throw new Error("Failed to create invitation");
      }

      console.log("Non-member trainer invitation created successfully:", data);
      
      // Send join invitation email to non-member
      try {
        // Get the trainer's profile for the email
        const { data: trainerProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", trainerId)
          .single();
        
        const trainerName = trainerProfile ? 
          `${trainerProfile.first_name || ''} ${trainerProfile.last_name || ''}`.trim() || trainerProfile.email :
          'Someone';
        
        await postEmailEvent('join.trainer-invitation', clientEmail, {
          inviter_name: trainerName,
          inviter_email: trainerProfile?.email || '',
          email: clientEmail,
          permissions: {
            can_create_routines: permissions.can_create_routines || false,
            can_start_workouts: permissions.can_start_workouts || false,
            can_review_history: permissions.can_review_history || false,
          },
          expires_in_days: 14,
        });
        
        console.log("Non-member trainer invitation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send non-member trainer invitation email:", emailError);
        // Don't throw - invitation was created successfully, email is secondary
      }
      
      return {
        ...data,
        clientProfile: null, // No profile yet
        isNonMember: true
      };
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
      .in("status", ["pending", "active"]) 
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
      }
    }

    // Create the trainer invitation
    const invitationData = {
      owner_user_id: trainerId, // Trainer (account manager) is the owner (will manage client's account)
      delegate_user_id: clientId, // Client (account owner) is the delegate (will be managed)
      delegate_email: clientEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'trainer_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
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
    
    // Send email notification to the client
    try {
      // Get the trainer's profile for the email
      const { data: trainerProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", trainerId)
        .single();
      
      const trainerName = trainerProfile ? 
        `${trainerProfile.first_name || ''} ${trainerProfile.last_name || ''}`.trim() || trainerProfile.email :
        'Someone';
      
      await postEmailEvent('trainer.invitation', clientEmail, {
        inviter_name: trainerName,
        inviter_email: trainerProfile?.email || '',
        permissions: {
          can_create_routines: permissions.can_create_routines || false,
          can_start_workouts: permissions.can_start_workouts || false,
          can_review_history: permissions.can_review_history || false,
        },
        expires_in_days: 7,
      });
      
      console.log("Trainer invitation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send trainer invitation email:", emailError);
      // Don't throw - invitation was created successfully, email is secondary
    }
    
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
      // Non-member invitation - create invitation with null delegate_user_id
      console.log(`[createClientInvite] No user found, creating non-member invitation for: ${trainerEmail}`);
      
      // Prevent duplicate pending non-member invites to the same email
      const { count: pendingDupCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", clientId)
        .is("delegate_user_id", null)
        .eq("delegate_email", trainerEmail.trim().toLowerCase())
        .eq("request_type", "client_invite")
        .eq("status", "pending");
      if ((pendingDupCount || 0) > 0) {
        throw new Error("A pending invitation already exists for this email");
      }
      
      const invitationData = {
        owner_user_id: clientId, // Client (account owner) is the owner
        delegate_user_id: null, // No user ID yet - they need to sign up
        delegate_email: trainerEmail.trim().toLowerCase(),
        status: 'pending',
        request_type: 'client_invite',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
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
        console.error("Failed to create non-member client invitation:", error);
        throw new Error("Failed to create invitation");
      }

      console.log("Non-member client invitation created successfully:", data);
      
      // Send join invitation email to non-member
      try {
        // Get the client's profile for the email
        const { data: clientProfile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email")
          .eq("id", clientId)
          .single();
        
        const clientName = clientProfile ? 
          `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || clientProfile.email :
          'Someone';
        
        await postEmailEvent('join.client-invitation', trainerEmail, {
          inviter_name: clientName,
          inviter_email: clientProfile?.email || '',
          email: trainerEmail,
          permissions: {
            can_create_routines: permissions.can_create_routines || false,
            can_start_workouts: permissions.can_start_workouts || false,
            can_review_history: permissions.can_review_history || false,
          },
          expires_in_days: 14,
        });
        
        console.log("Non-member client invitation email sent successfully");
      } catch (emailError) {
        console.error("Failed to send non-member client invitation email:", emailError);
        // Don't throw - invitation was created successfully, email is secondary
      }
      
      return {
        ...data,
        trainerProfile: null, // No profile yet
        isNonMember: true
      };
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
      .in("status", ["pending", "active"]) 
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
      }
    }

    // Create the client invitation
    const invitationData = {
      owner_user_id: clientId, // Client (account owner) is the owner (will be managed)
      delegate_user_id: trainerId, // Trainer (account manager) is the delegate (will manage client's account)
      delegate_email: trainerEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'client_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
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
    
    // Send email notification to the trainer
    try {
      // Get the client's profile for the email
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", clientId)
        .single();
      
      const clientName = clientProfile ? 
        `${clientProfile.first_name || ''} ${clientProfile.last_name || ''}`.trim() || clientProfile.email :
        'Someone';
      
      await postEmailEvent('client.invitation', trainerEmail, {
        inviter_name: clientName,
        inviter_email: clientProfile?.email || '',
        permissions: {
          can_create_routines: permissions.can_create_routines || false,
          can_start_workouts: permissions.can_start_workouts || false,
          can_review_history: permissions.can_review_history || false,
        },
        expires_in_days: 7,
      });
      
      console.log("Client invitation email sent successfully");
    } catch (emailError) {
      console.error("Failed to send client invitation email:", emailError);
      // Don't throw - invitation was created successfully, email is secondary
    }
    
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
    // Get the user's email to find non-member invitations
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Failed to get user profile:", profileError);
      throw new Error("Failed to get user profile");
    }

    const userEmail = userProfile?.email;

    // Query for both member and non-member invitations
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
      .or(`delegate_user_id.eq.${userId},and(delegate_user_id.is.null,delegate_email.eq.${userEmail})`)
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

// ============================================================================
// LEGACY SHARING FUNCTIONS
// ============================================================================

/**
 * Creates a legacy share (immediate sharing without invitation)
 * This maintains backward compatibility with the existing sharing system
 * @param {object} shareData - Share data including owner_user_id, delegate_user_id, etc.
 * @returns {Promise<object>} Created share data
 */
export async function createLegacyShare(shareData) {
  try {
    const legacyShareData = {
      ...shareData,
      status: 'active',
      request_type: 'legacy'
    };

    const { data, error } = await supabase
      .from("account_shares")
      .insert(legacyShareData)
      .select()
      .single();

    if (error) {
      console.error("Failed to create legacy share:", error);
      throw new Error("Failed to create share");
    }

    console.log("Legacy share created successfully:", data);
    return data;

  } catch (error) {
    console.error("Error creating legacy share:", error);
    throw error;
  }
}

/**
 * Updates share permissions
 * @param {string} shareId - ID of the share to update
 * @param {object} permissions - New permissions
 * @returns {Promise<object>} Updated share data
 */
export async function updateSharePermissions(shareId, permissions) {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .update(permissions)
      .eq("id", shareId)
      .select()
      .single();

    if (error) {
      console.error("Failed to update share permissions:", error);
      throw new Error("Failed to update permissions");
    }

    console.log("Share permissions updated successfully:", data);
    return data;

  } catch (error) {
    console.error("Error updating share permissions:", error);
    throw error;
  }
}

/**
 * Revokes a share (soft delete)
 * @param {string} shareId - ID of the share to revoke
 * @returns {Promise<void>}
 */
export async function revokeShare(shareId) {
  try {
    const { error } = await supabase
      .from("account_shares")
      .update({ 
        status: 'revoked',
        revoked_at: new Date().toISOString()
      })
      .eq("id", shareId);

    if (error) {
      console.error("Failed to revoke share:", error);
      throw new Error("Failed to revoke share");
    }

    console.log("Share revoked successfully");

  } catch (error) {
    console.error("Error revoking share:", error);
    throw error;
  }
}

/**
 * Gets shares owned by a user (where user is the owner)
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of owned shares
 */
export async function getOwnedShares(userId) {
  try {
    const { data: shares, error } = await supabase
      .from("account_shares")
      .select(`
        id,
        owner_user_id,
        delegate_user_id,
        delegate_email,
        created_at,
        status,
        request_type,
        can_create_routines,
        can_start_workouts,
        can_review_history,
        profiles!account_shares_delegate_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("owner_user_id", userId)
      .eq("status", "active") // Only get active shares
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch owned shares:", error);
      throw new Error("Failed to fetch owned shares");
    }

    console.log("Owned shares fetched successfully:", shares);
    return shares;

  } catch (error) {
    console.error("Error fetching owned shares:", error);
    throw error;
  }
}

/**
 * Gets shares where user is the delegate (shared with user)
 * @param {string} userId - ID of the user
 * @returns {Promise<Array>} Array of shares where user is delegate
 */
export async function getDelegateShares(userId) {
  try {
    const { data: shares, error } = await supabase
      .from("account_shares")
      .select(`
        id,
        owner_user_id,
        created_at,
        status,
        request_type,
        can_create_routines,
        can_start_workouts,
        can_review_history,
        profiles!account_shares_owner_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("delegate_user_id", userId)
      .eq("status", "active") // Only get active shares
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch delegate shares:", error);
      throw new Error("Failed to fetch delegate shares");
    }

    // Fetch active workouts for all owners
    let activeByOwner = {};
    if (shares && shares.length > 0) {
      const ownerIds = shares.map(share => share.owner_user_id);
      const { data: activeWorkouts, error: activeErr } = await supabase
        .from('workouts')
        .select(`id, user_id, routine_id, is_active, completed_at, routines!fk_workouts__routines(routine_name)`) 
        .in('user_id', ownerIds)
        .eq('is_active', true);
      
      if (!activeErr && Array.isArray(activeWorkouts)) {
        activeByOwner = activeWorkouts.reduce((acc, w) => {
          acc[w.user_id] = w;
          return acc;
        }, {});
      }
    }

    // Add active workout data to shares
    const sharesWithActiveWorkouts = shares.map(share => ({
      ...share,
      activeWorkout: activeByOwner[share.owner_user_id] || null
    }));

    console.log("Delegate shares fetched successfully:", sharesWithActiveWorkouts);
    return sharesWithActiveWorkouts;

  } catch (error) {
    console.error("Error fetching delegate shares:", error);
    throw error;
  }
}

/**
 * Checks if a user can manage another user's account
 * @param {string} managerId - ID of the potential manager
 * @param {string} clientId - ID of the client
 * @returns {Promise<boolean>} Whether the manager can manage the client
 */
export async function canManageAccount(managerId, clientId) {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .select("id")
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", managerId)
      .eq("status", "active")
      .limit(1);

    if (error) {
      console.error("Failed to check management permissions:", error);
      return false;
    }

    return data && data.length > 0;

  } catch (error) {
    console.error("Error checking management permissions:", error);
    return false;
  }
}

/**
 * Gets all sharing relationships for a user (both owned and delegated)
 * @param {string} userId - ID of the user
 * @returns {Promise<object>} Object with ownedShares and delegateShares
 */
export async function getAllSharingRelationships(userId) {
  try {
    const [ownedShares, delegateShares, pendingRequests] = await Promise.all([
      getOwnedShares(userId),
      getDelegateShares(userId),
      getPendingRequests(userId)
    ]);

    return {
      ownedShares,
      delegateShares,
      pendingRequests
    };
  } catch (error) {
    console.error("Error fetching all sharing relationships:", error);
    throw error;
  }
}

/**
 * Links pending invitations to a newly created user account
 * @param {string} userId - ID of the newly created user
 * @param {string} email - Email address of the user
 * @returns {Promise<number>} Count of linked invitations
 */
export async function linkPendingInvitations(userId, email) {
  try {
    console.log(`[linkPendingInvitations] Linking invitations for user ${userId} with email ${email}`);
    
    // Find all pending invitations for this email where delegate_user_id is null
    const { data: pendingInvitations, error: fetchError } = await supabase
      .from("account_shares")
      .select("id, owner_user_id, request_type, expires_at")
      .eq("delegate_email", email.trim().toLowerCase())
      .is("delegate_user_id", null)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Failed to fetch pending invitations:", fetchError);
      throw new Error("Failed to fetch pending invitations");
    }

    if (!pendingInvitations || pendingInvitations.length === 0) {
      console.log("No pending invitations found for this email");
      return 0;
    }

    // Filter out expired invitations
    const now = new Date();
    const validInvitations = pendingInvitations.filter(invitation => 
      new Date(invitation.expires_at) > now
    );

    if (validInvitations.length === 0) {
      console.log("All pending invitations have expired");
      return 0;
    }

    // Update all valid invitations to link them to the new user
    const { data: updatedInvitations, error: updateError } = await supabase
      .from("account_shares")
      .update({ delegate_user_id: userId })
      .in("id", validInvitations.map(inv => inv.id))
      .select();

    if (updateError) {
      console.error("Failed to link pending invitations:", updateError);
      throw new Error("Failed to link pending invitations");
    }

    console.log(`Successfully linked ${updatedInvitations.length} pending invitations`);
    return updatedInvitations.length;

  } catch (error) {
    console.error("Error linking pending invitations:", error);
    throw error;
  }
}
