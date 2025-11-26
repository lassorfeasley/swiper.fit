import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import { EmptyState } from "@/components/shared/EmptyState";
import ManagePermissionsCard from "@/features/sharing/components/ManagePermissionsCard";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@/contexts/AccountContext";

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

  const clientSharesQuery = useQuery({
    queryKey: ["shares_shared_with_me", user?.id],
    queryFn: async () => {
      console.log('[Account] Fetching clients (account owners) for user:', user.id);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("delegate_user_id", user.id)
        .eq("status", "active")
        .is("revoked_at", null);

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      const clientIds = shares.map(share => share.owner_user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", clientIds);

      if (profileError) throw profileError;

      let activeByClient: any = {};
      if (clientIds && clientIds.length > 0) {
        const { data: activeWorkouts, error: activeErr } = await supabase
          .from('workouts')
          .select(`id, user_id, routine_id, is_active, completed_at, routines!fk_workouts__routines(routine_name)`) 
          .in('user_id', clientIds)
          .eq('is_active', true);
        if (!activeErr && Array.isArray(activeWorkouts)) {
          activeByClient = activeWorkouts.reduce((acc: any, w: any) => {
            acc[w.user_id] = w;
            return acc;
          }, {});
        }
      }

      const combinedData = shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.owner_user_id) || null,
        activeWorkout: activeByClient[share.owner_user_id] || null
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

