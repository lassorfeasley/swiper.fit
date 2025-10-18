import { useState, useEffect, useRef } from "react";
import { TextInput } from "@/components/molecules/text-input";
import { Button } from "@/components/atoms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoundPlus, UserRoundX, Blend, Plus, Play, Cog, History, MoveUpRight, X, Trash2, AlertCircle, ArrowRight } from "lucide-react";
import ActionPill from "../../components/molecules/action-pill";
import { ActionCard } from "@/components/molecules/action-card";
import AppLayout from "@/components/layout/AppLayout";
import { generateWorkoutName } from "@/lib/utils";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { useAccount } from "@/contexts/AccountContext";
import { useNavigate, Navigate } from "react-router-dom";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SectionWrapperLabel from "@/components/common/Cards/Wrappers/SectionWrapperLabel";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import SwiperDialog from "@/components/molecules/swiper-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { toast } from "sonner";
import { postSlackEvent } from "@/lib/slackEvents";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";
import { getPendingRequests, acceptSharingRequest, declineSharingRequest, createTrainerInvite, createClientInvite } from "../../../api/sharing";
import MainContentSection from "@/components/layout/MainContentSection";
import ManagePermissionsCard from "@/components/molecules/manage-permissions-card";

export default function Sharing() {
  const { user } = useAuth(); // still need auth user for queries where they own shares
  const { isDelegated, switchToUser } = useAccount();
  const navigate = useNavigate();

  // Redirect handled in render below to avoid hook order issues

  const queryClient = useQueryClient();

  // Form
  const [email, setEmail] = useState("");
  const [showAddPerson, setShowAddPerson] = useState(false);

  // Form state for dialog
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [dialogEmail, setDialogEmail] = useState("");
  const [dialogInviteType, setDialogInviteType] = useState('trainer'); // 'trainer' (account manager) or 'client' (account owner)
  const [dialogPermissions, setDialogPermissions] = useState({
    can_create_routines: true,
    can_start_workouts: true,
    can_review_history: true
  });

  // Delete share dialog state
  const [showDeleteShareDialog, setShowDeleteShareDialog] = useState(false);
  const [shareToDeleteId, setShareToDeleteId] = useState(null);
  const [shareToDeleteName, setShareToDeleteName] = useState("");

  // Delete invitation dialog state
  const [showDeleteInvitationDialog, setShowDeleteInvitationDialog] = useState(false);
  const [invitationToDeleteId, setInvitationToDeleteId] = useState(null);

  // Routine selection dialog state
  const [showRoutineSelectionDialog, setShowRoutineSelectionDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRoutines, setClientRoutines] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [dialogMode, setDialogMode] = useState('workout'); // 'workout' or 'manage'
  const subscriptionRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Create routine sheet state
  const [showCreateRoutineSheet, setShowCreateRoutineSheet] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const createNameInputRef = useRef(null);

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



  // New handlers for account manager actions without switching context
  const handleCreateRoutinesForClient = async (clientProfile) => {
    // Ensure dialog shows Manage view (primary create button visible)
    setDialogMode('manage');
    console.log('[Sharing] Opening routine builder for client (account owner):', clientProfile.id);
    setSelectedClient(clientProfile);
    
    // Fetch routines for this specific client (account owner)
    try {
      const { data: routines, error } = await supabase
        .from("routines")
        .select(`
          *,
          workouts!fk_workouts__routines(
            id,
            completed_at
          ),
          routine_exercises!fk_routine_exercises__routines(
            id,
            exercise_order,
            exercises!fk_routine_exercises__exercises(
              id,
              name,
              section
            ),
            routine_sets!fk_routine_sets__routine_exercises(
              id,
              reps,
              weight,
              weight_unit,
              set_order,
              set_variant,
              set_type,
              timed_set_duration
            )
          )
        `)
        .eq("user_id", clientProfile.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching routines:", error);
        return;
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

      console.log("Fetched routines for client (account owner):", clientProfile.id);
      console.log("Routine data structure:", routinesWithCompletion);
      console.log("Number of routines found:", routinesWithCompletion?.length || 0);
      
      setClientRoutines(routinesWithCompletion || []);
      setShowRoutineSelectionDialog(true);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

  const handleReviewHistoryForClient = async (clientProfile) => {
    console.log('[Sharing] Opening history for client (account owner):', clientProfile.id);
    // Navigate to history page with client context
    navigate('/history', { 
      state: { 
        managingForClient: true, 
        clientId: clientProfile.id,
        clientName: formatUserDisplay(clientProfile)
      } 
    });
  };

  // -------------------------------
  // Queries
  // -------------------------------
  const trainerSharesQuery = useQuery({
    queryKey: ["shares_owned_by_me", user?.id],
    queryFn: async () => {
      console.log('[Sharing] Fetching trainers (account managers) for user:', user.id);
      // Get trainers who can manage my account (I am the client/account owner)
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("owner_user_id", user.id)
        .eq("status", "active") // Only get active (accepted) shares
        .is("revoked_at", null); // Only get non-revoked shares

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      // Fetch profile data for the trainers (account managers) who can manage my account
      const trainerIds = shares.map(share => share.delegate_user_id).filter(Boolean);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", trainerIds);

      if (profileError) throw profileError;

      // Combine the data
      const combinedData = shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.delegate_user_id) || {
          email: share.delegate_email,
          first_name: "",
          last_name: ""
        }
      }));
      
      // Sort by profile name for consistent ordering
      return combinedData.sort((a, b) => {
        const nameA = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!user?.id,
  });

  const clientSharesQuery = useQuery({
    queryKey: ["shares_shared_with_me", user?.id],
    queryFn: async () => {
      console.log('[Sharing] Fetching clients (account owners) for user:', user.id);
      // Get clients whose accounts I can manage (I am the trainer/account manager)
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("delegate_user_id", user.id)
        .eq("status", "active") // Only get active (accepted) shares
        .is("revoked_at", null); // Only get non-revoked shares

      if (error) throw error;
      
      if (!shares || shares.length === 0) return [];

      // Fetch profile data for the clients (account owners) whose accounts I can manage
      const clientIds = shares.map(share => share.owner_user_id);
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", clientIds);

      if (profileError) throw profileError;

      // Fetch active workouts for all clients in a single query
      let activeByClient = {};
      if (clientIds && clientIds.length > 0) {
        const { data: activeWorkouts, error: activeErr } = await supabase
          .from('workouts')
          .select(`id, user_id, routine_id, is_active, completed_at, routines!fk_workouts__routines(routine_name)`) 
          .in('user_id', clientIds)
          .eq('is_active', true);
        if (!activeErr && Array.isArray(activeWorkouts)) {
          activeByClient = activeWorkouts.reduce((acc, w) => {
            acc[w.user_id] = w;
            return acc;
          }, {});
        }
      }

      // Combine the data
      const combinedData = shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.owner_user_id) || null,
        activeWorkout: activeByClient[share.owner_user_id] || null
      }));
      
      // Sort by profile name for consistent ordering
      return combinedData.sort((a, b) => {
        const nameA = `${a.profile?.first_name || ''} ${a.profile?.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.profile?.first_name || ''} ${b.profile?.last_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
    enabled: !!user?.id,
  });

  // Query for pending requests (incoming requests for this user)
  const pendingRequestsQuery = useQuery({
    queryKey: ["pending_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Sharing] Fetching pending requests for user:', user.id);
      return await getPendingRequests(user.id);
    },
    enabled: !!user?.id,
  });

  // Query for outgoing requests (requests this user has sent)
  const outgoingRequestsQuery = useQuery({
    queryKey: ["outgoing_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Sharing] Fetching outgoing requests for user:', user.id);
      
      const { data: requests, error } = await supabase
        .from("account_shares")
        .select(`
          id,
          owner_user_id,
          delegate_user_id,
          delegate_email,
          request_type,
          status,
          created_at,
          expires_at,
          can_create_routines,
          can_start_workouts,
          can_review_history
        `)
        .eq("owner_user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch outgoing requests:", error);
        throw new Error("Failed to fetch outgoing requests");
      }

      // Fetch profile data separately for each request, falling back to delegate_email when user hasn't signed up yet
      const requestsWithProfiles = await Promise.all(
        requests.map(async (request) => {
          let profile = null;
          // Prefer lookup by user id when present
          if (request.delegate_user_id) {
            const { data: fetchedProfile } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", request.delegate_user_id)
              .maybeSingle();
            profile = fetchedProfile || null;
          }
          // If we still don't have a profile but we know the email, try email lookup
          if (!profile && request.delegate_email) {
            const { data: fetchedByEmail } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("email", request.delegate_email.toLowerCase())
              .maybeSingle();
            profile = fetchedByEmail || null;
          }
          return {
            ...request,
            // If no profile (non-member invite), include the invitee email for display
            profiles: profile || (request.delegate_email ? { email: request.delegate_email } : null),
          };
        })
      );

      // Filter out expired requests
      const now = new Date();
      return requestsWithProfiles.filter(request => 
        new Date(request.expires_at) > now
      );
    },
    enabled: !!user?.id,
  });

  // Temporarily disabled real-time subscription due to WebSocket connection issues
  // useEffect(() => {
  //   if (!user?.id) return;

  //   // Add a small delay to ensure the component is fully mounted
  //   const timeoutId = setTimeout(() => {
  //     const channel = supabase
  //       .channel('account-shares-realtime')
  //       .on('postgres_changes', {
  //         event: '*',
  //         schema: 'public',
  //         table: 'account_shares'
  //       }, (payload) => {
  //         const record = payload.new || payload.old;
  //         if (record && (record.delegate_user_id === user.id || record.owner_user_id === user.id)) {
  //           queryClient.invalidateQueries(["shares_shared_with_me", user.id]);
  //           queryClient.invalidateQueries(["shares_owned_by_me", user.id]);
  //         }
  //       })
  //       .subscribe((status) => {
  //         // Log status for debugging
  //         if (status === 'SUBSCRIBED') {
  //           console.log('[Sharing] Real-time subscription connected');
  //         } else if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
  //           console.log('[Sharing] Real-time subscription failed:', status);
  //         }
  //       });

  //     subscriptionRef.current = channel;
  //   }, 1000); // 1 second delay

  //   return () => {
  //     clearTimeout(timeoutId);
  //     if (subscriptionRef.current) {
  //       supabase.removeChannel(subscriptionRef.current);
  //       subscriptionRef.current = null;
  //     }
  //   };
  // }, [user?.id, queryClient]);

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
      try {
        postSlackEvent('sharing.connected', {
          share_id: undefined,
          from_account_id: user.id,
          to_account_id: undefined,
          granted_by_user_id: user.id,
          permissions: {
            can_create_routines: permissions.can_create_routines,
            can_start_workouts: permissions.can_start_workouts,
            can_review_history: permissions.can_review_history,
          },
        });
      } catch (_) {}
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

  // Mutations for handling requests
  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await acceptSharingRequest(requestId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pending_requests"]);
      queryClient.invalidateQueries(["outgoing_requests"]);
      queryClient.invalidateQueries(["shares_shared_with_me"]);
      queryClient.invalidateQueries(["shares_owned_by_me"]);
      toast.success("Request accepted successfully");
    },
    onError: (error) => {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId) => {
      return await declineSharingRequest(requestId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pending_requests"]);
      queryClient.invalidateQueries(["outgoing_requests"]);
      toast.success("Request declined");
    },
    onError: (error) => {
      console.error("Error declining request:", error);
      toast.error(error.message || "Failed to decline request");
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

  const handleRemoveShare = (shareId, displayName) => {
    setShareToDeleteId(shareId);
    setShareToDeleteName(displayName || "this user");
    setShowDeleteShareDialog(true);
  };

  const handleAcceptRequest = (requestId) => {
    acceptRequestMutation.mutate(requestId);
  };

  const handleDeclineRequest = (requestId) => {
    if (confirm("Are you sure you want to decline this request?")) {
      declineRequestMutation.mutate(requestId);
    }
  };

  const handleDialogSubmit = async () => {
    if (!dialogEmail.trim()) return;

    try {
      console.log("Dialog form submitted with email:", dialogEmail, "invite type:", dialogInviteType);
      
      if (dialogInviteType === 'trainer') {
        // Creating a trainer invitation (I want to manage their account)
        await createTrainerInvite(dialogEmail.trim(), user.id, dialogPermissions);
        toast.success("Trainer invitation sent successfully");
      } else {
        // Creating a client invitation (I want them to manage my account)
        await createClientInvite(dialogEmail.trim(), user.id, dialogPermissions);
        toast.success("Client invitation sent successfully");
      }

      // Reset form and close dialog
      setDialogEmail("");
      setDialogInviteType('trainer');
      setDialogPermissions({
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true
      });
      setShowAddPersonDialog(false);
      
      // Refresh queries
      queryClient.invalidateQueries(["outgoing_requests"]);
    } catch (error) {
      console.error("Error creating invitation:", error);
      toast.error(error.message || "Failed to send invitation. Please try again.");
    }
  };

  const handleDialogCancel = () => {
    setDialogEmail("");
    setDialogInviteType('trainer');
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
    // Ensure dialog shows the Start view (no primary create button)
    setDialogMode('workout');
    setSelectedClient(clientProfile);
    
    // Fetch active routines for this specific client (account owner) with workout completion data and exercises
    try {
      const { data: routines, error } = await supabase
        .from("routines")
        .select(`
          *,
          workouts!fk_workouts__routines(
            id,
            completed_at
          ),
          routine_exercises!fk_routine_exercises__routines(
            id,
            exercise_order,
            exercises!fk_routine_exercises__exercises(
              id,
              name,
              section
            ),
            routine_sets!fk_routine_sets__routine_exercises(
              id,
              reps,
              weight,
              weight_unit,
              set_order,
              set_variant,
              set_type,
              timed_set_duration
            )
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
          user_id,
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

      console.log("Fetched active routines for client (account owner):", clientProfile.id);
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
    if (activeWorkout && selectedClient) {
      // Switch to the client's (account owner) context so we can see their active workout
      switchToUser(selectedClient);
      
      // Navigate to active workout page
      navigate('/workout/active');
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
      setActiveWorkout(null);
    }
  };

  const handleRoutineManage = (routine) => {
    if (selectedClient) {
      // Switch to the client's (account owner) context
      switchToUser(selectedClient);
      
      // Navigate to routine builder with the specific routine
      navigate(`/routines/${routine.id}/configure`, { 
        state: { 
          managingForClient: true, 
          clientId: selectedClient.id,
          clientName: formatUserDisplay(selectedClient)
        } 
      });
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
      setActiveWorkout(null);
    }
  };

  const handleCreateRoutineForClient = () => {
    // Close the selection dialog so the sheet is the only overlay
    setShowRoutineSelectionDialog(false);

    // Open the naming sheet; insert will happen on confirm
    setNewRoutineName("");
    setShowCreateRoutineSheet(true);
    setTimeout(() => {
      if (createNameInputRef.current) createNameInputRef.current.focus();
    }, 100);
  };

  const handleConfirmCreateRoutineForClient = async () => {
    if (!selectedClient) return;
    const name = (newRoutineName || "").trim().slice(0, MAX_ROUTINE_NAME_LEN);
    if (!name) return;
    try {
      const { data: routine, error } = await supabase
        .from("routines")
        .insert({
          routine_name: name,
          user_id: selectedClient.id,
          is_public: true,
          is_archived: false,
        })
        .select()
        .single();
      if (error || !routine) throw error || new Error("Failed to create routine");

      try {
        postSlackEvent("routine.created", {
          routine_id: routine.id,
          user_id: selectedClient.id,
          routine_name: routine.routine_name || name,
          created_by_trainer: user?.id,
        });
      } catch (_) {}

      // Switch context to client (account owner) so the builder opens in their account
      switchToUser(selectedClient);
      navigate(`/routines/${routine.id}/configure`, {
        state: {
          managingForClient: true,
          clientId: selectedClient.id,
          clientName: formatUserDisplay(selectedClient),
        },
      });

      setShowCreateRoutineSheet(false);
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
    } catch (e) {
      console.error("Error creating routine for client:", e);
      toast.error(e?.message || "Failed to create routine. Please try again.");
    }
  };

  const handleRoutineSelect = async (routine) => {
    try {
      console.log('[Sharing] Starting workout for client:', selectedClient.id);
      console.log('[Sharing] Selected routine:', routine);
      
      // Format the routine data to match what startWorkout expects
      const routineData = {
        id: routine.id,
        routine_name: routine.routine_name,
        routine_exercises: (routine.routine_exercises || []).map((re) => ({
          id: re.id,
          exercise_id: re.exercises.id,
          exercises: {
            name: re.exercises.name,
            section: re.exercises.section
          },
          routine_sets: (re.routine_sets || []).map((rs) => ({
            id: rs.id,
            reps: rs.reps,
            weight: rs.weight,
            weight_unit: rs.weight_unit,
            set_order: rs.set_order,
            set_variant: rs.set_variant,
            set_type: rs.set_type,
            timed_set_duration: rs.timed_set_duration,
          }))
        }))
      };
      
      console.log('[Sharing] Formatted routine data:', routineData);
      
      // Create workout directly for the account owner (not the delegate)
      const workoutName = generateWorkoutName();
      
      // 1) Make sure there isn't already an active workout for the account owner
      try {
        await supabase
          .from("workouts")
          .update({ is_active: false, completed_at: new Date().toISOString() })
          .eq("user_id", selectedClient.id)
          .eq("is_active", true);
      } catch (e) {
        console.warn("Failed to auto-close previous active workouts", e);
      }

      // 2) Create the workout for the account owner
      let workout;
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('workouts')
          .insert({
            user_id: selectedClient.id, // Use account owner's ID, not delegate's
            routine_id: routine.id,
            workout_name: workoutName,
            is_active: true,
            is_public: true,
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        workout = inserted;
        console.log('[Sharing] Workout created for account owner:', workout);
      } catch (e) {
        console.error('Error creating workout for account owner:', e);
        throw new Error('Could not start workout. Please try again.');
      }

      // 3) Snapshot exercises for the workout
      try {
        const snapshotPayload = routineData.routine_exercises.map((progEx, idx) => ({
          workout_id: workout.id,
          exercise_id: progEx.exercise_id,
          exercise_order: idx + 1,
          snapshot_name: progEx.exercises.name || `Exercise ${idx + 1}`,
        }));

        const { data: insertedExercises, error: snapshotErr } = await supabase
          .from('workout_exercises')
          .insert(snapshotPayload)
          .select();

        if (snapshotErr) throw snapshotErr;

        // 4) Snapshot sets for each exercise
        for (const progEx of routineData.routine_exercises) {
          const workoutExercise = insertedExercises.find(we => we.exercise_id === progEx.exercise_id);
          if (workoutExercise && progEx.routine_sets.length > 0) {
            const setsPayload = progEx.routine_sets.map((set, setIdx) => ({
              workout_exercise_id: workoutExercise.id,
              reps: set.reps,
              weight: set.weight,
              weight_unit: set.weight_unit,
              set_order: set.set_order || setIdx + 1,
              set_variant: set.set_variant,
              set_type: set.set_type,
              timed_set_duration: set.timed_set_duration,
              user_id: selectedClient.id, // Use account owner's ID
              account_id: selectedClient.id, // Use account owner's ID
            }));

            const { error: setsErr } = await supabase
              .from('sets')
              .insert(setsPayload);

            if (setsErr) {
              console.error('Error creating sets for exercise:', setsErr);
            }
          }
        }

        console.log('[Sharing] Workout and exercises created successfully for account owner');
      } catch (err) {
        console.error("Error snapshotting exercises for workout:", err);
        throw new Error('Could not create workout exercises. Please try again.');
      }
      
      // Show success message to delegate
      toast.success(`Workout started for ${formatUserDisplay(selectedClient)}. They will be notified when they open the app.`);
      
      // Switch to the account owner's context so delegate can see the active workout in manager mode
      switchToUser(selectedClient);
      
      // Navigate to active workout page so delegate can see what they created
      navigate('/workout/active');
      
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout. Please try again.');
    }
  };

  // Open delete invitation confirmation dialog
  const handleDeleteInvitation = (requestId) => {
    setInvitationToDeleteId(requestId);
    setShowDeleteInvitationDialog(true);
  };

  // Perform delete after confirmation
  const performDeleteInvitation = async () => {
    if (!invitationToDeleteId) return;
    try {
      const { error } = await supabase
        .from("account_shares")
        .delete()
        .eq("id", invitationToDeleteId);

      if (error) {
        console.error("Failed to delete invitation:", error);
        toast.error("Failed to delete invitation");
        return;
      }

      toast.success("Invitation deleted");
      queryClient.invalidateQueries(["pending_requests", user.id]);
      queryClient.invalidateQueries(["outgoing_requests", user.id]);
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setShowDeleteInvitationDialog(false);
      setInvitationToDeleteId(null);
    }
  };

  return (
    <AppLayout title="Trainers" variant="glass">
      <MainContentSection className="!p-0 flex-1 min-h-0">
        <div className="w-full flex flex-col min-h-screen pt-20">
              {/* Requests section - only show if there are requests or errors */}
              {((pendingRequestsQuery.data && pendingRequestsQuery.data.length > 0) ||
                (outgoingRequestsQuery.data && outgoingRequestsQuery.data.length > 0) ||
                pendingRequestsQuery.isError ||
                outgoingRequestsQuery.isError ||
                pendingRequestsQuery.isLoading ||
                outgoingRequestsQuery.isLoading) && (
                <div className="self-stretch inline-flex flex-col justify-start items-center px-5">
                  <div className="w-full max-w-[500px] pb-14 flex flex-col justify-start items-center gap-3">
                    <div className="w-full pb-0 inline-flex justify-center items-center gap-2.5">
                      <div className="flex-1 justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">Requests</div>
                    </div>
                    <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>

                    {/* Incoming requests */}
                    {pendingRequestsQuery.isLoading && (
                      <div className="w-full max-w-[500px] bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-center items-center p-6">
                        <div className="text-neutral-neutral-400 text-sm font-medium">Loading incoming requests...</div>
                      </div>
                    )}
                    {pendingRequestsQuery.data && pendingRequestsQuery.data.length > 0 && (
                      pendingRequestsQuery.data.map((request) => (
                        <div key={request.id} className="SharedWithMeCard w-[500px] max-w-[500px] bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
                          <div className="CardHeader self-stretch p-3 outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-between items-center">
                            <div className="Frame84 flex-1 flex justify-start items-center gap-3">
                              <div className="flex-1 justify-center text-neutral-neutral-700 text-xl font-medium font-['Be_Vietnam_Pro'] leading-tight">
                                {request.request_type === 'trainer_invite'
                                  ? `${formatUserDisplay(request.profiles)} wants you to be their trainer`
                                  : `${formatUserDisplay(request.profiles)} wants you to be their client`
                                }
                              </div>
                            </div>
                            <ActionPill
                              onClick={() => handleDeleteInvitation(request.id)}
                              Icon={Trash2}
                              showText={false}
                              color="neutral"
                              iconColor="neutral"
                              fill={false}
                            />
                          </div>
                          <div className="Frame79 self-stretch p-3 flex flex-col justify-start items-start gap-4">
                            <div className="YourPermissions self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Your permissions:</div>
                            <div className="PermissionRows self-stretch bg-stone-100 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                              <div className="InputWrapper self-stretch h-14 p-3 inline-flex justify-center items-center">
                                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                                    <div className="StartAWorkout self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Start workouts</div>
                                  </div>
                                </div>
                                <div className="LucideIcon relative">
                                  {request.can_start_workouts && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="InputWrapper self-stretch h-14 p-3 bg-neutral-Neutral-50 inline-flex justify-center items-center">
                                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                                    <div className="StartAWorkout self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Create or edit routines</div>
                                  </div>
                                </div>
                                <div className="LucideIcon relative">
                                  {request.can_create_routines && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="InputWrapper self-stretch h-14 p-3 inline-flex justify-center items-center">
                                <div className="Frame75 flex-1 flex justify-start items-center gap-5">
                                  <div className="Frame74 flex-1 inline-flex flex-col justify-center items-start">
                                    <div className="StartAWorkout self-stretch justify-center text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Review history</div>
                                  </div>
                                </div>
                                <div className="LucideIcon relative">
                                  {request.can_review_history && (
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M20 6L9 17L4 12" stroke="var(--green-green-600, #00A63E)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="Frame80 self-stretch inline-flex justify-start items-start gap-2.5 flex-wrap content-start">
                              <SwiperButton
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={acceptRequestMutation.isPending}
                                variant="default"
                                className="flex-1 h-12 min-w-44 px-4 py-2 bg-neutral-neutral-600 rounded-xl flex justify-center items-center gap-2.5"
                              >
                                <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Accept</div>
                              </SwiperButton>
                              <SwiperButton
                                onClick={() => handleDeclineRequest(request.id)}
                                disabled={declineRequestMutation.isPending}
                                variant="destructive"
                                className="flex-1 h-12 min-w-44 px-4 py-2 bg-red-red-400 rounded-xl flex justify-center items-center gap-2.5"
                              >
                                <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Decline</div>
                              </SwiperButton>
                            </div>
                            <div className="ThisInvitationWillExpireIn14Days self-stretch justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                              This invitation will expire in {Math.ceil((new Date(request.expires_at) - new Date()) / (1000 * 60 * 60 * 24))} days.
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Outgoing requests */}
                    {outgoingRequestsQuery.isLoading && (
                      <div className="w-full max-w-[500px] bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-center items-center p-6">
                        <div className="text-neutral-neutral-400 text-sm font-medium">Loading outgoing requests...</div>
                      </div>
                    )}
                    {outgoingRequestsQuery.data && outgoingRequestsQuery.data.length > 0 && (
                      outgoingRequestsQuery.data.map((request) => (
                        <div key={request.id} data-layer="Property 1=Awaiting responce" className="Property1AwaitingResponce w-full max-w-[500px] bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
                          <div data-layer="card-header" className="CardHeader self-stretch p-3 bg-white outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start gap-3">
                            <div data-layer="Frame 86" className="Frame86 self-stretch inline-flex justify-start items-center gap-3">
                              <div data-layer="Frame 85" className="Frame85 flex-1 inline-flex flex-col justify-start items-start">
                                <div data-layer="example@account.com was invited to be your trainer" className="ExampleAccountComWasInvitedToBeYourTrainer justify-center">
                                  <span className="text-neutral-neutral-700 text-sm font-bold font-['Be_Vietnam_Pro'] leading-tight">{formatUserDisplay(request.profiles)} </span>
                                  <span className="text-neutral-neutral-700 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">{request.request_type === 'trainer_invite' ? 'was invited to be your trainer' : 'was invited to be your client'}</span>
                                </div>
                                <div data-layer="Awaiting response" className="AwaitingResponse justify-center text-neutral-neutral-500 text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">Awaiting response</div>
                              </div>
                              <button
                                type="button"
                                aria-label="Delete invitation"
                                onClick={() => handleDeleteInvitation(request.id)}
                                className="LucideIcon w-8 h-8 relative overflow-hidden flex items-center justify-center"
                              >
                                <Trash2 className="w-6 h-7 text-neutral-neutral-700" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}

                    {/* Error states */}
                    {pendingRequestsQuery.isError && (
                      <div className="w-full bg-red-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-red-200 flex flex-col justify-center items-center p-6">
                        <div className="text-red-600 text-sm font-medium">Failed to load incoming requests. Please try again.</div>
                      </div>
                    )}
                    {outgoingRequestsQuery.isError && (
                      <div className="w-full bg-red-50 rounded-xl outline outline-1 outline-offset-[-1px] outline-red-200 flex flex-col justify-center items-center p-6">
                        <div className="text-red-600 text-sm font-medium">Failed to load outgoing requests. Please try again.</div>
                      </div>
                    )}
                    </DeckWrapper>
                  </div>
                </div>
              )}

        {/* Trainers (Account Managers) section */}
        <div className="self-stretch px-5 inline-flex justify-center items-start gap-2.5">
          <div className="pb-20 inline-flex flex-col justify-start items-center w-full max-w-[500px]">
            <div className="flex flex-col justify-start items-start gap-3 w-full">
              <div className="w-full h-14 py-3 inline-flex justify-center items-center gap-2.5">
                <div className="flex-1 justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">Trainers</div>
              </div>
              <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>
                {trainerSharesQuery.data?.map((share) => (
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
                    onRemove={() => handleRemoveShare(share.id, formatUserDisplay(share.profile))}
                  />
                ))}
                <ActionCard
                  text="Invite A Trainer"
                  onClick={() => {
                    setDialogInviteType('trainer');
                    setShowAddPersonDialog(true);
                  }}
                  variant="default"
                  className="w-full h-14 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300"
                />
              </DeckWrapper>
            </div>
          </div>
        </div>

        {/* Clients (Account Owners) section */}
        <div className="self-stretch px-5 inline-flex justify-center items-start gap-2.5">
          <div className="pb-20 inline-flex flex-col justify-start items-center w-full max-w-[500px]">
            <div className="flex flex-col justify-start items-start gap-3 w-full">
              <div className="w-full h-14 inline-flex justify-center items-center gap-2.5">
                <div className="flex-1 justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-normal">Clients</div>
              </div>
              <DeckWrapper className="w-full" maxWidth={null} minWidth={null} paddingX={0} paddingTop={0} paddingBottom={0}>
                {clientSharesQuery.data?.map((share) => (
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
                    onRemove={() => handleRemoveShare(share.id, formatUserDisplay(share.profile))}
                    onStartWorkout={() => {
                      if (!share.can_start_workouts) return;
                      if (share.activeWorkout) {
                        switchToUser(share.profile);
                        navigate('/workout/active');
                        return;
                      }
                      handleStartWorkout(share.profile);
                    }}
                    onCreateRoutines={() => share.can_create_routines && handleCreateRoutinesForClient(share.profile)}
                    onReviewHistory={() => share.can_review_history && handleReviewHistoryForClient(share.profile)}
                  />
                ))}
                <ActionCard
                  text="Invite A Client"
                  onClick={() => {
                    setDialogInviteType('client');
                    setShowAddPersonDialog(true);
                  }}
                  variant="default"
                  className="w-full h-14 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300"
                />
              </DeckWrapper>
            </div>
          </div>
        </div>

        {/* Add person dialog */}
        <SwiperDialog
          open={showAddPersonDialog}
          onOpenChange={setShowAddPersonDialog}
          title={dialogInviteType === 'trainer' ? "Invite a trainer" : "Invite a client"}
          confirmText={dialogInviteType === 'trainer' ? "Invite trainer" : "Invite client"}
          cancelText="Cancel"
          confirmVariant="outline"
          cancelVariant="destructive"
          onConfirm={handleDialogSubmit}
          onCancel={handleDialogCancel}
          containerClassName="bg-stone-100"
        >
          <div className="self-stretch flex flex-col justify-start items-start gap-0">
            <div className="self-stretch min-w-64 rounded flex flex-col justify-center items-start gap-2">
              <div className="self-stretch inline-flex justify-start items-start gap-2">
                <div className="flex-1 flex justify-between items-start">
                  <div className="flex-1 justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                    {dialogInviteType === 'trainer' ? "Trainer's email" : "Client's email"}
                  </div>
                </div>
              </div>
              <div className="self-stretch h-11 pl-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5">
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
          <div className="self-stretch flex flex-col justify-start items-start gap-0">
            <div className="self-stretch rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
              {dialogInviteType === 'client' ? (
                <div className="self-stretch rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                  <SwiperFormSwitch
                    label="Create or edit routines"
                    checked={dialogPermissions.can_create_routines}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_create_routines', checked)}
                    className="bg-white"
                  />
                  <SwiperFormSwitch
                    label="Start a workout"
                    checked={dialogPermissions.can_start_workouts}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_start_workouts', checked)}
                    className="bg-neutral-Neutral-50"
                  />
                  <SwiperFormSwitch
                    label="Review history"
                    checked={dialogPermissions.can_review_history}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_review_history', checked)}
                    className="bg-white"
                  />
                </div>
              ) : (
                <>
                  <SwiperFormSwitch
                    label="Create or edit routines"
                    checked={dialogPermissions.can_create_routines}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_create_routines', checked)}
                    className="bg-white"
                  />
                  <SwiperFormSwitch
                    label="Start a workout"
                    checked={dialogPermissions.can_start_workouts}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_start_workouts', checked)}
                    className="bg-neutral-Neutral-50"
                  />
                  <SwiperFormSwitch
                    label="Review history"
                    checked={dialogPermissions.can_review_history}
                    onCheckedChange={(checked) => handleDialogPermissionToggle('can_review_history', checked)}
                    className="bg-white"
                  />
                </>
              )}
            </div>
          </div>
          <div className="self-stretch justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
            This invitation will expire in {dialogInviteType === 'client' ? '14' : '14'} days.
          </div>
        </SwiperDialog>

          {/* Routine selection dialog */}
          <SwiperDialog
            open={showRoutineSelectionDialog}
            onOpenChange={setShowRoutineSelectionDialog}
            title={dialogMode === 'workout' ? `Start a workout for ${formatUserDisplay(selectedClient)}` : `${formatUserDisplay(selectedClient)}'s routines`}
            hideFooter
            containerClassName="bg-stone-100"
            headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-b border-neutral-neutral-300 inline-flex justify-start items-center"
            headerRight={
              <button
                onClick={() => setShowRoutineSelectionDialog(false)}
                className="w-4 h-4 bg-red-300 rounded-full border border-neutral-neutral-300 hover:bg-red-400 transition-colors cursor-pointer focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-neutral-neutral-300"
                aria-label="Close dialog"
              />
            }
            onCancel={() => {
              setShowRoutineSelectionDialog(false);
              setSelectedClient(null);
              setClientRoutines([]);
              setDialogMode('workout');
            }}
          >
            {dialogMode !== 'workout' && (
              <SwiperButton
                variant="primary-action"
                className="self-stretch w-full"
                onClick={handleCreateRoutineForClient}
              >
                <span className="flex-1">Create new routine</span>
                <Plus className="w-6 h-6" strokeWidth={2} />
              </SwiperButton>
            )}

            <DeckWrapper 
              className="self-stretch w-full flex flex-col justify-center items-center gap-3 px-0"
              maxWidth={null}
              minWidth={null}
              paddingX={0}
              paddingTop={0}
              paddingBottom={0}
            >
            {dialogMode === 'workout' && activeWorkout && (
              <div 
                data-layer="Routine Card" 
                className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden cursor-pointer hover:bg-green-50"
                onClick={handleJoinActiveWorkout}
              >
                <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
                  <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
                    <div data-layer="Biceps and chest" className="BicepsAndChest w-[452px] justify-start text-green-800 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {activeWorkout.routines?.routine_name || 'Active workout'}
                    </div>
                    <div data-layer="Completed 5 days ago" className="Completed5DaysAgo text-center justify-center text-green-600 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
                      Active workout in progress
                    </div>
                  </div>
                </div>
                <div data-layer="Frame 5014" className="Frame5014 inline-flex justify-start items-start gap-2">
                  <div 
                    data-layer="Frame 5012" 
                    className="Frame5012 h-7 px-2 bg-green-600 rounded-[50px] flex justify-start items-center gap-1 cursor-pointer"
                  >
                    <div data-layer="lucide-icon" className="LucideIcon w-4 h-4 relative flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                    <div data-layer="Start" className="Start justify-center text-white text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight">Join</div>
                  </div>
                </div>
              </div>
            )}
            {clientRoutines
              .filter(routine => dialogMode === 'workout' ? (!activeWorkout || routine.id !== activeWorkout.routine_id) : true)
              .map((routine, index) => (
              <div 
                key={routine.id}
                data-layer="Routine Card" 
                className={`RoutineCard w-full max-w-[500px] p-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden ${
                  dialogMode === 'workout' && activeWorkout ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-neutral-50'
                }`}
                onClick={dialogMode === 'workout' && activeWorkout ? undefined : () => dialogMode === 'workout' ? handleRoutineSelect(routine) : handleRoutineManage(routine)}
              >
                <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
                  <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
                    <div data-layer="Biceps and chest" className={`BicepsAndChest w-[452px] justify-start text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight ${
                      dialogMode === 'workout' && activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-600'
                    }`}>
                      {routine.routine_name || routine.name || routine.title || `Routine ${routine.id}`}
                    </div>
                    <div data-layer="Completed 5 days ago" className={`Completed5DaysAgo text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none ${
                      dialogMode === 'workout' && activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-400'
                    }`}>
                      {routine.lastCompletedText || 'Never completed'}
                    </div>
                  </div>
                </div>
                <div data-layer="Frame 5014" className="Frame5014 inline-flex justify-start items-start gap-2">
                  {dialogMode === 'workout' ? (
                    <div 
                      data-layer="Frame 5012" 
                      className={`Frame5012 h-7 px-2 rounded-[50px] flex justify-start items-center gap-1 ${
                        activeWorkout ? 'bg-neutral-300' : 'bg-green-600'
                      } ${activeWorkout ? '' : 'cursor-pointer'}`}
                      onClick={activeWorkout ? undefined : (e) => {
                        e.stopPropagation();
                        handleRoutineSelect(routine);
                      }}
                    >
                      <div data-layer="lucide-icon" className="LucideIcon w-4 h-4 relative flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <div data-layer="Start" className={`Start justify-center text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight ${
                        activeWorkout ? 'text-neutral-500' : 'text-white'
                      }`}>
                        Start
                      </div>
                    </div>
                  ) : (
                    <div 
                      data-layer="Frame 5013" 
                      className="Frame5013 w-7 h-7 bg-neutral-200 rounded-[50px] flex justify-center items-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoutineManage(routine);
                      }}
                    >
                      <div data-layer="lucide-icon" className="LucideIcon w-6 h-6 relative overflow-hidden flex items-center justify-center">
                        <Cog className="w-5 h-5 text-neutral-500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {clientRoutines.length === 0 && (
              <div data-layer="Routine Card" className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden">
                <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
                  <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
                    <div data-layer="Biceps and chest" className="BicepsAndChest w-[452px] justify-start text-neutral-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight text-center">
                      {dialogMode === 'workout' ? 'No routines found for this client.' : 'No routines found for this account.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </DeckWrapper>
          </SwiperDialog>

          {/* Create routine name sheet (appears over Sharing) */}
          <SwiperForm
            open={showCreateRoutineSheet}
            onOpenChange={setShowCreateRoutineSheet}
            title=""
            description={`Create a new workout routine for ${formatUserDisplay(selectedClient)}`}
            leftAction={() => {
              setShowCreateRoutineSheet(false);
              // Reopen routine selection dialog to keep the user's context
              setTimeout(() => setShowRoutineSelectionDialog(true), 0);
            }}
            rightAction={handleConfirmCreateRoutineForClient}
            rightEnabled={(newRoutineName || "").trim().length > 0}
            rightText="Create"
            leftText="Cancel"
          >
            <SwiperForm.Section bordered={false}>
              <div className="w-full flex flex-col">
                <div className="w-full flex justify-between items-center mb-2">
                  <div className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Name routine</div>
                  <div
                    className={`${(newRoutineName || '').length >= MAX_ROUTINE_NAME_LEN ? 'text-red-400' : 'text-neutral-400'} text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight`}
                    aria-live="polite"
                  >
                    {(newRoutineName || '').length} of {MAX_ROUTINE_NAME_LEN} characters
                  </div>
                </div>
                <TextInput
                  value={newRoutineName}
                  onChange={(e) => setNewRoutineName(e.target.value)}
                  ref={createNameInputRef}
                  maxLength={MAX_ROUTINE_NAME_LEN}
                  error={(newRoutineName || '').length >= MAX_ROUTINE_NAME_LEN}
                />
              </div>
            </SwiperForm.Section>
          </SwiperForm>
        </div>
        {/* Delete Share Confirmation Dialog */}
        <SwiperDialog
          open={showDeleteInvitationDialog}
          onOpenChange={setShowDeleteInvitationDialog}
          title="Delete request?"
          confirmText="Yes"
          cancelText="No"
          confirmVariant="destructive"
          cancelVariant="outline"
          onConfirm={performDeleteInvitation}
          onCancel={() => {
            setShowDeleteInvitationDialog(false);
            setInvitationToDeleteId(null);
          }}
        />
        
        <SwiperDialog
          open={showDeleteShareDialog}
          onOpenChange={setShowDeleteShareDialog}
          title="Disconnect trainer"
          description={`${shareToDeleteName} will no longer be a trainer on your account.`}
          confirmText="Remove access"
          cancelText="Cancel"
          confirmVariant="destructive"
          cancelVariant="outline"
          onConfirm={() => {
            if (shareToDeleteId) {
              deleteShareMutation.mutate(shareToDeleteId);
            }
            setShowDeleteShareDialog(false);
            setShareToDeleteId(null);
          }}
          onCancel={() => {
            setShowDeleteShareDialog(false);
            setShareToDeleteId(null);
          }}
        />
      </MainContentSection>
    </AppLayout>
  );
} 