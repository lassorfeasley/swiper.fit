import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import ManagePermissionsCard from "@/features/sharing/components/ManagePermissionsCard";

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

  const trainerSharesQuery = useQuery({
    queryKey: ["shares_owned_by_me", user?.id],
    queryFn: async () => {
      console.log('[Account] Fetching trainers (account managers) for user:', user.id);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("owner_user_id", user.id)
        .eq("status", "active")
        .is("revoked_at", null);

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      const trainerIds = shares.map(share => share.delegate_user_id).filter(Boolean);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", trainerIds);

      if (profileError) throw profileError;

      const combinedData = shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.delegate_user_id) || {
          email: share.delegate_email,
          first_name: "",
          last_name: ""
        }
      }));
      
      return combinedData.sort((a, b) => {
        const nameA = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  });

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

