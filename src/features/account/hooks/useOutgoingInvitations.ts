import { useQuery } from "@tanstack/react-query";
import { getOutgoingInvitations } from "@/lib/sharingApi";

/**
 * Maps a token-based invitation to the format expected by the UI
 */
function mapTokenOutgoingInvitation(invite: any) {
  const requestType = invite.intended_role === 'manager' ? 'trainer_invite' : 'client_invite';
  const perms = invite.permissions || {};
  return {
    id: invite.id,
    delegate_email: invite.recipient_email,
    owner_user_id: invite.inviter_id || null,
    delegate_user_id: invite.recipient_user_id || null,
    request_type: requestType,
    status: invite.status,
    created_at: invite.created_at,
    expires_at: invite.expires_at,
    can_create_routines: !!perms.can_create_routines,
    can_start_workouts: !!perms.can_start_workouts,
    can_review_history: !!perms.can_review_history,
    profiles: invite.recipient_profile || (invite.recipient_email ? { email: invite.recipient_email } : null),
    source: 'token' as const,
  };
}

/**
 * Hook to fetch and format outgoing invitations for the current user
 */
export function useOutgoingInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ["outgoing_requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      const tokenInvitations = await getOutgoingInvitations();
      return tokenInvitations.map(mapTokenOutgoingInvitation);
    },
    enabled: !!userId,
  });
}

