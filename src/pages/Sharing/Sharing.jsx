import { useState, useEffect } from "react";
import { TextInput } from "@/components/molecules/text-input";
import { Button } from "@/components/atoms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoundPlus, UserRoundX, Blend, Plus, Play, Settings, History, MoveUpRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { useAccount } from "@/contexts/AccountContext";
import { useNavigate, Navigate } from "react-router-dom";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SectionWrapperLabel from "@/components/common/Cards/Wrappers/SectionWrapperLabel";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";

export default function Sharing() {
  const { user } = useAuth(); // still need auth user for queries where they own shares
  const { switchToUser, isDelegated } = useAccount();
  const navigate = useNavigate();

  // Redirect handled in render below to avoid hook order issues

  const queryClient = useQueryClient();

  // Form
  const [email, setEmail] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);

  // Helper function to format user display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    
    // If we have both first and last name, use them
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    // If we only have first name, use it
    if (firstName) {
      return firstName;
    }
    
    // If we only have last name, use it
    if (lastName) {
      return lastName;
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
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at, can_create_routines, can_start_workouts, can_review_history")
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
        .select("id, owner_user_id, created_at, can_create_routines, can_start_workouts, can_review_history")
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
      console.log("createShareMutation called with data:", shareData);
      
      const { data, error } = await supabase
        .from("account_shares")
        .insert(shareData)
        .select();

      console.log("Supabase response:", { data, error });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Share created successfully:", data);
      return data;
    },
    onSuccess: () => {
      console.log("Mutation onSuccess called");
      queryClient.invalidateQueries(["shares_owned_by_me"]);
      setEmail("");
      setShowAddPerson(false);
    },
    onError: (error) => {
      console.error("Mutation onError called:", error);
    },
  });

  const updateSharePermissionsMutation = useMutation({
    mutationFn: async ({ shareId, permissions }) => {
      const { data, error } = await supabase
        .from("account_shares")
        .update(permissions)
        .eq("id", shareId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["shares_owned_by_me"]);
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
    console.log("Form submitted with email:", email);
    
    if (!email.trim()) {
      console.log("Email is empty, returning");
      return;
    }

    try {
      console.log("Looking up user by email:", email.trim().toLowerCase());
      
      // Look up the user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .limit(1);

      if (profileError) {
        console.error("Profile lookup error:", profileError);
        throw profileError;
      }

      console.log("Profile lookup result:", profiles);

      if (!profiles?.length) {
        console.log("No user found with email:", email);
        alert("No user found with that email address.");
        return;
      }

      const targetUserId = profiles[0].id;
      console.log("Target user ID:", targetUserId);

      // Check if user is trying to share with themselves
      if (targetUserId === user.id) {
        console.log("User trying to share with themselves");
        alert("You cannot share access with yourself.");
        return;
      }

      // Check if already shared (I am the owner, they are the delegate) - check ALL shares, not just non-revoked ones
      const { data: existingShares } = await supabase
        .from("account_shares")
        .select("id, revoked_at")
        .eq("owner_user_id", user.id)
        .eq("delegate_user_id", targetUserId)
        .limit(1);

      console.log("Existing shares check:", existingShares);

      if (existingShares?.length > 0) {
        const existingShare = existingShares[0];
        if (existingShare.revoked_at) {
          console.log("Found revoked share, reactivating it");
          // Reactivate the revoked share instead of creating a new one
          await updateSharePermissionsMutation.mutateAsync({
            shareId: existingShare.id,
            permissions: { 
              revoked_at: null,
              can_create_routines: false,
              can_start_workouts: false,
              can_review_history: false
            }
          });
          console.log("Revoked share reactivated successfully");
          return;
        } else {
          console.log("Active share already exists");
          alert("Access already shared with this user.");
          return;
        }
      }

      console.log("Creating share with data:", {
        owner_user_id: user.id,
        delegate_user_id: targetUserId,
        delegate_email: email.trim().toLowerCase(),
        can_create_routines: false,
        can_start_workouts: false,
        can_review_history: false,
      });

      // Create the share with default permissions (all false)
      await createShareMutation.mutateAsync({
        owner_user_id: user.id,
        delegate_user_id: targetUserId,
        delegate_email: email.trim().toLowerCase(),
        can_create_routines: false,
        can_start_workouts: false,
        can_review_history: false,
      });
      
      console.log("Share created successfully");
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

  const handlePermissionToggle = (shareId, permission, value) => {
    updateSharePermissionsMutation.mutate({
      shareId,
      permissions: { [permission]: value }
    });
  };

  if (isDelegated) {
    return <Navigate to="/routines" replace />;
  }

  return (
    <AppLayout title="" hideHeader>
      <div className="w-full">
        {/* Shared with me section */}
        <PageSectionWrapper 
          section="Shared with me"
          style={{ paddingBottom: 80, paddingTop: 40, maxWidth: '500px', minWidth: '325px' }}
        >
          {sharedWithMeQuery.data?.map((share) => (
            <div key={share.id} className="w-full max-w-[500px] border-b border-neutral-neutral-300 inline-flex flex-col justify-start items-start">
              <div className="self-stretch px-3 py-4 bg-neutral-Neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-2.5">
                <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                  Manage {formatUserDisplay(share.profile)}'s account
                </div>
              </div>
              <div 
                className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5 cursor-pointer"
                onClick={() => switchToUser(share.profile)}
              >
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Start a workout</div>
                <MoveUpRight className="w-4 h-4 text-neutral-neutral-700" />
              </div>
              <div 
                className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5 cursor-pointer"
                onClick={() => switchToUser(share.profile)}
              >
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Create or edit routines</div>
                <MoveUpRight className="w-4 h-4 text-neutral-neutral-700" />
              </div>
              <div 
                className="self-stretch h-[52px] px-3 inline-flex justify-end items-center gap-2.5 cursor-pointer"
                onClick={() => switchToUser(share.profile)}
              >
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Review {formatUserDisplay(share.profile)}'s history</div>
                <MoveUpRight className="w-4 h-4 text-neutral-neutral-700" />
              </div>
            </div>
          ))}
          {sharedWithMeQuery.data?.length === 0 && (
            <div className="text-neutral-neutral-400 text-sm font-medium">
              No accounts have shared access with you yet.
            </div>
          )}
        </PageSectionWrapper>

        {/* Shared by me section */}
        <PageSectionWrapper 
          section="Shared by me"
          style={{ paddingBottom: 80, paddingTop: 40, maxWidth: '500px', minWidth: '325px' }}
        >
          {ownerSharesQuery.data?.map((share) => (
            <div key={share.id} className="w-full max-w-[500px] border-b border-neutral-neutral-300 inline-flex flex-col justify-start items-start">
              <div className="self-stretch px-3 py-4 bg-neutral-Neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-2.5">
                <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                  {formatUserDisplay(share.profile)}'s permissions
                </div>
              </div>
              <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5">
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Create routines</div>
                <div 
                  data-on-off={share.can_create_routines ? "true" : "false"} 
                  data-property-1="of" 
                  className="w-14 h-8 p-1 bg-neutral-neutral-100 outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-start items-center gap-1 cursor-pointer"
                  onClick={() => handlePermissionToggle(share.id, 'can_create_routines', !share.can_create_routines)}
                >
                  <div className={`w-6 self-stretch ${share.can_create_routines ? 'bg-neutral-neutral-700' : 'bg-neutral-neutral-300'}`} />
                </div>
              </div>
              <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5">
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Start workouts</div>
                <div 
                  data-on-off={share.can_start_workouts ? "true" : "false"} 
                  data-property-1="of" 
                  className="w-14 h-8 p-1 bg-neutral-neutral-100 outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-start items-center gap-1 cursor-pointer"
                  onClick={() => handlePermissionToggle(share.id, 'can_start_workouts', !share.can_start_workouts)}
                >
                  <div className={`w-6 self-stretch ${share.can_start_workouts ? 'bg-neutral-neutral-700' : 'bg-neutral-neutral-300'}`} />
                </div>
              </div>
              <div className="self-stretch h-[52px] px-3 inline-flex justify-end items-center gap-2.5">
                <div className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Review history</div>
                <div 
                  data-on-off={share.can_review_history ? "true" : "false"} 
                  data-property-1="of" 
                  className="w-14 h-8 p-1 bg-neutral-neutral-100 outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex justify-start items-center gap-1 cursor-pointer"
                  onClick={() => handlePermissionToggle(share.id, 'can_review_history', !share.can_review_history)}
                >
                  <div className={`w-6 self-stretch ${share.can_review_history ? 'bg-neutral-neutral-700' : 'bg-neutral-neutral-300'}`} />
                </div>
              </div>
            </div>
          ))}
          
          {/* Add new person section */}
          <div className="w-full max-w-[500px] pt-5 pb-5 inline-flex justify-between items-center">
            <div className="flex-1 pl-3 bg-neutral-neutral-100 border-t border-b border-neutral-neutral-300 flex justify-between items-center">
              <div className="justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">share with new person</div>
              <div 
                data-property-1="left-border" 
                className="p-2.5 border-l border-neutral-neutral-300 flex justify-start items-center gap-2.5 cursor-pointer"
                onClick={() => setShowAddPerson(!showAddPerson)}
              >
                <div className="w-6 h-6 relative overflow-hidden">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Add person form */}
          {showAddPerson && (
            <div className="w-full max-w-[500px] border-b border-neutral-neutral-300 flex flex-col justify-start items-start">
              <div className="self-stretch px-3 py-4 bg-neutral-Neutral-50 border-t border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-2.5">
                <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">Add new person</div>
              </div>
              <div className="self-stretch p-3 border-b-[0.50px] border-neutral-neutral-300">
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
          )}

          {ownerSharesQuery.isSuccess && (!ownerSharesQuery.data || ownerSharesQuery.data.length === 0) && !showAddPerson && (
            <div className="text-neutral-neutral-400 text-sm font-medium">
              You haven't shared access with anyone yet.
            </div>
          )}
        </PageSectionWrapper>
      </div>
    </AppLayout>
  );
} 