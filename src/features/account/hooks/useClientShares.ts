import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";

/**
 * Hook to fetch active client shares (account owners) for the current user
 */
export function useClientShares(userId: string | undefined) {
  return useQuery({
    queryKey: ["shares_shared_with_me", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      console.log('[Account] Fetching clients (account owners) for user:', userId);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("delegate_user_id", userId)
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
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

