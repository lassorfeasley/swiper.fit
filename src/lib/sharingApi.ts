import { supabase } from '@/supabaseClient';

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
  id?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
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
  owner_profile?: Profile | null;
  delegate_profile?: Profile | null;
  source?: 'legacy' | 'token';
  invite_token?: string;
}

function buildShareKey(input: {
  request_type: string;
  owner_user_id?: string | null;
  delegate_user_id?: string | null;
  delegate_email?: string | null;
}): string {
  const owner = input.owner_user_id || 'owner:unknown';
  const delegate = input.delegate_user_id || input.delegate_email || 'delegate:unknown';
  return `${input.request_type}:${owner}:${delegate}`.toLowerCase();
}

interface InvitationSummary {
  id: string;
  token?: string;
  inviter_id?: string;
  recipient_email: string;
  recipient_user_id?: string;
  intended_role: InvitationRole;
  status: string;
  expires_at: string;
  created_at: string;
  permissions: Permissions;
  inviter_profile?: Profile | null;
  recipient_profile?: Profile | null;
}

// ============================================================================
// INVITATION FUNCTIONS
// ============================================================================

type InvitationRole = 'manager' | 'managed';

interface InviteRequestPayload {
  inviteeEmail: string;
  intendedRole: InvitationRole;
  permissions: Permissions;
  mirror?: boolean;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizePermissions(permissions: Permissions = {}): Permissions {
  return {
    can_create_routines: !!permissions.can_create_routines,
    can_start_workouts: !!permissions.can_start_workouts,
    can_review_history: !!permissions.can_review_history,
  };
}

async function getSessionOrThrow() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  if (!data?.session?.access_token) {
    throw new Error("You must be logged in to send invitations");
  }
  return data.session;
}

async function postInvitationRequest(payload: InviteRequestPayload) {
  const session = await getSessionOrThrow();
  const response = await fetch('/api/sharing/invite', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      inviteeEmail: normalizeEmail(payload.inviteeEmail),
      intendedRole: payload.intendedRole,
      permissions: sanitizePermissions(payload.permissions),
      mirror: !!payload.mirror,
    }),
  });

  let body: any = null;
  try {
    const text = await response.text();
    body = text ? JSON.parse(text) : null;
  } catch (_) {
    body = null;
  }

  if (!response.ok) {
    const message = body?.error || body?.details || 'Failed to send invitation';
    throw new Error(message);
  }

  return body;
}

export async function inviteClientToBeManaged(
  clientEmail: string,
  _trainerId: string,
  permissions: Permissions = {},
  mirror: boolean = false,
): Promise<void> {
  await postInvitationRequest({
    inviteeEmail: clientEmail,
    intendedRole: 'managed',
    permissions,
    mirror,
  });
}

export async function inviteTrainerToManage(
  trainerEmail: string, 
  _clientId: string,
  permissions: Permissions = {},
  mirror: boolean = false,
): Promise<void> {
  await postInvitationRequest({
    inviteeEmail: trainerEmail,
    intendedRole: 'manager',
    permissions,
    mirror,
  });
}

async function fetchInvitationsFromApi(scope: 'incoming' | 'outgoing'): Promise<InvitationSummary[]> {
  const session = await getSessionOrThrow();
  const response = await fetch(`/api/sharing/invite?scope=${scope}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch (_) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.error || 'Failed to fetch invitations');
  }

  return body?.invitations || [];
}

export function getOutgoingInvitations(): Promise<InvitationSummary[]> {
  return fetchInvitationsFromApi('outgoing');
}

async function getIncomingInvitationSummaries(): Promise<InvitationSummary[]> {
  return fetchInvitationsFromApi('incoming');
}

export async function cancelInvitationRequest(invitationId: string): Promise<void> {
  const session = await getSessionOrThrow();
  const response = await fetch(`/api/sharing/invite?id=${invitationId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    let body: any = null;
    try {
      body = await response.json();
    } catch (_) {
      body = null;
    }
    throw new Error(body?.error || 'Failed to cancel invitation');
  }
}

export async function acceptTokenInvitation(inviteToken: string): Promise<void> {
  const { error } = await supabase.rpc('accept_invitation', { invite_token: inviteToken });
  if (error) {
    throw error;
  }
}

export async function declineTokenInvitation(inviteToken: string): Promise<void> {
  const { error } = await supabase.rpc('decline_invitation', { invite_token: inviteToken });
  if (error) {
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

    // VALIDATION: Check if user can accept this invitation
    const isDelegate = invitation.delegate_user_id === currentUser.id;
    const isOwner = invitation.owner_user_id === currentUser.id;
    
    // For trainer_invite, check if relationship is reversed (owner is trainer, delegate is client)
    // In this case, the client (delegate) should be the owner, and trainer should be delegate
    const isReversedTrainerInvite = invitation.request_type === 'trainer_invite' && 
                                     isDelegate && 
                                     !isOwner;

    if (!isDelegate && !isReversedTrainerInvite) {
      throw new Error("Only the person being invited can accept this invitation");
    }

    if (isOwner && !isReversedTrainerInvite) {
      throw new Error("You cannot accept your own invitation");
    }

    // Determine the correct final relationship
    let finalOwnerId = invitation.owner_user_id;
    let finalDelegateId = invitation.delegate_user_id;
    
    // If this is a reversed trainer_invite, swap the relationship
    if (isReversedTrainerInvite) {
      console.log("[acceptInvitation] Detected reversed trainer_invite relationship, correcting it");
      finalOwnerId = currentUser.id; // Client becomes owner
      finalDelegateId = invitation.owner_user_id; // Trainer becomes delegate
    }

    // Check if there's already an active relationship in the correct direction (prevent duplicates)
    const { count: sameDirectionCount } = await supabase
      .from("account_shares")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", finalOwnerId)
      .eq("delegate_user_id", finalDelegateId)
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

    // Accept the invitation and fix the relationship if needed
    const updateData: any = { status: 'active' };
    
    // If relationship needs to be corrected, update owner and delegate
    if (isReversedTrainerInvite) {
      updateData.owner_user_id = finalOwnerId;
      updateData.delegate_user_id = finalDelegateId;
    }
    
    const { error } = await supabase
      .from("account_shares")
      .update(updateData)
      .eq("id", invitationId);

    if (error) {
      console.error("Accept invitation error:", error);
      throw new Error("Failed to accept invitation");
    }
    
    if (isReversedTrainerInvite) {
      console.log("[acceptInvitation] Successfully corrected and accepted reversed trainer_invite");
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
    const [legacyInvites, tokenInvites] = await Promise.all([
      fetchLegacyPendingInvitations(userId),
      mapIncomingTokenInvitations(userId),
    ]);

    const tokenKeys = new Set(tokenInvites.map((invite) => buildShareKey(invite)));
    const filteredLegacy = legacyInvites.filter((invite) => !tokenKeys.has(buildShareKey(invite)));

    return [...filteredLegacy, ...tokenInvites];
  } catch (error) {
    console.error("getPendingInvitations error:", error);
    throw error;
  }
}

async function fetchLegacyPendingInvitations(userId: string): Promise<AccountShare[]> {
    const { data, error } = await supabase
      .from("account_shares")
      .select(`
        *,
        owner_profile:profiles!account_shares_owner_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        delegate_profile:profiles!account_shares_delegate_user_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq("status", "pending")
      .or(
        [
          `and(request_type.eq.trainer_invite,owner_user_id.eq.${userId})`,
          `and(request_type.eq.client_invite,delegate_user_id.eq.${userId})`,
          `and(request_type.eq.legacy,delegate_user_id.eq.${userId})`,
      ].join(","),
      )
      .order("created_at", { ascending: false });

    if (error) {
    console.error("Get legacy pending invitations error:", error);
      throw new Error("Failed to get pending invitations");
    }

  const invitations = (data || []).map((inv) => ({
    ...inv,
    source: 'legacy' as const,
  }));

    console.log(
    "[getPendingInvitations] Found legacy invitations:",
      invitations.map((inv) => ({
        id: inv.id,
        owner_user_id: inv.owner_user_id,
        delegate_user_id: inv.delegate_user_id,
        request_type: inv.request_type,
        owner_profile: (inv as any).owner_profile,
        delegate_profile: (inv as any).delegate_profile,
      }))
    );

    return invitations;
}

async function mapIncomingTokenInvitations(userId: string): Promise<AccountShare[]> {
  try {
    const tokenInvites = await getIncomingInvitationSummaries();
    return tokenInvites.map((invite) => mapTokenInviteToShare(invite, userId));
  } catch (error) {
    console.error("[mapIncomingTokenInvitations] Failed to fetch token invitations", error);
    throw error;
  }
}

function mapTokenInviteToShare(invite: InvitationSummary, currentUserId: string): AccountShare {
  const requestType = invite.intended_role === 'manager' ? 'trainer_invite' : 'client_invite';
  const permissions = invite.permissions || {};
  const baseShare: AccountShare = {
    id: invite.id,
    owner_user_id: requestType === 'trainer_invite' ? currentUserId : (invite.inviter_id || ''),
    delegate_user_id: requestType === 'trainer_invite' ? (invite.inviter_id || '') : currentUserId,
    delegate_email: invite.recipient_email,
    status: invite.status,
    request_type: requestType,
    expires_at: invite.expires_at,
    can_create_routines: !!permissions.can_create_routines,
    can_start_workouts: !!permissions.can_start_workouts,
    can_review_history: !!permissions.can_review_history,
    owner_profile: null,
    delegate_profile: null,
    source: 'token',
    invite_token: invite.token,
  };

  if (requestType === 'trainer_invite') {
    baseShare.delegate_profile = invite.inviter_profile || null;
  } else {
    baseShare.owner_profile = invite.inviter_profile || null;
  }

  return baseShare;
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
      .eq("delegate_email", email.toLowerCase().trim())
      .eq("status", "pending");

    if (fetchError) {
      console.error("Error fetching pending invitations:", fetchError);
      return 0;
    }

    if (!pendingInvitations || pendingInvitations.length === 0) {
      return 0;
    }

    // Process each invitation based on request_type
    let linkedCount = 0;
    
    for (const invitation of pendingInvitations) {
      if (invitation.request_type === 'trainer_invite') {
        // For trainer_invite: new user (client) becomes owner, trainer remains delegate
        // Validate that trainer is already set as delegate
        if (invitation.delegate_user_id && invitation.delegate_user_id !== userId) {
          const { error: updateError } = await supabase
            .from("account_shares")
            .update({ 
              owner_user_id: userId, // New user (client) becomes owner
              delegate_user_id: invitation.delegate_user_id, // Keep trainer as delegate
              status: "active"
            })
            .eq("id", invitation.id)
            .eq("status", "pending");
          
          if (updateError) {
            console.error(`[linkPendingInvitations] Error linking trainer_invite ${invitation.id}:`, updateError);
            continue;
          }
          linkedCount++;
        } else {
          console.warn(`[linkPendingInvitations] Skipping trainer_invite ${invitation.id}: delegate_user_id mismatch or missing`);
        }
      } else if (invitation.request_type === 'client_invite') {
        // For client_invite: new user (trainer) becomes delegate, owner already set
        const { error: updateError } = await supabase
          .from("account_shares")
          .update({ 
            delegate_user_id: userId, // New user (trainer) becomes delegate
            status: "active"
          })
          .eq("id", invitation.id)
          .eq("status", "pending");
        
        if (updateError) {
          console.error(`[linkPendingInvitations] Error linking client_invite ${invitation.id}:`, updateError);
          continue;
        }
        linkedCount++;
      } else {
        // Legacy or unknown request_type - use default behavior
        const { error: updateError } = await supabase
          .from("account_shares")
          .update({ 
            delegate_user_id: userId,
            status: "active"
          })
          .eq("id", invitation.id)
          .eq("status", "pending");
        
        if (updateError) {
          console.error(`[linkPendingInvitations] Error linking invitation ${invitation.id}:`, updateError);
          continue;
        }
        linkedCount++;
      }
    }

    return linkedCount;
  } catch (error) {
    console.error("linkPendingInvitations error:", error);
    return 0;
  }
}

export async function linkInvitationRecordsToUser(userId: string, email: string): Promise<void> {
  try {
    await supabase
      .from('invitations')
      .update({ recipient_user_id: userId })
      .is('recipient_user_id', null)
      .eq('recipient_email', email.toLowerCase());
  } catch (error) {
    console.error('[linkInvitationRecordsToUser] Failed to link invitations', error);
  }
}
