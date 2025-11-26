import React from "react";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import ManagePermissionsCard from "@/features/sharing/components/ManagePermissionsCard";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@/contexts/AccountContext";
import { useFormatUserDisplay } from "@/hooks/useFormatUserDisplay";
import { useClientShares } from "@/features/account/hooks/useClientShares";

interface ClientsListProps {
  user: any;
  onInviteClient: () => void;
  onRemoveShare: (shareId: string, displayName: string) => void;
  onStartWorkout: (clientProfile: any) => void;
  onCreateRoutines: (clientProfile: any) => void;
  onReviewHistory: (clientProfile: any) => void;
}

const ClientsList: React.FC<ClientsListProps> = ({
  user,
  onInviteClient,
  onRemoveShare,
  onStartWorkout,
  onCreateRoutines,
  onReviewHistory,
}) => {
  const navigate = useNavigate();
  const { switchToUser } = useAccount();
  const formatUserDisplay = useFormatUserDisplay();
  const clientSharesQuery = useClientShares(user?.id);

  return (
    <div className="w-full flex justify-center pb-5">
      <div className="w-full max-w-[500px] pt-5 pb-20 flex flex-col justify-start items-start gap-3">
        {clientSharesQuery.isLoading ? (
          <div className="text-gray-400 text-center py-8 w-full">Loading...</div>
        ) : !clientSharesQuery.data || clientSharesQuery.data.length === 0 ? (
          <>
            <EmptyState
              title="Add a client to your account."
              description="Invite a client to manage their account to build routines for them, review their history, and start workouts."
            />
            <ActionCard
              text="Invite a client"
              onClick={onInviteClient}
              className="w-full h-14 rounded-lg border border-neutral-300"
            />
          </>
        ) : (
          <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>
            {clientSharesQuery.data.map((share) => (
              <ManagePermissionsCard
                key={share.id}
                variant="client"
                name={share.profile}
                permissions={{
                  can_create_routines: share.can_create_routines,
                  can_start_workouts: share.can_start_workouts,
                  can_review_history: share.can_review_history
                }}
                activeWorkout={share.activeWorkout}
                onRemove={() => onRemoveShare(share.id, formatUserDisplay(share.profile))}
                onStartWorkout={() => {
                  if (!share.can_start_workouts) return;
                  if (share.activeWorkout) {
                    switchToUser(share.profile);
                    navigate('/workout/active');
                    return;
                  }
                  onStartWorkout(share.profile);
                }}
                onCreateRoutines={() => share.can_create_routines && onCreateRoutines(share.profile)}
                onReviewHistory={() => share.can_review_history && onReviewHistory(share.profile)}
              />
            ))}
            <ActionCard
              text="Invite a client"
              onClick={onInviteClient}
              className="w-full h-14 rounded-lg border border-neutral-300"
            />
          </DeckWrapper>
        )}
      </div>
    </div>
  );
};

export default ClientsList;

