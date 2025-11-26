import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toastReplacement";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import IncomingInvitationCard from "@/features/account/components/IncomingInvitationCard";
import OutgoingInvitationCard from "@/features/account/components/OutgoingInvitationCard";
import {
  getPendingInvitations,
  getOutgoingInvitations,
  acceptInvitation,
  rejectInvitation,
  acceptTokenInvitation,
  declineTokenInvitation,
} from "@/lib/sharingApi";
import { postSlackEvent } from "@/lib/slackEvents";

interface SharingRequestsProps {
  user: any;
  onInviteTrainer: () => void;
  onInviteClient: () => void;
  setRequestToDecline: (request: any) => void;
  setShowDeclineConfirmDialog: (show: boolean) => void;
  setInvitationToDelete: (invite: any) => void;
  setShowDeleteInvitationDialog: (show: boolean) => void;
}

const SharingRequests: React.FC<SharingRequestsProps> = ({
  user,
  onInviteTrainer,
  onInviteClient,
  setRequestToDecline,
  setShowDeclineConfirmDialog,
  setInvitationToDelete,
  setShowDeleteInvitationDialog,
}) => {
  const queryClient = useQueryClient();

  const formatUserDisplay = (profile: any) => {
    if (!profile) return "Unknown User";
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email;
  };

  const mapTokenOutgoingInvitation = (invite: any) => {
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
  };

  const pendingRequestsQuery = useQuery({
    queryKey: ["pending_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Account] Fetching pending requests for user:', user.id);
      return await getPendingInvitations(user.id);
    },
    enabled: !!user?.id,
  });

  const outgoingRequestsQuery = useQuery({
    queryKey: ["outgoing_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const tokenInvitations = await getOutgoingInvitations();
      return tokenInvitations.map(mapTokenOutgoingInvitation);
    },
    enabled: !!user?.id,
  });

  const acceptRequestMutation = useMutation({
    mutationFn: async (request: any) => {
      if (request?.source === 'token' && request?.invite_token) {
        return await acceptTokenInvitation(request.invite_token);
      }
      return await acceptInvitation(request.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
      queryClient.invalidateQueries({ queryKey: ["shares_shared_with_me"] });
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
      toast.success("Request accepted successfully");
    },
    onError: (error: any, request: any) => {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
      try {
        postSlackEvent('invitation.accept.error', {
          stage: 'account-accept',
          error: error?.message || 'Unknown error',
          request_id: request?.id,
          source: request?.source || 'legacy',
        });
      } catch (_) {}
    },
  });

  const handleAcceptRequest = (request: any) => {
    acceptRequestMutation.mutate(request);
  };

  const handleDeclineRequest = (request: any) => {
    setRequestToDecline(request);
    setShowDeclineConfirmDialog(true);
  };

  const handleDeleteInvitation = (request: any) => {
    setInvitationToDelete({ id: request.id, source: request.source || 'legacy' });
    setShowDeleteInvitationDialog(true);
  };

  return (
    <div className="w-full flex justify-center pb-5">
      <div className="w-full max-w-[500px] pt-5 pb-14 flex flex-col justify-start items-start gap-3">
        <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>

          {/* Incoming requests */}
          {pendingRequestsQuery.isLoading && (
            <div className="w-full bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center p-6">
              <div className="text-neutral-neutral-400 text-sm font-medium">Loading incoming requests...</div>
            </div>
          )}
          {pendingRequestsQuery.data && pendingRequestsQuery.data.length > 0 && (
            pendingRequestsQuery.data.map((request) => (
              <IncomingInvitationCard
                key={request.id}
                request={request}
                onAccept={handleAcceptRequest}
                onDecline={handleDeclineRequest}
                onDelete={handleDeleteInvitation}
                formatUserDisplay={formatUserDisplay}
                acceptPending={acceptRequestMutation.isPending}
                declinePending={false} // Decline dialog handles pending state locally if needed
              />
            ))
          )}

          {/* Outgoing requests */}
          {outgoingRequestsQuery.isLoading && (
            <div className="w-full bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center p-6">
              <div className="text-neutral-neutral-400 text-sm font-medium">Loading outgoing requests...</div>
            </div>
          )}
          {outgoingRequestsQuery.data && outgoingRequestsQuery.data.length > 0 && (
            outgoingRequestsQuery.data.map((request) => (
              <OutgoingInvitationCard
                key={request.id}
                request={request}
                onDelete={handleDeleteInvitation}
                formatUserDisplay={formatUserDisplay}
              />
            ))
          )}

          {/* Error states */}
          {pendingRequestsQuery.isError && (
            <div className="w-full bg-red-50 rounded-lg border border-red-200 flex flex-col justify-center items-center p-6">
              <div className="text-red-600 text-sm font-medium">Failed to load incoming requests. Please try again.</div>
            </div>
          )}
          {outgoingRequestsQuery.isError && (
            <div className="w-full bg-red-50 rounded-lg border border-red-200 flex flex-col justify-center items-center p-6">
              <div className="text-red-600 text-sm font-medium">Failed to load outgoing requests. Please try again.</div>
            </div>
          )}
          {(!pendingRequestsQuery.data || pendingRequestsQuery.data.length === 0) &&
            (!outgoingRequestsQuery.data || outgoingRequestsQuery.data.length === 0) &&
            !pendingRequestsQuery.isLoading &&
            !outgoingRequestsQuery.isLoading &&
            !pendingRequestsQuery.isError &&
            !outgoingRequestsQuery.isError && (
              <div className="w-full flex flex-col gap-3">
                <EmptyState
                  title="No invitations pending."
                  description="Invite a trainer to manage your account or invite a client so you can manage theirs."
                />
                <ActionCard
                  text="Invite a trainer"
                  onClick={onInviteTrainer}
                  className="w-full h-14 rounded-lg border border-neutral-300"
                />
                <ActionCard
                  text="Invite a client"
                  onClick={onInviteClient}
                  className="w-full h-14 rounded-lg border border-neutral-300"
                />
              </div>
            )}
          {((pendingRequestsQuery.data && pendingRequestsQuery.data.length > 0) ||
            (outgoingRequestsQuery.data && outgoingRequestsQuery.data.length > 0) ||
            pendingRequestsQuery.isLoading ||
            outgoingRequestsQuery.isLoading) && (
            <div className="w-full flex flex-col gap-3">
              <ActionCard
                text="Invite a trainer"
                onClick={onInviteTrainer}
                className="w-full"
              />
              <ActionCard
                text="Invite a client"
                onClick={onInviteClient}
                className="w-full"
              />
            </div>
          )}
        </DeckWrapper>
      </div>
    </div>
  );
};

export default SharingRequests;

