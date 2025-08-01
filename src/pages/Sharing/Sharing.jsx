import { useState, useEffect, useRef } from "react";
import { TextInput } from "@/components/molecules/text-input";
import { Button } from "@/components/atoms/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { UserRoundPlus, UserRoundX, Blend, Plus, Play, Settings, History, MoveUpRight, X } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { generateWorkoutName } from "@/lib/utils";
import EditableTextInput from "@/components/molecules/editable-text-input";
import { useAccount } from "@/contexts/AccountContext";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useNavigate, Navigate } from "react-router-dom";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import SwiperFormSwitch from "@/components/molecules/swiper-form-switch";
import SectionWrapperLabel from "@/components/common/Cards/Wrappers/SectionWrapperLabel";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import SwiperDialog from "@/components/molecules/swiper-dialog";
import { toast } from "sonner";

export default function Sharing() {
  const { user } = useAuth(); // still need auth user for queries where they own shares
  const { isDelegated, switchToUser } = useAccount();
  const { startWorkout } = useActiveWorkout();
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
  const [dialogMode, setDialogMode] = useState('workout'); // 'workout' or 'manage'
  const subscriptionRef = useRef(null);
  const retryTimeoutRef = useRef(null);

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



  // New handlers for delegate actions without switching context
  const handleCreateRoutinesForOwner = async (ownerProfile) => {
    console.log('[Sharing] Opening routine builder for owner:', ownerProfile.id);
    setSelectedClient(ownerProfile);
    setDialogMode('manage');
    
    // Fetch routines for this specific owner
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
        .eq("user_id", ownerProfile.id)
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

      console.log("Fetched routines for owner:", ownerProfile.id);
      console.log("Routine data structure:", routinesWithCompletion);
      console.log("Number of routines found:", routinesWithCompletion?.length || 0);
      
      setClientRoutines(routinesWithCompletion || []);
      setShowRoutineSelectionDialog(true);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

  const handleReviewHistoryForOwner = async (ownerProfile) => {
    console.log('[Sharing] Opening history for owner:', ownerProfile.id);
    // Navigate to history page with owner context
    navigate('/history', { 
      state: { 
        managingForOwner: true, 
        ownerId: ownerProfile.id,
        ownerName: formatUserDisplay(ownerProfile)
      } 
    });
  };

  // -------------------------------
  // Queries
  // -------------------------------
  const ownerSharesQuery = useQuery({
    queryKey: ["shares_owned_by_me", user?.id],
    queryFn: async () => {
      console.log('[Sharing] Fetching owned by me data for user:', user.id);
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

  const sharedWithMeQuery = useQuery({
    queryKey: ["shares_shared_with_me", user?.id],
    queryFn: async () => {
      console.log('[Sharing] Fetching shared with me data for user:', user.id);
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
      const combinedData = shares.map(share => ({
        ...share,
        profile: profiles?.find(profile => profile.id === share.owner_user_id) || null
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
    
    // Fetch active routines for this specific client with workout completion data and exercises
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
    if (activeWorkout && selectedClient) {
      // Switch to the account owner's context so we can see their active workout
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
      // Switch to the account owner's context
      switchToUser(selectedClient);
      
      // Navigate to routine builder with the specific routine
      navigate(`/routines/${routine.id}/configure`, { 
        state: { 
          managingForOwner: true, 
          ownerId: selectedClient.id,
          ownerName: formatUserDisplay(selectedClient)
        } 
      });
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
      setActiveWorkout(null);
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

  return (
    <AppLayout title="" hideHeader>
      <div className="w-full flex flex-col min-h-screen">
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
                className={`self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5 ${share.can_start_workouts ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => share.can_start_workouts && handleStartWorkout(share.profile)}
                title={!share.can_start_workouts ? "Permission denied by account owner" : ""}
              >
                <div className={`flex-1 justify-center text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight ${share.can_start_workouts ? 'text-neutral-700' : 'text-neutral-300'}`}>
                  Start a workout
                </div>
                {share.can_start_workouts ? (
                  <MoveUpRight className="w-4 h-4 text-neutral-700" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300" />
                )}
              </div>
              <div 
                className={`self-stretch h-[52px] px-3 border-b-[0.50px] border-neutral-neutral-300 inline-flex justify-end items-center gap-2.5 ${share.can_create_routines ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => share.can_create_routines && handleCreateRoutinesForOwner(share.profile)}
                title={!share.can_create_routines ? "Permission denied by account owner" : ""}
              >
                <div className={`flex-1 justify-center text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight ${share.can_create_routines ? 'text-neutral-700' : 'text-neutral-300'}`}>
                  Create or edit routines
                </div>
                {share.can_create_routines ? (
                  <MoveUpRight className="w-4 h-4 text-neutral-700" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300" />
                )}
              </div>
              <div 
                className={`self-stretch h-[52px] px-3 inline-flex justify-end items-center gap-2.5 ${share.can_review_history ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                onClick={() => share.can_review_history && handleReviewHistoryForOwner(share.profile)}
                title={!share.can_review_history ? "Permission denied by account owner" : ""}
              >
                <div className={`flex-1 justify-center text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight ${share.can_review_history ? 'text-neutral-700' : 'text-neutral-300'}`}>
                  Review {formatUserDisplay(share.profile)}'s history
                </div>
                {share.can_review_history ? (
                  <MoveUpRight className="w-4 h-4 text-neutral-700" />
                ) : (
                  <X className="w-4 h-4 text-neutral-300" />
                )}
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
          className="border-t-0 flex-1"
          
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
            title={dialogMode === 'workout' ? "Select routine to start workout" : `Manage ${formatUserDisplay(selectedClient)}'s routines`}
            confirmText=""
            cancelText=""
            onCancel={() => {
              setShowRoutineSelectionDialog(false);
              setSelectedClient(null);
              setClientRoutines([]);
              setDialogMode('workout');
            }}
          >
            <div className="self-stretch flex flex-col justify-start items-start">
              {dialogMode === 'workout' && activeWorkout && (
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
                .filter(routine => dialogMode === 'workout' ? (!activeWorkout || routine.id !== activeWorkout.routine_id) : true)
                .map((routine, index) => (
                <div 
                  key={routine.id}
                  className={`w-full p-3 bg-white flex flex-col justify-start items-start gap-6 ${
                    dialogMode === 'workout' && activeWorkout ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-neutral-50'
                  } ${
                    index < clientRoutines.filter(r => dialogMode === 'workout' ? (!activeWorkout || r.id !== activeWorkout.routine_id) : true).length - 1 ? 'border-b border-neutral-neutral-300' : ''
                  }`}
                  onClick={dialogMode === 'workout' && activeWorkout ? undefined : () => dialogMode === 'workout' ? handleRoutineSelect(routine) : handleRoutineManage(routine)}
                >
                  <div className="self-stretch flex flex-col justify-start items-start gap-5">
                    <div className="self-stretch flex flex-col justify-start items-start">
                      <div className={`w-[452px] justify-start text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight ${
                        dialogMode === 'workout' && activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-600'
                      }`}>
                        {routine.routine_name || routine.name || routine.title || `Routine ${routine.id}`}
                      </div>
                      <div className={`text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none ${
                        dialogMode === 'workout' && activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-400'
                      }`}>
                        {routine.lastCompletedText || 'Never completed'}
                      </div>
                    </div>
                  </div>
                  <div className={`text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none ${
                    dialogMode === 'workout' && activeWorkout ? 'text-neutral-300' : 'text-neutral-neutral-400'
                  }`}>
                    {dialogMode === 'workout' ? 'Start workout' : 'Edit routine'}
                  </div>
                </div>
              ))}
              {clientRoutines.length === 0 && (
                <div className="w-full max-w-[500px] p-3 bg-white border-b border-neutral-neutral-300 flex flex-col justify-start items-start gap-6">
                  <div className="text-center justify-center text-neutral-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">
                    {dialogMode === 'workout' ? 'No routines found for this client.' : 'No routines found for this account.'}
                  </div>
                </div>
              )}
              {dialogMode === 'manage' && (
                <div 
                  className="w-full p-3 bg-white border-t border-neutral-neutral-300 flex flex-col justify-start items-start gap-6 cursor-pointer hover:bg-neutral-50"
                  onClick={() => {
                    if (selectedClient) {
                      // Switch to the account owner's context
                      switchToUser(selectedClient);
                      
                      // Navigate to routine builder to create a new routine
                      navigate('/routines', { 
                        state: { 
                          managingForOwner: true, 
                          ownerId: selectedClient.id,
                          ownerName: formatUserDisplay(selectedClient)
                        } 
                      });
                      setShowRoutineSelectionDialog(false);
                      setSelectedClient(null);
                      setClientRoutines([]);
                      setActiveWorkout(null);
                    }
                  }}
                >
                  <div className="text-center justify-center text-neutral-neutral-600 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none">
                    Create new routine
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