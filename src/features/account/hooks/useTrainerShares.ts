import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

/**
 * Hook to fetch active trainer shares (account managers) for the current user
 */
export function useTrainerShares(userId: string | undefined) {
  return useQuery({
    queryKey: ["shares_owned_by_me", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('[Account] Fetching trainers (account managers) for user:', userId);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("owner_user_id", userId)
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
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

