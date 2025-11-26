import { useQuery } from "@tanstack/react-query";
import { getPendingInvitations } from "@/lib/sharingApi";

/**
 * Hook to fetch pending invitations for the current user
 */
export function usePendingInvitations(userId: string | undefined) {
  return useQuery({
    queryKey: ["pending_requests", userId],
    queryFn: async () => {
      if (!userId) return [];
      console.log('[Account] Fetching pending requests for user:', userId);
      return await getPendingInvitations(userId);
    },
    enabled: !!userId,
  });
}

