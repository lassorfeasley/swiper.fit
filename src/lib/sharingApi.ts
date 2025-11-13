import { supabase } from '@/supabaseClient';
import { postEmailEvent } from '@/lib/emailEvents';

/**
 * Consolidated Sharing API (client helper)
 * Handles all sharing-related operations including invitations, legacy shares, and permissions
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Permissions {
  can_create_routines?: boolean;
  can_start_workouts?: boolean;
  can_review_history?: boolean;
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AccountShare {
  id: string;
  owner_user_id: string;
  delegate_user_id?: string;
  delegate_email?: string;
  status: string;
  request_type: string;
  expires_at: string;
  can_create_routines: boolean;
  can_start_workouts: boolean;
  can_review_history: boolean;
  profiles?: Profile; // Added for invitation sender profile data
}

// ============================================================================
// INVITATION FUNCTIONS
// ============================================================================

/**
 * Invites a client to be managed by a trainer.
 * Creates an invitation where the trainer will manage the client's account.
 * 
 * Relationship created: owner=trainer, delegate=client
 * This means the trainer (owner) manages the client's (delegate) account.
 * 
 * @param clientEmail - Email of the client to invite
 * @param trainerId - ID of the trainer sending the invitation (will be the owner)
 * @param permissions - Permissions to grant the trainer
 */
export async function inviteClientToBeManaged(
  clientEmail: string, 
  trainerId: string, 
  permissions: Permissions = {}
): Promise<void> {
  try {
    // Fetch the trainer's (inviter's) profile
    const { data: trainerProfiles, error: trainerProfileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", trainerId)
      .limit(1);

    if (trainerProfileError || !trainerProfiles?.length) {
      console.error("Trainer profile lookup error:", trainerProfileError);
      throw new Error("Failed to look up trainer profile");
    }

    const trainerProfile = trainerProfiles[0] as Profile;
    
    // Get trainer email from profile or auth user
    let trainerEmail = trainerProfile.email;
    if (!trainerEmail) {
      // If profile doesn't have email, get it from auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || authUser.id !== trainerId) {
        throw new Error("Trainer profile is missing an email address and cannot be retrieved from authentication");
      }
      trainerEmail = authUser.email || null;
      if (!trainerEmail) {
        throw new Error("Trainer account is missing an email address");
      }
    }
    
    const inviterName = `${trainerProfile.first_name} ${trainerProfile.last_name}`.trim() || trainerEmail;

    // VALIDATION: Prevent self-invitation by email
    const normalizedClientEmail = clientEmail.trim().toLowerCase();
    const normalizedTrainerEmail = trainerEmail.trim().toLowerCase();
    
    if (normalizedClientEmail === normalizedTrainerEmail) {
      throw new Error("You cannot invite yourself");
    }

    // Fetch the client's (invitee's) profile
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
      console.log(`[inviteClientToBeManaged] No user found, creating non-member invitation for: ${clientEmail}`);
      
      // Check for existing pending invitation by email, regardless of request_type
      // This catches old incorrect records and prevents duplicates
      const normalizedClientEmail = clientEmail.trim().toLowerCase();
      
      const { count: pendingDupCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", trainerId)
        .eq("delegate_email", normalizedClientEmail)
        .eq("status", "pending")
        .is("revoked_at", null);
      
      if ((pendingDupCount || 0) > 0) {
        console.log(`[inviteClientToBeManaged] Duplicate pending invitation found for email ${normalizedClientEmail}`);
        throw new Error("A pending invitation already exists for this email");
      }

      const invitationData: Partial<AccountShare> = {
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

      const { error: insertError } = await supabase
        .from("account_shares")
        .insert(invitationData);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to create invitation");
      }

      // Send email notification for non-member (join invitation)
      await postEmailEvent('join.trainer-invitation', clientEmail, {
        inviter_name: inviterName,
        email: clientEmail,
        permissions: invitationData
      });

      return;
    }

    // User exists, create member invitation
    const clientProfile = profiles[0] as Profile;
    
    // Use the clientEmail parameter (we looked them up by this email)
    // But verify the profile has it or use the parameter
    const clientEmailToUse = clientProfile.email || clientEmail.trim().toLowerCase();
    
    console.log(`[inviteClientToBeManaged] User found, creating member invitation for: ${clientEmailToUse}`);

    // VALIDATION: Prevent self-invitation by ID
    if (clientProfile.id === trainerId) {
      throw new Error("You cannot invite yourself");
    }

    // Check for existing pending invitation in BOTH directions, regardless of request_type
    // This catches old incorrect records and prevents duplicates
    const { count: pendingDupCount } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .or(`and(owner_user_id.eq.${trainerId},delegate_user_id.eq.${clientProfile.id}),and(owner_user_id.eq.${clientProfile.id},delegate_user_id.eq.${trainerId})`)
      .eq("status", "pending")
      .is("revoked_at", null);
    
    if ((pendingDupCount || 0) > 0) {
      console.log(`[inviteClientToBeManaged] Duplicate pending invitation found between trainer ${trainerId} and client ${clientProfile.id}`);
      throw new Error("A pending invitation already exists for this user");
    }

    // Check for existing active relationship in the same direction (prevent duplicates)
    const { count: activeInSameDirection } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", trainerId)
      .eq("delegate_user_id", clientProfile.id)
      .eq("status", "active")
      .is("revoked_at", null);

    if ((activeInSameDirection || 0) > 0) {
      throw new Error("An active sharing relationship already exists with this user");
    }

    const invitationData: Partial<AccountShare> = {
      owner_user_id: trainerId,
      delegate_user_id: clientProfile.id,
      delegate_email: clientEmailToUse,
      status: 'pending',
      request_type: 'trainer_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    const { error: insertError } = await supabase
      .from("account_shares")
      .insert(invitationData);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create invitation");
    }

    // Send email notification for existing member
    await postEmailEvent('trainer.invitation', clientEmailToUse, {
      inviter_name: inviterName,
      permissions: invitationData
    });

  } catch (error) {
    console.error("inviteClientToBeManaged error:", error);
    throw error;
  }
}

/**
 * Invites a trainer to manage a client's account.
 * Creates an invitation where the trainer will manage the client's account.
 * 
 * Relationship created: owner=client, delegate=trainer
 * This means the trainer (delegate) manages the client's (owner) account.
 * 
 * @param trainerEmail - Email of the trainer to invite
 * @param clientId - ID of the client sending the invitation (will be the owner)
 * @param permissions - Permissions to grant the trainer
 */
export async function inviteTrainerToManage(
  trainerEmail: string, 
  clientId: string, 
  permissions: Permissions = {}
): Promise<void> {
  try {
    // Fetch the client's (inviter's) profile
    const { data: clientProfiles, error: clientProfileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", clientId)
      .limit(1);

    if (clientProfileError || !clientProfiles?.length) {
      console.error("Client profile lookup error:", clientProfileError);
      throw new Error("Failed to look up client profile");
    }

    const clientProfile = clientProfiles[0] as Profile;
    
    // Get client email from profile or auth user
    let clientEmail = clientProfile.email;
    if (!clientEmail) {
      // If profile doesn't have email, get it from auth user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || authUser.id !== clientId) {
        throw new Error("Client profile is missing an email address and cannot be retrieved from authentication");
      }
      clientEmail = authUser.email || null;
      if (!clientEmail) {
        throw new Error("Client account is missing an email address");
      }
    }
    
    const inviterName = `${clientProfile.first_name} ${clientProfile.last_name}`.trim() || clientEmail;

    // VALIDATION: Prevent self-invitation by email
    const normalizedTrainerEmail = trainerEmail.trim().toLowerCase();
    const normalizedClientEmail = clientEmail.trim().toLowerCase();
    
    if (normalizedTrainerEmail === normalizedClientEmail) {
      throw new Error("You cannot invite yourself");
    }

    // Fetch the trainer's (invitee's) profile
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("email", trainerEmail.trim().toLowerCase())
      .limit(1);

    if (profileError) {
      console.error("Profile lookup error:", profileError);
      throw new Error("Failed to look up trainer");
    }

    if (!profiles?.length) {
      console.log(`[inviteTrainerToManage] No trainer found, creating non-member invitation for: ${trainerEmail}`);
      const { count: pendingDupCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", clientId)
        .is("delegate_user_id", null)
        .eq("delegate_email", trainerEmail.trim().toLowerCase())
        .eq("request_type", "client_invite")
        .eq("status", "pending")
        .is("revoked_at", null);
      if ((pendingDupCount || 0) > 0) {
        throw new Error("A pending invitation already exists for this email");
      }

      const invitationData: Partial<AccountShare> = {
        owner_user_id: clientId, // The client (person inviting) is the owner
        delegate_user_id: null,
        delegate_email: trainerEmail.trim().toLowerCase(), // The trainer (person being invited) is the delegate
        status: 'pending',
        request_type: 'client_invite',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        can_create_routines: permissions.can_create_routines || false,
        can_start_workouts: permissions.can_start_workouts || false,
        can_review_history: permissions.can_review_history || false,
      };

      const { error: insertError } = await supabase
        .from("account_shares")
        .insert(invitationData);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to create invitation");
      }

      // Send email notification for non-member (join invitation)
      await postEmailEvent('join.client-invitation', trainerEmail, {
        inviter_name: inviterName,
        email: trainerEmail,
        permissions: invitationData
      });

      return;
    }

    // Trainer exists, create member invitation
    const trainerProfile = profiles[0] as Profile;
    
    // Use the trainerEmail parameter (we looked them up by this email)
    // But verify the profile has it or use the parameter
    const trainerEmailToUse = trainerProfile.email || trainerEmail.trim().toLowerCase();
    
    console.log(`[inviteTrainerToManage] Trainer found, creating member invitation for: ${trainerEmailToUse}`);

    // VALIDATION: Prevent self-invitation by ID
    if (trainerProfile.id === clientId) {
      throw new Error("You cannot invite yourself");
    }

    // Check for existing pending invitation (excluding revoked ones)
    const { count: pendingDupCount } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", trainerProfile.id)
      .eq("request_type", "client_invite")
      .eq("status", "pending")
      .is("revoked_at", null);
    
    if ((pendingDupCount || 0) > 0) {
      throw new Error("A pending invitation already exists for this trainer");
    }

    // Check for existing active relationship in the same direction (prevent duplicates)
    const { count: activeInSameDirection } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", clientId)
      .eq("delegate_user_id", trainerProfile.id)
      .eq("status", "active")
      .is("revoked_at", null);

    if ((activeInSameDirection || 0) > 0) {
      throw new Error("An active sharing relationship already exists with this trainer");
    }

    const invitationData: Partial<AccountShare> = {
      owner_user_id: clientId,
      delegate_user_id: trainerProfile.id,
      delegate_email: trainerEmailToUse,
      status: 'pending',
      request_type: 'client_invite',
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    const { error: insertError } = await supabase
      .from("account_shares")
      .insert(invitationData);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to create invitation");
    }

    // Send email notification for existing member
    await postEmailEvent('client.invitation', trainerEmailToUse, {
      inviter_name: inviterName,
      permissions: invitationData
    });

  } catch (error) {
    console.error("inviteTrainerToManage error:", error);
    throw error;
  }
}

export async function acceptInvitation(invitationId: string): Promise<void> {
  try {
    // First, get the invitation details to check for conflicts
    const { data: invitation, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (fetchError) {
      console.error("Error fetching invitation:", fetchError);
      throw new Error("Failed to fetch invitation");
    }

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    // Get current user to validate they're the delegate
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    // VALIDATION: Only delegate can accept
    const isDelegate = invitation.delegate_user_id === currentUser.id;
    const isOwner = invitation.owner_user_id === currentUser.id;

    if (!isDelegate) {
      throw new Error("Only the person being invited can accept this invitation");
    }

    if (isOwner) {
      throw new Error("You cannot accept your own invitation");
    }

    // Check if there's already an active relationship in the same direction (prevent duplicates)
    if (invitation.delegate_user_id) {
      // Check for existing relationship in the same direction
      const { count: sameDirectionCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", invitation.owner_user_id)
        .eq("delegate_user_id", invitation.delegate_user_id)
        .eq("status", "active")
        .is("revoked_at", null);

      if ((sameDirectionCount || 0) > 0) {
        // There's already an active relationship, just update the invitation to declined
        const { error: updateError } = await supabase
          .from("account_shares")
          .update({ status: 'declined' })
          .eq("id", invitationId);

        if (updateError) {
          console.error("Error updating invitation to declined:", updateError);
          throw new Error("Failed to update invitation");
        }
        
        throw new Error("An active sharing relationship already exists in this direction.");
      }
    }

    // No conflict, proceed with accepting the invitation
    const { error } = await supabase
      .from("account_shares")
      .update({ status: 'active' })
      .eq("id", invitationId);

    if (error) {
      console.error("Accept invitation error:", error);
      throw new Error("Failed to accept invitation");
    }
  } catch (error) {
    console.error("acceptInvitation error:", error);
    throw error;
  }
}

export async function rejectInvitation(invitationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("account_shares")
      .update({ status: 'declined' })
      .eq("id", invitationId);

    if (error) {
      console.error("Reject invitation error:", error);
      throw new Error("Failed to reject invitation");
    }
  } catch (error) {
    console.error("rejectInvitation error:", error);
    throw error;
  }
}

// ============================================================================
// LEGACY SHARING FUNCTIONS
// ============================================================================

export async function createShare(
  ownerId: string, 
  delegateId: string, 
  permissions: Permissions = {}
): Promise<void> {
  try {
    const shareData: Partial<AccountShare> = {
      owner_user_id: ownerId,
      delegate_user_id: delegateId,
      status: 'active',
      request_type: 'legacy_share',
      can_create_routines: permissions.can_create_routines || false,
      can_start_workouts: permissions.can_start_workouts || false,
      can_review_history: permissions.can_review_history || false,
    };

    const { error } = await supabase
      .from("account_shares")
      .insert(shareData);

    if (error) {
      console.error("Create share error:", error);
      throw new Error("Failed to create share");
    }
  } catch (error) {
    console.error("createShare error:", error);
    throw error;
  }
}

export async function updateSharePermissions(
  shareId: string, 
  permissions: Permissions
): Promise<void> {
  try {
    const { error } = await supabase
      .from("account_shares")
      .update({
        can_create_routines: permissions.can_create_routines || false,
        can_start_workouts: permissions.can_start_workouts || false,
        can_review_history: permissions.can_review_history || false,
      })
      .eq("id", shareId);

    if (error) {
      console.error("Update share permissions error:", error);
      throw new Error("Failed to update share permissions");
    }
  } catch (error) {
    console.error("updateSharePermissions error:", error);
    throw error;
  }
}

export async function removeShare(shareId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("account_shares")
      .delete()
      .eq("id", shareId);

    if (error) {
      console.error("Remove share error:", error);
      throw new Error("Failed to remove share");
    }
  } catch (error) {
    console.error("removeShare error:", error);
    throw error;
  }
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

export async function getPendingInvitations(userId: string): Promise<AccountShare[]> {
  try {
    // ONLY get invitations where user is the delegate (being invited)
    // NOT where user is the owner (they sent the invitation - those are outgoing)
    const { data, error } = await supabase
      .from("account_shares")
      .select(`
        *,
        profiles!account_shares_owner_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("delegate_user_id", userId)
      .neq("owner_user_id", userId)  // Extra safety: exclude self-invitations
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get pending invitations error:", error);
      throw new Error("Failed to get pending invitations");
    }

    return data || [];
  } catch (error) {
    console.error("getPendingInvitations error:", error);
    throw error;
  }
}

export async function getAccountShares(userId: string): Promise<AccountShare[]> {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .select("*")
      .or(`owner_user_id.eq.${userId},delegate_user_id.eq.${userId}`)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get account shares error:", error);
      throw new Error("Failed to get account shares");
    }

    return data || [];
  } catch (error) {
    console.error("getAccountShares error:", error);
    throw error;
  }
}

export async function getSharedAccounts(userId: string): Promise<AccountShare[]> {
  try {
    const { data, error } = await supabase
      .from("account_shares")
      .select("*")
      .eq("delegate_user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get shared accounts error:", error);
      throw new Error("Failed to get shared accounts");
    }

    return data || [];
  } catch (error) {
    console.error("getSharedAccounts error:", error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function hasPermission(
  share: AccountShare, 
  permission: keyof Permissions
): boolean {
  return share[permission] || false;
}

export function canCreateRoutines(share: AccountShare): boolean {
  return hasPermission(share, 'can_create_routines');
}

export function canStartWorkouts(share: AccountShare): boolean {
  return hasPermission(share, 'can_start_workouts');
}

export function canReviewHistory(share: AccountShare): boolean {
  return hasPermission(share, 'can_review_history');
}

export function isExpired(share: AccountShare): boolean {
  return new Date(share.expires_at) < new Date();
}

export function isPending(share: AccountShare): boolean {
  return share.status === 'pending';
}

export function isAccepted(share: AccountShare): boolean {
  return share.status === 'active';
}

export function isRejected(share: AccountShare): boolean {
  return share.status === 'declined';
}

// ============================================================================
// ACCOUNT LINKING FUNCTIONS
// ============================================================================

export async function linkPendingInvitations(userId: string, email: string): Promise<number> {
  try {
    // Find all pending invitations for this email
    const { data: pendingInvitations, error: fetchError } = await supabase
      .from("account_shares")
      .select("*")
      .eq("delegate_email", email)
      .eq("status", "pending");

    if (fetchError) {
      console.error("Error fetching pending invitations:", fetchError);
      return 0;
    }

    if (!pendingInvitations || pendingInvitations.length === 0) {
      return 0;
    }

    // Update all pending invitations to link them to the new user
    const { error: updateError } = await supabase
      .from("account_shares")
      .update({ 
        delegate_user_id: userId,
        status: "active"
      })
      .eq("delegate_email", email)
      .eq("status", "pending");

    if (updateError) {
      console.error("Error linking pending invitations:", updateError);
      return 0;
    }

    return pendingInvitations.length;
  } catch (error) {
    console.error("linkPendingInvitations error:", error);
    return 0;
  }
}
