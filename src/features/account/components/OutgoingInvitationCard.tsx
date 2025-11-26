import React from "react";
import { Trash2 } from "lucide-react";

interface OutgoingInvitationCardProps {
  request: any;
  onDelete: (request: any) => void;
  formatUserDisplay: (profile: any) => string;
}

const OutgoingInvitationCard: React.FC<OutgoingInvitationCardProps> = ({
  request,
  onDelete,
  formatUserDisplay,
}) => {
  return (
    <div data-layer="Property 1=Awaiting responce" className="Property1AwaitingResponce w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
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
            onClick={() => onDelete(request)}
            className="LucideIcon w-8 h-8 relative overflow-hidden flex items-center justify-center"
          >
            <Trash2 className="w-6 h-7 text-neutral-neutral-700" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OutgoingInvitationCard;

