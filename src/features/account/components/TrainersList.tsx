import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import ManagePermissionsCard from "@/features/sharing/components/ManagePermissionsCard";
import { useFormatUserDisplay } from "@/hooks/useFormatUserDisplay";
import { useTrainerShares } from "@/features/account/hooks/useTrainerShares";

interface TrainersListProps {
  user: any;
  onInviteTrainer: () => void;
  onRemoveShare: (shareId: string, displayName: string) => void;
}

const TrainersList: React.FC<TrainersListProps> = ({
  user,
  onInviteTrainer,
  onRemoveShare,
}) => {
  const queryClient = useQueryClient();
  const formatUserDisplay = useFormatUserDisplay();
  const trainerSharesQuery = useTrainerShares(user?.id);

  const updateSharePermissionsMutation = useMutation({
    mutationFn: async (params: { shareId: string; permissions: any }) => {
      const { shareId, permissions } = params;
      const { data, error } = await supabase
        .from("account_shares")
        .update(permissions)
        .eq("id", shareId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
    },
  });

  const handlePermissionToggle = (shareId: string, permission: string, value: any) => {
    updateSharePermissionsMutation.mutate({
      shareId,
      permissions: { [permission]: value }
    });
  };

  return (
    <div className="w-full flex justify-center pb-5">
      <div className="w-full max-w-[500px] pt-5 pb-20 flex flex-col justify-start items-start gap-3">
        {trainerSharesQuery.isLoading ? (
          <div className="text-gray-400 text-center py-8 w-full">Loading...</div>
        ) : !trainerSharesQuery.data || trainerSharesQuery.data.length === 0 ? (
          <>
            <EmptyState
              title="Add a trainer to your account."
              description="Invite a trainer to manage you account to let them build you routines, review your history, and start workouts."
            />
            <ActionCard
              text="Invite a trainer"
              onClick={onInviteTrainer}
              className="w-full h-14 rounded-lg border border-neutral-300"
            />
          </>
        ) : (
          <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>
            {trainerSharesQuery.data.map((share) => (
              <ManagePermissionsCard
                key={share.id}
                variant="trainer"
                name={share.profile}
                permissions={{
                  can_create_routines: share.can_create_routines,
                  can_start_workouts: share.can_start_workouts,
                  can_review_history: share.can_review_history
                }}
                onPermissionChange={(newPermissions) => {
                  Object.keys(newPermissions).forEach(permission => {
                    if (newPermissions[permission] !== share[permission]) {
                      handlePermissionToggle(share.id, permission, newPermissions[permission]);
                    }
                  });
                }}
                onRemove={() => onRemoveShare(share.id, formatUserDisplay(share.profile))}
              />
            ))}
            <ActionCard
              text="Invite a trainer"
              onClick={onInviteTrainer}
              className="w-full h-14 rounded-lg border border-neutral-300"
            />
          </DeckWrapper>
        )}
      </div>
    </div>
  );
};

export default TrainersList;

