import { supabase } from '@/supabaseClient';
import { postEmailEvent } from '@/lib/emailEvents';

/**
 * Consolidated Sharing API (client helper)
 * Handles all sharing-related operations including invitations, legacy shares, and permissions
 */

// ============================================================================
// INVITATION FUNCTIONS
// ============================================================================

export async function createTrainerInvite(clientEmail, trainerId, permissions = {}) {
  try {
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
      console.log(`[createTrainerInvite] No user found, creating non-member invitation for: ${clientEmail}`);
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
        owner_user_id: trainerId,
        delegate_user_id: null,
        delegate_email: clientEmail.trim().toLowerCase(),
        status: 'pending',
        request_type: 'trainer_invite',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
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

      try {
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
      } catch (emailError) {
        console.error("Failed to send non-member trainer invitation email:", emailError);
      }

      return { ...data, clientProfile: null, isNonMember: true };
    }

    const clientProfile = profiles[0];
    const clientId = clientProfile.id;
    if (clientId === trainerId) {
      throw new Error("You cannot invite yourself");
    }

    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at, request_type")
      .eq("owner_user_id", trainerId)
      .eq("delegate_user_id", clientId)
      .in("status", ["pending", "active"]) 
      .limit(1);

    if (existingError) {
      console.error("Existing shares check error:", existingError);
      throw new Error("Failed to check existing shares");
    }
    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      if (existingShare.status === 'pending') throw new Error("A pending invitation already exists");
      if (existingShare.status === 'active' && existingShare.request_type === 'trainer_invite') {
        throw new Error("Access already shared with this user");
      }
    }

    const invitationData = {
      owner_user_id: trainerId,
      delegate_user_id: clientId,
      delegate_email: clientEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'trainer_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    const { data, error } = await supabase
      .from("account_shares")
      .insert(invitationData)
      .select()
      .single();
    if (error) throw new Error("Failed to create invitation");

    try {
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
        expires_in_days: 14,
      });
    } catch (emailError) {
      console.error("Failed to send trainer invitation email:", emailError);
    }
    return { ...data, clientProfile };
  } catch (error) {
    console.error("Error creating trainer invitation:", error);
    throw error;
  }
}

export async function createClientInvite(trainerEmail, clientId, permissions = {}) {
  try {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("email", trainerEmail.trim().toLowerCase())
      .limit(1);
    if (profileError) throw new Error("Failed to look up user");

    if (!profiles?.length) {
      console.log(`[createClientInvite] No user found, creating non-member invitation for: ${trainerEmail}`);
      const { count: pendingDupCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", clientId)
        .is("delegate_user_id", null)
        .eq("delegate_email", trainerEmail.trim().toLowerCase())
        .eq("request_type", "client_invite")
        .eq("status", "pending");
      if ((pendingDupCount || 0) > 0) throw new Error("A pending invitation already exists for this email");

      const invitationData = {
        owner_user_id: clientId,
        delegate_user_id: null,
        delegate_email: trainerEmail.trim().toLowerCase(),
        status: 'pending',
        request_type: 'client_invite',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        can_create_routines: permissions.can_create_routines || false,
        can_start_workouts: permissions.can_start_workouts || false,
        can_review_history: permissions.can_review_history || false,
      };
      const { data, error } = await supabase
        .from("account_shares")
        .insert(invitationData)
        .select()
        .single();
      if (error) throw new Error("Failed to create invitation");

      try {
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
      } catch (emailError) {
        console.error("Failed to send non-member client invitation email:", emailError);
      }
      return { ...data, trainerProfile: null, isNonMember: true };
    }

    const trainerProfile = profiles[0];
    const trainerId = trainerProfile.id;
    if (trainerId === clientId) throw new Error("You cannot invite yourself");

    const { data: existingShares, error: existingError } = await supabase
      .from("account_shares")
      .select("id, status, revoked_at, request_type")
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", trainerId)
      .in("status", ["pending", "active"]) 
      .limit(1);
    if (existingError) throw new Error("Failed to check existing shares");
    if (existingShares?.length > 0) {
      const existingShare = existingShares[0];
      if (existingShare.status === 'pending') throw new Error("A pending invitation already exists");
      if (existingShare.status === 'active' && existingShare.request_type === 'client_invite') {
        throw new Error("Access already shared with this user");
      }
    }

    const invitationData = {
      owner_user_id: clientId,
      delegate_user_id: trainerId,
      delegate_email: trainerEmail.trim().toLowerCase(),
      status: 'pending',
      request_type: 'client_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };
    const { data, error } = await supabase
      .from("account_shares")
      .insert(invitationData)
      .select()
      .single();
    if (error) throw new Error("Failed to create invitation");

    try {
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
        expires_in_days: 14,
      });
    } catch (emailError) {
      console.error("Failed to send client invitation email:", emailError);
    }
    return { ...data, trainerProfile };
  } catch (error) {
    console.error("Error creating client invitation:", error);
    throw error;
  }
}

export async function acceptSharingRequest(requestId, userId) {
  try {
    const { data: request, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .single();
    if (fetchError || !request) throw new Error("Request not found or you don't have permission to accept it");
    if (new Date(request.expires_at) < new Date()) throw new Error("This invitation has expired");

    const { data, error } = await supabase
      .from("account_shares")
      .update({ status: 'active', responded_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .select();
    if (error) throw new Error("Failed to accept request");

    if (!data || data.length === 0) {
      const { data: altData, error: altError } = await supabase
        .from("account_shares")
        .update({ status: 'active', responded_at: new Date().toISOString() })
        .eq("id", requestId)
        .eq("delegate_user_id", userId)
        .select();
      if (altError || !altData || altData.length === 0) throw new Error("Request not found or already processed");
      return altData[0];
    }
    return data[0];
  } catch (error) {
    console.error("Error accepting sharing request:", error);
    throw error;
  }
}

export async function declineSharingRequest(requestId, userId) {
  try {
    const { data: request, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .single();
    if (fetchError || !request) throw new Error("Request not found or you don't have permission to decline it");

    const { data, error } = await supabase
      .from("account_shares")
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .select();
    if (error) throw new Error("Failed to decline request");
    if (!data || data.length === 0) throw new Error("Request not found or already processed");
    return data[0];
  } catch (error) {
    console.error("Error declining sharing request:", error);
    throw error;
  }
}

export async function getPendingRequests(userId) {
  try {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();
    if (profileError) throw new Error("Failed to get user profile");
    const userEmail = userProfile?.email;

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
    if (error) throw new Error("Failed to fetch pending requests");

    const requestsWithProfiles = await Promise.all(
      requests.map(async (request) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email")
          .eq("id", request.owner_user_id)
          .single();
        return { ...request, profiles: profile };
      })
    );
    return requestsWithProfiles;
  } catch (error) {
    console.error("Failed to fetch pending requests:", error);
    throw new Error("Failed to fetch pending requests");
  }
}

export async function getPendingRequestCount(userId) {
  try {
    const { count, error } = await supabase
      .from("account_shares")
      .select("*", { count: 'exact', head: true })
      .eq("delegate_user_id", userId)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());
    if (error) throw new Error("Failed to fetch pending request count");
    return count || 0;
  } catch (error) {
    console.error("Error fetching pending request count:", error);
    throw error;
  }
}

export async function createLegacyShare(shareData) {
  try {
    const legacyShareData = { ...shareData, status: 'active', request_type: 'legacy' };
    const { data, error } = await supabase
      .from("account_shares")
      .insert(legacyShareData)
      .select()
      .single();
    if (error) throw new Error("Failed to create share");
    return data;
  } catch (error) {
    console.error("Error creating legacy share:", error);
    throw error;
  }
}

export async function updateSharePermissions(shareId, permissions) {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .update(permissions)
      .eq("id", shareId)
      .select()
      .single();
    if (error) throw new Error("Failed to update permissions");
    return data;
  } catch (error) {
    console.error("Error updating share permissions:", error);
    throw error;
  }
}

export async function revokeShare(shareId) {
  try {
    const { error } = await supabase
      .from("account_shares")
      .update({ status: 'revoked', revoked_at: new Date().toISOString() })
      .eq("id", shareId);
    if (error) throw new Error("Failed to revoke share");
  } catch (error) {
    console.error("Error revoking share:", error);
    throw error;
  }
}

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
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch owned shares");
    return shares;
  } catch (error) {
    console.error("Error fetching owned shares:", error);
    throw error;
  }
}

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
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Failed to fetch delegate shares");

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

    const sharesWithActiveWorkouts = shares.map(share => ({
      ...share,
      activeWorkout: activeByOwner[share.owner_user_id] || null
    }));
    return sharesWithActiveWorkouts;
  } catch (error) {
    console.error("Error fetching delegate shares:", error);
    throw error;
  }
}

export async function getAllSharingRelationships(userId) {
  try {
    const [ownedShares, delegateShares, pendingRequests] = await Promise.all([
      getOwnedShares(userId),
      getDelegateShares(userId),
      getPendingRequests(userId)
    ]);
    return { ownedShares, delegateShares, pendingRequests };
  } catch (error) {
    console.error("Error fetching all sharing relationships:", error);
    throw error;
  }
}

