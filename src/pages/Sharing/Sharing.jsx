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
import SwiperDialog from "@/components/molecules/swiper-dialog";

export default function Sharing() {
  const { user } = useAuth(); // still need auth user for queries where they own shares
  const { switchToUser, isDelegated } = useAccount();
  const navigate = useNavigate();

  // Redirect handled in render below to avoid hook order issues

  const queryClient = useQueryClient();

  // Form
  const [email, setEmail] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);

  // Form state for dialog
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [dialogEmail, setDialogEmail] = useState("");
  const [dialogPermissions, setDialogPermissions] = useState({
    can_create_routines: true,
    can_start_workouts: true,
    can_review_history: true
  });

  // Routine selection dialog state
  const [showRoutineSelectionDialog, setShowRoutineSelectionDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRoutines, setClientRoutines] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);

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

  const handleDialogSubmit = async () => {
    if (!dialogEmail.trim()) return;

    try {
      console.log("Dialog form submitted with email:", dialogEmail);
      
      // Look up the user by email
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", dialogEmail.trim().toLowerCase())
        .limit(1);

      if (profileError) {
        console.error("Profile lookup error:", profileError);
        throw profileError;
      }

      console.log("Profile lookup result:", profiles);

      if (!profiles?.length) {
        console.log("No user found with email:", dialogEmail);
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
              ...dialogPermissions
            }
          });
          console.log("Revoked share reactivated successfully");
        } else {
          console.log("Active share already exists");
          alert("Access already shared with this user.");
          return;
        }
      } else {
        console.log("Creating share with data:", {
          owner_user_id: user.id,
          delegate_user_id: targetUserId,
          delegate_email: dialogEmail.trim().toLowerCase(),
          ...dialogPermissions
        });

        // Create the share with the selected permissions
        await createShareMutation.mutateAsync({
          owner_user_id: user.id,
          delegate_user_id: targetUserId,
          delegate_email: dialogEmail.trim().toLowerCase(),
          ...dialogPermissions
        });
        
        console.log("Share created successfully");
      }

      // Reset form and close dialog
      setDialogEmail("");
      setDialogPermissions({
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true
      });
      setShowAddPersonDialog(false);
    } catch (error) {
      console.error("Error sharing access:", error);
      alert("Failed to share access. Please try again.");
    }
  };

  const handleDialogCancel = () => {
    setDialogEmail("");
    setDialogPermissions({
      can_create_routines: true,
      can_start_workouts: true,
      can_review_history: true
    });
    setShowAddPersonDialog(false);
  };

  const handleDialogPermissionToggle = (permission, value) => {
    setDialogPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handlePermissionToggle = (shareId, permission, value) => {
    updateSharePermissionsMutation.mutate({
      shareId,
      permissions: { [permission]: value }
    });
  };

  const handleStartWorkout = async (clientProfile) => {
    setSelectedClient(clientProfile);
    
    // Fetch active routines for this specific client with workout completion data
    try {
      const { data: routines, error } = await supabase
        .from("routines")
        .select(`
          *,
          workouts!fk_workouts__routines(
            id,
            completed_at
          )
        `)
        .eq("user_id", clientProfile.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching routines:", error);
        return;
      }

      // Check for active workout
      const { data: activeWorkoutData, error: activeWorkoutError } = await supabase
        .from("workouts")
        .select(`
          id,
          routine_id,
          routines!fk_workouts__routines(routine_name)
        `)
        .eq("user_id", clientProfile.id)
        .is("completed_at", null)
        .single();

      if (activeWorkoutError && activeWorkoutError.code !== 'PGRST116') {
        console.error("Error fetching active workout:", activeWorkoutError);
      }

      // Process routines to add completion status
      const routinesWithCompletion = (routines || []).map((routine) => {
        // Get the most recent completed workout
        const completedWorkouts = (routine.workouts || []).filter(w => w.completed_at);
        const lastCompletedWorkout = completedWorkouts.length > 0 
          ? completedWorkouts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]
          : null;
        
        // Format the completion date
        let lastCompletedText = null;
        if (lastCompletedWorkout) {
          const completedDate = new Date(lastCompletedWorkout.completed_at);
          const now = new Date();
          
          // Compare dates only (not time)
          const completedDateOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const diffTime = Math.abs(nowDateOnly - completedDateOnly);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            lastCompletedText = "Completed today";
          } else if (diffDays === 1) {
            lastCompletedText = "Completed yesterday";
          } else if (diffDays < 7) {
            lastCompletedText = `Completed ${diffDays} days ago`;
          } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            lastCompletedText = `Completed ${weeks} week${weeks > 1 ? 's' : ''} ago`;
          } else {
            const months = Math.floor(diffDays / 30);
            lastCompletedText = `Completed ${months} month${months > 1 ? 's' : ''} ago`;
          }
        }

        return {
          ...routine,
          lastCompletedText
        };
      });

      console.log("Fetched active routines for client:", clientProfile.id);
      console.log("Routine data structure:", routinesWithCompletion);
      console.log("Number of routines found:", routinesWithCompletion?.length || 0);
      console.log("Active workout:", activeWorkoutData);
      
      setClientRoutines(routinesWithCompletion || []);
      setActiveWorkout(activeWorkoutData);
      setShowRoutineSelectionDialog(true);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

  const handleJoinActiveWorkout = () => {
    if (activeWorkout) {
      // Switch to the client's account context first
      switchToUser(selectedClient);
      
      // Navigate to active workout
      navigate(`/workout?workoutId=${activeWorkout.id}&clientId=${selectedClient.id}`);
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
      setActiveWorkout(null);
    }
  };

  const handleRoutineSelect = (routine) => {
    // Navigate to active workout with the selected routine
    navigate(`/workout?routineId=${routine.id}&clientId=${selectedClient.id}`);
    setShowRoutineSelectionDialog(false);
    setSelectedClient(null);
    setClientRoutines([]);
  };

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
              <div className="self-stretch px-3 py-4 bg-neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-2.5">
                <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                  Manage {formatUserDisplay(share.profile)}'s account
                </div>
              </div>
              <div 
                className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5 cursor-pointer"
                onClick={() => handleStartWorkout(share.profile)}
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
                onClick={() => {
                  console.log('Review history clicked for user:', share.profile.id);
                  // Switch to the user first, then navigate to history after a delay
                  switchToUser(share.profile);
                  setTimeout(() => {
                    console.log('Navigating to history after user switch');
                    navigate('/history');
                  }, 200);
                }}
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
              <div className="self-stretch px-3 py-4 bg-neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center gap-2.5">
                <div className="text-center justify-start text-slate-slate-600 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                  {formatUserDisplay(share.profile)}'s permissions
                </div>
              </div>
              <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300">
                <SwiperFormSwitch
                  label="Create routines"
                  checked={share.can_create_routines}
                  onCheckedChange={(checked) => handlePermissionToggle(share.id, 'can_create_routines', checked)}
                />
              </div>
              <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300">
                <SwiperFormSwitch
                  label="Start workouts"
                  checked={share.can_start_workouts}
                  onCheckedChange={(checked) => handlePermissionToggle(share.id, 'can_start_workouts', checked)}
                />
              </div>
              <div className="self-stretch h-[52px] px-3">
                <SwiperFormSwitch
                  label="Review history"
                  checked={share.can_review_history}
                  onCheckedChange={(checked) => handlePermissionToggle(share.id, 'can_review_history', checked)}
                />
              </div>
            </div>
          ))}
          
          {/* Add new person section */}
          <div className="w-full max-w-[500px] inline-flex flex-col justify-start items-start">
            <div className="w-full pt-5 pb-20">
              <div 
                className="w-full pl-3 bg-neutral-100 border-t border-b border-neutral-neutral-300 flex justify-between items-center cursor-pointer"
                onClick={() => setShowAddPersonDialog(true)}
              >
                <div className="justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">share with new person</div>
                <div 
                  data-property-1="left-border" 
                  className="p-2.5 border-l border-neutral-neutral-300 flex justify-start items-center gap-2.5"
                >
                  <Plus className="w-6 h-6 text-neutral-neutral-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Add person dialog */}
          <SwiperDialog
            open={showAddPersonDialog}
            onOpenChange={setShowAddPersonDialog}
            title="Add a manager"
            confirmText="Share Access"
            cancelText="Cancel"
            confirmVariant="outline"
            cancelVariant="destructive"
            onConfirm={handleDialogSubmit}
            onCancel={handleDialogCancel}
          >
            <div className="self-stretch p-3 border-b border-neutral-neutral-300 flex flex-col justify-start items-start gap-2.5">
              <div data-focused="true" data-is-optional="false" data-property-1="default" data-show-field-name="true" data-show-icon="false" data-show-text-labels="true" className="self-stretch min-w-64 rounded flex flex-col justify-center items-start gap-2">
                <div className="self-stretch inline-flex justify-start items-start gap-2">
                  <div className="flex-1 flex justify-between items-start">
                    <div className="flex-1 justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Email</div>
                  </div>
                </div>
                <div className="self-stretch h-11 pl-3 bg-white outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5">
                  <input
                    type="email"
                    value={dialogEmail}
                    onChange={(e) => setDialogEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="flex-1 justify-center text-neutral-neutral-700 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight bg-transparent border-none outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="self-stretch border-b border-neutral-neutral-300 flex flex-col justify-start items-start">
                             <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300">
                 <SwiperFormSwitch
                   label="Create routines"
                   checked={dialogPermissions.can_create_routines}
                   onCheckedChange={(checked) => handleDialogPermissionToggle('can_create_routines', checked)}
                 />
               </div>
              <div className="self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300">
                <SwiperFormSwitch
                  label="Start workouts"
                  checked={dialogPermissions.can_start_workouts}
                  onCheckedChange={(checked) => handleDialogPermissionToggle('can_start_workouts', checked)}
                />
              </div>
              <div className="self-stretch h-[52px] px-3">
                <SwiperFormSwitch
                  label="Review history"
                  checked={dialogPermissions.can_review_history}
                  onCheckedChange={(checked) => handleDialogPermissionToggle('can_review_history', checked)}
                />
              </div>
            </div>
          </SwiperDialog>

          {/* Routine selection dialog */}
          <SwiperDialog
            open={showRoutineSelectionDialog}
            onOpenChange={setShowRoutineSelectionDialog}
            title="Select routine to start workout"
            confirmText=""
            cancelText=""
            onCancel={() => {
              setShowRoutineSelectionDialog(false);
              setSelectedClient(null);
              setClientRoutines([]);
            }}
          >
            <div className="self-stretch flex flex-col justify-start items-start">
              {activeWorkout && (
                <div 
                  className="w-full p-3 bg-green-50 border-b border-neutral-neutral-300 inline-flex flex-col justify-start items-start gap-6 cursor-pointer hover:bg-green-100"
                  onClick={handleJoinActiveWorkout}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-5">
                    <div className="self-stretch flex flex-col justify-start items-start">
                      <div className="w-[452px] justify-start text-green-800 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                        {activeWorkout.routines?.routine_name || 'Active workout'}
                      </div>
                      <div className="text-center justify-center text-green-600 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
                        Active workout in progress
                      </div>
                    </div>
                  </div>
                  <div className="text-center justify-center text-green-600 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
                    Join workout
                  </div>
                </div>
              )}
              {clientRoutines
                .filter(routine => !activeWorkout || routine.id !== activeWorkout.routine_id)
                .map((routine, index) => (
                <div 
                  key={routine.id}
                  className={`w-full p-3 bg-white flex flex-col justify-start items-start gap-6 ${
                    activeWorkout ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-neutral-50'
                  } ${
                    index < clientRoutines.filter(r => !activeWorkout || r.id !== activeWorkout.routine_id).length - 1 ? 'border-b border-neutral-neutral-300' : ''
                  }`}
                  onClick={activeWorkout ? undefined : () => handleRoutineSelect(routine)}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-5">
                    <div className="self-stretch flex flex-col justify-start items-start">
                      <div className={`w-[452px] justify-start text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight ${
                        activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-600'
                      }`}>
                        {routine.routine_name || routine.name || routine.title || `Routine ${routine.id}`}
                      </div>
                      <div className={`text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none ${
                        activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-400'
                      }`}>
                        {routine.lastCompletedText || 'Never completed'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none ${
                    activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-400'
                  }`}>
                    Start workout
                  </div>
                </div>
              ))}
              {clientRoutines.length === 0 && (
                <div className="w-full max-w-[500px] p-3 bg-white border-b border-neutral-neutral-300 flex flex-col justify-start items-start gap-6">
                  <div className="text-center justify-center text-neutral-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">
                    No routines found for this client.
                  </div>
                </div>
              )}
            </div>
          </SwiperDialog>

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