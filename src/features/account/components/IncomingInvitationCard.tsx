import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/shadcn/button";
import ActionPill from "@/components/shared/ActionPill";

interface IncomingInvitationCardProps {
  request: any;
  onAccept: (request: any) => void;
  onDecline: (request: any) => void;
  onDelete: (request: any) => void;
  formatUserDisplay: (profile: any) => string;
  acceptPending: boolean;
  declinePending: boolean;
}

const IncomingInvitationCard: React.FC<IncomingInvitationCardProps> = ({
  request,
  onAccept,
  onDecline,
  onDelete,
  formatUserDisplay,
  acceptPending,
  declinePending,
}) => {
  return (
    <div className="SharedWithMeCard w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
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
            onClick={() => onDelete(request)}
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
            onClick={() => onAccept(request)}
            disabled={acceptPending}
            className="flex-1"
          >
            Accept
          </Button>
          <Button
            onClick={() => onDecline(request)}
            disabled={declinePending}
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
  );
};

export default IncomingInvitationCard;

