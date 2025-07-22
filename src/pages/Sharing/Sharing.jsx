import { useState, useEffect } from "react";
import { TextInput } from "@/components/molecules/text-input";
import { Button } from "@/components/atoms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoundPlus, UserRoundX, Blend } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { useAccount } from "@/contexts/AccountContext";
import { useNavigate, Navigate } from "react-router-dom";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";

export default function Sharing() {
  const { user } = useAuth(); // still need auth user for queries where they own shares
  const { switchToUser, isDelegated } = useAccount();
  const navigate = useNavigate();

  // Redirect handled in render below to avoid hook order issues

  const queryClient = useQueryClient();

  // Form
  const [email, setEmail] = useState("");

  // Helper function to format user display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    
    // If we have both first and last name, use them
    if (firstName && lastName) {
      return `${firstName} ${lastName} | ${email}`;
    }
    
    // If we only have first name, use it
    if (firstName) {
      return `${firstName} | ${email}`;
    }
    
    // If we only have last name, use it
    if (lastName) {
      return `${lastName} | ${email}`;
    }
    
    // If we have no name, just use email
    return email;
  };

  // -------------------------------
  // Queries
  // -------------------------------
  const ownerSharesQuery = useQuery({
    queryKey: ["shares_owned_by_me", user?.id],
    queryFn: async () => {
      // Get accounts I've shared my account with (I am the owner)
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at")
        .eq("owner_user_id", user.id)
        .is("revoked_at", null); // Only get non-revoked shares

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      // Fetch profile data for the people I've shared with
      const delegateIds = shares.map(share => share.delegate_user_id).filter(Boolean);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", delegateIds);

      if (profileError) throw profileError;

      // Combine the data
      return shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.delegate_user_id) || {
          email: share.delegate_email,
          first_name: "",
          last_name: ""
        }
      }));
    },
    enabled: !!user?.id,
  });

  const sharedWithMeQuery = useQuery({
    queryKey: ["shares_shared_with_me", user?.id],
    queryFn: async () => {
      // Get accounts that have shared their account with me (I am the delegate)
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at")
        .eq("delegate_user_id", user.id)
        .is("revoked_at", null); // Only get non-revoked shares

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      // Fetch profile data for the people who shared with me
      const ownerIds = shares.map(share => share.owner_user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", ownerIds);

      if (profileError) throw profileError;

      // Combine the data
      return shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.owner_user_id) || null
      }));
    },
    enabled: !!user?.id,
  });

  // -------------------------------
  // Mutations
  // -------------------------------
  const createShareMutation = useMutation({
    mutationFn: async (shareData) => {
      const { data, error } = await supabase
        .from("account_shares")
        .insert(shareData)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["shares_owned_by_me"]);
      setEmail("");
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (shareId) => {
      // Soft delete by setting revoked_at timestamp
      const { error } = await supabase
        .from("account_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["shares_owned_by_me"]);
    },
  });

  // -------------------------------
  // Handlers
  // -------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      // Look up the user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .limit(1);

      if (profileError) throw profileError;

      if (!profiles?.length) {
        alert("No user found with that email address.");
        return;
      }

      const targetUserId = profiles[0].id;

      // Check if already shared (I am the owner, they are the delegate)
      const { data: existingShares } = await supabase
        .from("account_shares")
        .select("id")
        .eq("owner_user_id", user.id)
        .eq("delegate_user_id", targetUserId)
        .is("revoked_at", null)
        .limit(1);

      if (existingShares?.length > 0) {
        alert("Access already shared with this user.");
        return;
      }

      // Create the share (I am the owner sharing with them as delegate)
      await createShareMutation.mutateAsync({
        owner_user_id: user.id,
        delegate_user_id: targetUserId,
        delegate_email: email.trim().toLowerCase(),
      });
    } catch (error) {
      console.error("Error sharing access:", error);
      alert("Failed to share access. Please try again.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleRemoveShare = (shareId) => {
    if (confirm("Are you sure you want to remove access for this user?")) {
      deleteShareMutation.mutate(shareId);
    }
  };

  if (isDelegated) {
    return <Navigate to="/routines" replace />;
  }

  return (
    <AppLayout title="Sharing">
      <DeckWrapper gap={0} className="pb-24" style={{ paddingTop: 44, paddingLeft: 20, paddingRight: 20 }}>
        {/* Shared with me section */}
        <div className="w-full max-w-[500px] mx-auto flex flex-col justify-start items-start border border-neutral-300 overflow-hidden mb-8 bg-white">
          <div className="self-stretch px-5 py-4 border-b border-neutral-300 inline-flex justify-start items-center gap-2.5">
            <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Shared with me</div>
          </div>
          <div className="self-stretch px-5 pt-5 pb-3 flex flex-col justify-center items-start gap-14">
            <div className="self-stretch flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex flex-col justify-start items-start gap-5">
                {sharedWithMeQuery.data?.length === 0 && (
                  <div className="text-neutral-neutral-400 text-sm font-medium">
                    No accounts have shared access with you yet.
                  </div>
                )}
                {sharedWithMeQuery.data?.map((share) => (
                  <div
                    key={share.id}
                    onClick={() => switchToUser(share.profile)}
                    className="w-full cursor-pointer"
                  >
                    <EditableTextInput
                      value={formatUserDisplay(share.profile)}
                      onChange={() => {}} // Required prop for read-only component
                      icon={
                        <Blend
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchToUser(share.profile);
                          }}
                        />
                      }
                      editable={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Shared by me section */}
        <div className="w-full max-w-[500px] mx-auto flex flex-col justify-start items-start border border-neutral-300 overflow-hidden mb-8 bg-white">
          <div className="self-stretch px-5 py-4 border-b border-neutral-300 inline-flex justify-start items-center gap-2.5">
            <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Shared by me</div>
          </div>
          <div className="self-stretch px-5 pt-5 pb-3 flex flex-col justify-center items-start gap-14">
            <div className="self-stretch flex flex-col justify-start items-start gap-3">
              <div className="self-stretch flex flex-col justify-start items-start gap-5">
                {ownerSharesQuery.isSuccess && (!ownerSharesQuery.data || ownerSharesQuery.data.length === 0) && (
                  <div className="text-neutral-neutral-400 text-sm font-medium">
                    You haven't shared access with anyone yet.
                  </div>
                )}
                {ownerSharesQuery.data?.map((share) => (
                  <div key={share.id} className="w-full">
                    <EditableTextInput
                      value={formatUserDisplay(share.profile)}
                      onChange={() => {}} // Required prop for read-only component
                      icon={
                        <UserRoundX
                          className="size-5"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveShare(share.id);
                          }}
                        />
                      }
                      editable={false}
                    />
                    <div className="text-xs text-neutral-400 mt-1">
                      Click to remove access.
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Add people section */}
        <div className="w-full max-w-[500px] mx-auto flex flex-col justify-start items-start border border-neutral-300 overflow-hidden bg-white">
          <div className="self-stretch px-5 py-4 border-b border-neutral-300 inline-flex justify-start items-center gap-2.5">
            <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Add people</div>
          </div>
          <div className="w-full self-stretch px-5 pt-5 pb-3 flex flex-col justify-center items-start gap-14">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="self-stretch flex flex-col justify-start items-start gap-3">
                <div className="self-stretch inline-flex justify-start items-start gap-3 w-full">
                  <div className="flex-grow">
                    <TextInput
                      id="sharing-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      customPlaceholder="Enter email address"
                      onKeyDown={handleKeyDown}
                      icon={<UserRoundPlus />}
                    />
                  </div>
                  <Button type="submit" variant="primary" size="icon" disabled={createShareMutation.isPending}>
                    <UserRoundPlus className="text-white" />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </DeckWrapper>
    </AppLayout>
  );
} 