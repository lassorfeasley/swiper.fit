import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import ActionPill from "@/components/shared/ActionPill";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import { toast } from "@/lib/toastReplacement";
import {
  getPendingInvitations,
  getOutgoingInvitations,
  acceptInvitation,
  rejectInvitation,
  cancelInvitationRequest,
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
          <div key={request.id} className="SharedWithMeCard w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
            <div className="CardHeader self-stretch p-3 border-b border-neutral-300 inline-flex justify-between items-center">
              <div className="Frame84 flex-1 flex justify-start items-center gap-3">
                <div className="flex-1 justify-center text-neutral-neutral-700 text-xl font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  {(() => {
                    const isTrainerInvite = request.request_type === 'trainer_invite';
                    const ownerProfile = (request as any).owner_profile;
                    const delegateProfile = (request as any).delegate_profile;

                    // For trainer_invite, the trainer (delegate) invited the client (owner)
                    if (isTrainerInvite) {
                      const inviter = delegateProfile || ownerProfile;
                      return `${formatUserDisplay(inviter)} wants you to be their trainer`;
                    }

                    // For client_invite, the client (owner) invited the trainer (delegate)
                    const inviter = ownerProfile || delegateProfile;
                    return `${formatUserDisplay(inviter)} wants to be your trainer`;
                  })()}
                </div>
              </div>
              {request.source !== 'token' && (
                <ActionPill
                  onClick={() => handleDeleteInvitation(request)}
                  Icon={Trash2}
                  showText={false}
                  color="neutral"
                  iconColor="neutral"
                  fill={false}
                />
              )}
            </div>
            <div className="Frame79 self-stretch p-3 flex flex-col justify-start items-start gap-4">
              <div className="YourPermissions self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Your permissions:</div>
              <div className="PermissionRows self-stretch bg-stone-100 rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                <div className="InputWrapper self-stretch h-14 p-3 bg-white inline-flex justify-center items-center">
                  <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                    <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                      <div className="Text self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Start workouts</div>
                    </div>
                  </div>
                  <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                    {request.can_start_workouts && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="InputWrapper self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-center items-center">
                  <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                    <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                      <div className="Text self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create or edit routines</div>
                    </div>
                  </div>
                  <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                    {request.can_create_routines && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
                <div className="InputWrapper self-stretch h-14 p-3 bg-white inline-flex justify-center items-center">
                  <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                    <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                      <div className="Text self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Review history</div>
                    </div>
                  </div>
                  <div className="LucideIcon w-6 h-6 flex items-center justify-center">
                    {request.can_review_history && (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </div>
              </div>
              <div className="self-stretch inline-flex justify-start items-start gap-2.5 flex-wrap content-start">
                <Button
                  onClick={() => handleAcceptRequest(request)}
                  disabled={acceptRequestMutation.isPending}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  onClick={() => handleDeclineRequest(request)}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
              <div className="ThisInvitationWillExpireIn14Days self-stretch justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                This invitation will expire in {Math.ceil((new Date(request.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days.
              </div>
            </div>
          </div>
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
          <div key={request.id} data-layer="Property 1=Awaiting responce" className="Property1AwaitingResponce w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
            <div data-layer="card-header" className="CardHeader self-stretch p-3 bg-white flex flex-col justify-start items-start gap-3">
              <div data-layer="Frame 86" className="Frame86 self-stretch inline-flex justify-start items-center gap-3">
                <div data-layer="Frame 85" className="Frame85 flex-1 inline-flex flex-col justify-start items-start gap-1">
                  <div data-layer="example@account.com was invited to be your trainer" className="ExampleAccountComWasInvitedToBeYourTrainer justify-center">
                    <span className="text-neutral-neutral-700 text-sm font-bold font-['Be_Vietnam_Pro'] leading-tight">
                      {formatUserDisplay(request.profiles)}{" "}
                    </span>
                    <span className="text-neutral-neutral-700 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">
                      {request.request_type === "trainer_invite"
                        ? "was invited to be your trainer"
                        : "was invited to be your client"}
                    </span>
                  </div>
                  <div data-layer="Awaiting response" className="AwaitingResponse justify-center text-neutral-neutral-500 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">Awaiting response</div>
                </div>
                <button
                  type="button"
                  aria-label="Delete invitation"
                  onClick={() => handleDeleteInvitation(request)}
                  className="LucideIcon w-8 h-8 relative overflow-hidden flex items-center justify-center"
                >
                  <Trash2 className="w-6 h-7 text-neutral-neutral-700" />
                </button>
              </div>
            </div>
          </div>
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

