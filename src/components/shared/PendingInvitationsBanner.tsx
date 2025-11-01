import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getPendingInvitations } from "@/lib/sharingApi";
import { SwiperAlert } from "@/components/shared/SwiperAlert";
import { AlertCircle } from "lucide-react";

export default function PendingInvitationsBanner(): React.JSX.Element | null {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: pendingRequests } = useQuery({
    queryKey: ["pending_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await getPendingInvitations(user.id);
    },
    enabled: !!user?.id,
  });

  if (!pendingRequests || pendingRequests.length === 0) {
    return null;
  }

  const count = pendingRequests.length;
  const handleClick = () => {
    console.log('[PendingInvitationsBanner] Clicked, navigating to sharing requests');
    // Navigate to account page with section parameter
    // Force navigation by using replace: false and ensuring URL is set
    navigate("/account?section=sharing-requests", { replace: false, state: { fromBanner: true } });
  };

  return (
    <SwiperAlert
      title={`You have pending ${count} ${count === 1 ? "invitation" : "invitations"}`}
      subtitle="Review now"
      icon={AlertCircle}
      onClick={handleClick}
      iconVariant="alert"
    />
  );
}

