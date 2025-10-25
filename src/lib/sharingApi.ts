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

export async function createTrainerInvite(
  clientEmail: string, 
  trainerId: string, 
  permissions: Permissions = {}
): Promise<void> {
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
        .eq("status", "pending")
        .is("revoked_at", null);
      if ((pendingDupCount || 0) > 0) {
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

      // Send email notification
      await postEmailEvent('trainer_invitation', clientEmail, {
        trainer_id: trainerId,
        permissions: invitationData
      });

      return;
    }

    // User exists, create member invitation
    const clientProfile = profiles[0] as Profile;
    console.log(`[createTrainerInvite] User found, creating member invitation for: ${clientProfile.email}`);

    // Check for existing pending invitation (excluding revoked ones)
    const { count: pendingDupCount } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", trainerId)
      .eq("delegate_user_id", clientProfile.id)
      .eq("request_type", "trainer_invite")
      .eq("status", "pending")
      .is("revoked_at", null);
    
    if ((pendingDupCount || 0) > 0) {
      throw new Error("A pending invitation already exists for this user");
    }

    const invitationData: Partial<AccountShare> = {
      owner_user_id: trainerId,
      delegate_user_id: clientProfile.id,
      delegate_email: clientProfile.email,
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

    // Send email notification
    await postEmailEvent('trainer_invitation', clientProfile.email, {
      trainer_id: trainerId,
      client_profile: clientProfile,
      permissions: invitationData
    });

  } catch (error) {
    console.error("createTrainerInvite error:", error);
    throw error;
  }
}

export async function createClientInvite(
  trainerEmail: string, 
  clientId: string, 
  permissions: Permissions = {}
): Promise<void> {
  try {
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
      console.log(`[createClientInvite] No trainer found, creating non-member invitation for: ${trainerEmail}`);
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

      // Send email notification
      await postEmailEvent('client_invitation', trainerEmail, {
        client_id: clientId,
        permissions: invitationData
      });

      return;
    }

    // Trainer exists, create member invitation
    const trainerProfile = profiles[0] as Profile;
    console.log(`[createClientInvite] Trainer found, creating member invitation for: ${trainerProfile.email}`);

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

    const invitationData: Partial<AccountShare> = {
      owner_user_id: clientId,
      delegate_user_id: trainerProfile.id,
      delegate_email: trainerProfile.email,
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

    // Send email notification
    await postEmailEvent('client_invitation', trainerProfile.email, {
      client_id: clientId,
      trainer_profile: trainerProfile,
      permissions: invitationData
    });

  } catch (error) {
    console.error("createClientInvite error:", error);
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

    // Check if there's already an active relationship between these users (excluding revoked ones)
    if (invitation.delegate_user_id) {
      const { count: existingCount } = await supabase
        .from("account_shares")
        .select("id", { count: "exact", head: true })
        .eq("owner_user_id", invitation.owner_user_id)
        .eq("delegate_user_id", invitation.delegate_user_id)
        .eq("request_type", invitation.request_type)
        .eq("status", "active")
        .is("revoked_at", null);

      if ((existingCount || 0) > 0) {
        // There's already an active relationship, just update the invitation to declined
        const { error: updateError } = await supabase
          .from("account_shares")
          .update({ status: 'declined' })
          .eq("id", invitationId);

        if (updateError) {
          console.error("Error updating invitation to declined:", updateError);
          throw new Error("Failed to update invitation");
        }
        return; // Exit early since relationship already exists
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
