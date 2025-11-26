import React, { useEffect, useState, useRef } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { Navigate, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/supabaseClient";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { toast } from "@/lib/toastReplacement";
import SwiperDialog from "@/components/shared/SwiperDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import SwiperForm from "@/components/shared/SwiperForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import { postSlackEvent } from "@/lib/slackEvents";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";
import {
  inviteClientToBeManaged,
  inviteTrainerToManage,
  cancelInvitationRequest,
  rejectInvitation,
} from "@/lib/sharingApi";
import MainContentSection from "@/components/layout/MainContentSection";
import { generateWorkoutName } from "@/lib/utils";
import AccountSettingsMenu from "@/components/shared/AccountSettingsMenu";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import { useFormatUserDisplay } from "@/hooks/useFormatUserDisplay";

import SharingRequests from "@/features/account/components/SharingRequests";
import TrainersList from "@/features/account/components/TrainersList";
import ClientsList from "@/features/account/components/ClientsList";
import ProfileSettings from "@/features/account/components/ProfileSettings";
import LoginSettings from "@/features/account/components/LoginSettings";
import InviteDialog from "@/features/account/dialogs/InviteDialog";
import RoutineSelectionDialog from "@/features/account/dialogs/RoutineSelectionDialog";

const Account = () => {
  const { isDelegated, switchToUser } = useAccount();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // Check if we're exiting delegation (passed via navigation state)
  const isExitingDelegation = location.state?.exitingDelegation === true;
  // Track if we're processing a section param to prevent premature redirects
  const isProcessingSection = searchParams.get('section') !== null;
  
  // Also check the URL directly as a fallback (in case searchParams haven't parsed yet)
  const urlHasSectionParam = location.search.includes('section=');

  // Section navigation state
  const [activeSection, setActiveSection] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeclineConfirmDialog, setShowDeclineConfirmDialog] = useState(false);
  const [requestToDecline, setRequestToDecline] = useState<any | null>(null);
  const hasSetSectionRef = useRef(false);

  // Section name mapping for breadcrumbs
  const sectionNames = {
    'sharing-requests': 'Sharing requests',
    'trainers': 'Trainers',
    'clients': 'Clients',
    'personal-info': 'Personal information',
    'email-password': 'Login and password',
  };

  const notifyClientWorkoutStarted = React.useCallback(async (clientId: string, workoutId: string) => {
    try {
      const channelName = `active-workout-notify-${clientId}`;
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { self: false }
        }
      });

      await channel.subscribe();
      await channel.send({
        type: 'broadcast',
        event: 'workout-started',
        payload: {
          clientId,
          workoutId,
          triggeredBy: user?.id
        }
      });
      await channel.unsubscribe();
      console.log('[Account] Notified client about workout start via channel:', channelName);
    } catch (error) {
      console.error('[Account] Failed to notify client about workout start:', error);
    }
  }, [user?.id]);

  // Handle query parameter for section navigation
  useEffect(() => {
    const sectionParam = searchParams.get('section');
    const resetParam = searchParams.get('reset');
    
    // Handle reset to main page
    if (resetParam === 'true') {
      setActiveSection(null);
      hasSetSectionRef.current = false;
      searchParams.delete('reset');
      setSearchParams(searchParams, { replace: true });
      return;
    }
    
    // Handle section navigation
    if (sectionParam && ['sharing-requests', 'trainers', 'clients', 'personal-info', 'email-password'].includes(sectionParam)) {
      setActiveSection(sectionParam);
      hasSetSectionRef.current = true;
      // Remove the query parameter from URL after setting the section
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('section');
      setSearchParams(newParams, { replace: true });
      return; // Early return to prevent reset logic
    }
    
    // Only reset if we explicitly navigate to /account with no params and we haven't just set a section
    if (!sectionParam && !resetParam && location.pathname === '/account' && location.search === '' && !hasSetSectionRef.current) {
      setActiveSection(null);
    }
    
    // Reset the flag after processing to allow future resets
    if (hasSetSectionRef.current && !sectionParam) {
      // Use a small delay to ensure the URL update has been processed
      const timer = setTimeout(() => {
        hasSetSectionRef.current = false;
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, location.pathname, location.search]);

  // Account info state
  const [loading, setLoading] = useState(true); // Kept for initial user check? Or remove?
  // We'll keep loading state for the initial auth check
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Trainers functionality state
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddPersonDialog, setShowAddPersonDialog] = useState(false);
  const [dialogEmail, setDialogEmail] = useState("");
  const [dialogInviteType, setDialogInviteType] = useState('trainer');
  const [dialogPermissions, setDialogPermissions] = useState({
    can_create_routines: true,
    can_start_workouts: true,
    can_review_history: true
  });
  const [dialogMirrorInvite, setDialogMirrorInvite] = useState(false);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  const [inviteeEmail, setInviteeEmail] = useState("");
  const [showDeleteShareDialog, setShowDeleteShareDialog] = useState(false);
  const [shareToDeleteId, setShareToDeleteId] = useState(null);
  const [shareToDeleteName, setShareToDeleteName] = useState("");
  const [showDeleteInvitationDialog, setShowDeleteInvitationDialog] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<{ id: string; source: 'legacy' | 'token' } | null>(null);
  const [showRoutineSelectionDialog, setShowRoutineSelectionDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRoutines, setClientRoutines] = useState([]);
  const [dialogMode, setDialogMode] = useState('workout');
  const retryTimeoutRef = useRef(null);
  const [showCreateRoutineSheet, setShowCreateRoutineSheet] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const createNameInputRef = useRef(null);

  // Helper function to format user display name
  const formatUserDisplay = useFormatUserDisplay();

  // Account info queries and handlers
  const handleDeleteAccount = async () => {
    try {
      await supabase.from("profiles").delete().eq("id", user.id);
      toast.success("Account deletion requested (admin action required)");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const handleConfirmDelete = async () => {
    if (!deletePassword) {
      toast.error("Please enter your password");
      return;
    }
    handleDeleteAccount();
    setDeleteConfirmOpen(false);
    setDeletePassword("");
  };

  // Real-time subscription for account_shares changes
  useEffect(() => {
    if (!user?.id) return;

    console.log('[Account] Setting up real-time subscription for account_shares');

    const channel = supabase
      .channel(`account-shares-${user.id}`)
      // Listen for changes where user is the owner (trainers/outgoing requests)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'account_shares',
        filter: `owner_user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[Account] Account share change (as owner):', payload.eventType, payload);
        
        // Invalidate queries for owned shares and outgoing requests
        queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me", user.id] });
        queryClient.invalidateQueries({ queryKey: ["outgoing_requests", user.id] });
      })
      // Listen for changes where user is the delegate (clients/incoming requests)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'account_shares',
        filter: `delegate_user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[Account] Account share change (as delegate):', payload.eventType, payload);
        
        // Invalidate queries for shared with me and pending requests
        queryClient.invalidateQueries({ queryKey: ["shares_shared_with_me", user.id] });
        queryClient.invalidateQueries({ queryKey: ["pending_requests", user.id] });
      })
      .subscribe();

    return () => {
      console.log('[Account] Cleaning up real-time subscription');
      channel.unsubscribe();
    };
  }, [user?.id, queryClient]);

  // Trainers functionality mutations
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
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
      setShowAddPerson(false);
      try {
        postSlackEvent('sharing.connected', {
          share_id: undefined,
          from_account_id: user.id,
          to_account_id: undefined,
          granted_by_user_id: user.id,
          permissions: {
            can_create_routines: dialogPermissions.can_create_routines,
            can_start_workouts: dialogPermissions.can_start_workouts,
            can_review_history: dialogPermissions.can_review_history,
          },
        });
      } catch (_) {}
    },
    onError: (error) => {
      console.error("Mutation onError called:", error);
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: async (shareId) => {
      const { error } = await supabase
        .from("account_shares")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", shareId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
    },
  });

  // Trainers functionality handlers
  const handleCreateRoutinesForClient = async (clientProfile) => {
    setDialogMode('manage');
    console.log('[Account] Opening routine builder for client (account owner):', clientProfile.id);
    setSelectedClient(clientProfile);
    
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
            exercise_id,
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

      const routinesWithCompletion = (routines || []).map((routine) => {
        const completedWorkouts = (routine.workouts || []).filter(w => w.completed_at);
        const lastCompletedWorkout = completedWorkouts.length > 0 
          ? completedWorkouts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
          : null;
        
        let lastCompletedText = null;
        if (lastCompletedWorkout) {
          const completedDate = new Date(lastCompletedWorkout.completed_at);
          const now = new Date();
          
          const completedDateOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
            const diffTime = Math.abs(nowDateOnly.getTime() - completedDateOnly.getTime());
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
    console.log('[Account] Opening history for client (account owner):', clientProfile.id);
    navigate('/history', { 
      state: { 
        managingForClient: true, 
        clientId: clientProfile.id,
        clientName: formatUserDisplay(clientProfile)
      } 
    });
  };

  const handleStartWorkout = async (clientProfile) => {
    setDialogMode('workout');
    setSelectedClient(clientProfile);
    console.log('[Account] handleStartWorkout called for client:', clientProfile.id);
    
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
            exercise_id,
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

      const routinesWithCompletion = (routines || []).map((routine) => {
        const completedWorkouts = (routine.workouts || []).filter(w => w.completed_at);
        const lastCompletedWorkout = completedWorkouts.length > 0 
          ? completedWorkouts.sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())[0]
          : null;
        
        let lastCompletedText = null;
        if (lastCompletedWorkout) {
          const completedDate = new Date(lastCompletedWorkout.completed_at);
          const now = new Date();
          
          const completedDateOnly = new Date(completedDate.getFullYear(), completedDate.getMonth(), completedDate.getDate());
          const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
            const diffTime = Math.abs(nowDateOnly.getTime() - completedDateOnly.getTime());
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
      
      setClientRoutines(routinesWithCompletion || []);
      setShowRoutineSelectionDialog(true);
    } catch (error) {
      console.error("Error fetching routines:", error);
    }
  };

  const handleRoutineManage = (routine) => {
    if (selectedClient) {
      console.log('[Account] handleRoutineManage called for routine:', routine.id);
      console.log('[Account] Switching to client:', selectedClient.id);
      console.log('[Account] Will navigate to:', `/routines/${routine.id}/configure`);
      
      switchToUser(selectedClient);
      
      // Use setTimeout to ensure context switch completes before navigation
      setTimeout(() => {
        console.log('[Account] Navigating to routine builder:', `/routines/${routine.id}/configure`);
        navigate(`/routines/${routine.id}/configure`, { 
          state: { 
            managingForClient: true, 
            clientId: selectedClient.id,
            clientName: formatUserDisplay(selectedClient)
          } 
        });
      }, 100);
      
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
    }
  };

  const handleCreateRoutineForClient = () => {
    setShowRoutineSelectionDialog(false);
    setNewRoutineName("");
    setShowCreateRoutineSheet(true);
    setTimeout(() => {
      if (createNameInputRef.current) createNameInputRef.current.focus();
    }, 100);
  };

  const handleConfirmCreateRoutineForClient = async (nameOverride?: string) => {
    if (!selectedClient) return;
    const name = (nameOverride || newRoutineName || "").trim().slice(0, MAX_ROUTINE_NAME_LEN);
    if (!name) return;
    try {
      const { data: routine, error } = await supabase
        .from("routines")
        .insert({
          routine_name: name,
          user_id: selectedClient.id,
          is_archived: false,
          created_by: user.id,
          shared_by: selectedClient.id,
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

      // Switch to client context and navigate to routine builder
      console.log('[Account] Switching to client context and navigating to routine builder');
      switchToUser(selectedClient);
      
      // Use setTimeout to ensure context switch completes before navigation
      setTimeout(() => {
        try {
          console.log('[Account] Navigating to routine builder:', `/routines/${routine.id}/configure`);
          navigate(`/routines/${routine.id}/configure`, {
            state: {
              managingForClient: true,
              clientId: selectedClient.id,
              clientName: formatUserDisplay(selectedClient),
            },
          });
        } catch (navError) {
          console.error('[Account] Navigation failed:', navError);
          toast.error('Failed to navigate to routine builder. Please try again.');
        }
      }, 100);

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
    console.log('[Account] handleRoutineSelect called');
    console.log('[Account] selectedClient:', selectedClient);
    console.log('[Account] selectedClient.id:', selectedClient?.id);
    
    // Capture the client ID at the start to ensure consistency throughout the function
    if (!selectedClient?.id) {
      console.error('[Account] Cannot start workout: selectedClient is null or missing ID');
      console.error('[Account] Full selectedClient object:', JSON.stringify(selectedClient, null, 2));
      toast.error('Client not selected. Please try again.');
      return;
    }
    
    const clientId = selectedClient.id;
    const clientProfile = selectedClient;
    
    console.log('[Account] Captured clientId:', clientId);
    console.log('[Account] Captured clientProfile:', clientProfile);
    
    try {
      console.log('[Account] Starting workout for client:', clientId);
      console.log('[Account] Selected routine:', routine);
      
      const routineData = {
        id: routine.id,
        routine_name: routine.routine_name,
        routine_exercises: (routine.routine_exercises || []).map((re) => ({
          id: re.id,
          exercise_id: re.exercise_id,
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
      
      console.log('[Account] Formatted routine data:', routineData);
      
      const workoutName = generateWorkoutName();
      
      try {
        await supabase
          .from("workouts")
          .update({ is_active: false, completed_at: new Date().toISOString() })
          .eq("user_id", clientId)
          .eq("is_active", true);
      } catch (e) {
        console.warn("Failed to auto-close previous active workouts", e);
      }

      let workout;
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('workouts')
          .insert({
            user_id: clientId,
            routine_id: routine.id,
            workout_name: workoutName,
            is_active: true,
            running_since: new Date().toISOString(),
            active_seconds_accumulated: 0
          })
          .select('id, routine_id')
          .single();
        if (insertErr) throw insertErr;
        workout = inserted;
        console.log('[Account] Workout created for account owner:', workout);
      } catch (e) {
        console.error('Error creating workout for account owner:', e);
        throw new Error('Could not start workout. Please try again.');
      }

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
          .select('id, exercise_id');

        if (snapshotErr) throw snapshotErr;

        // Build all sets in one payload to reduce network roundtrips
        const allSetsPayload: any[] = [];
        for (const progEx of routineData.routine_exercises) {
          const workoutExercise = insertedExercises.find(we => we.exercise_id === progEx.exercise_id);
          if (!workoutExercise || progEx.routine_sets.length === 0) continue;
          progEx.routine_sets.forEach((set, setIdx) => {
            allSetsPayload.push({
              workout_id: workout.id,
              exercise_id: progEx.exercise_id,
              workout_exercise_id: workoutExercise.id,
              set_order: set.set_order || setIdx + 1,
              reps: set.reps,
              weight: set.weight,
              weight_unit: set.weight_unit,
              set_variant: set.set_variant,
              set_type: set.set_type,
              timed_set_duration: set.timed_set_duration,
              status: 'default',
              user_id: clientId,
            });
          });
        }

        if (allSetsPayload.length > 0) {
          const { error: setsErr } = await supabase
            .from('sets')
            .insert(allSetsPayload);
          if (setsErr) {
            console.error('Error creating sets:', setsErr);
            throw setsErr;
          }
        }

        console.log('[Account] Workout and exercises created successfully for account owner');
      } catch (err) {
        console.error("Error snapshotting exercises for workout:", err);
        throw new Error('Could not create workout exercises. Please try again.');
      }
      
      await notifyClientWorkoutStarted(clientId, workout.id);

      toast.success(`Workout started for ${formatUserDisplay(clientProfile)}. They will be notified when they open the app.`);
      
      console.log('[Account] Switching to user:', clientId);
      switchToUser(clientProfile);
      
      // Navigate immediately; ActiveWorkout will load using context
      navigate('/workout/active');
      
      setShowRoutineSelectionDialog(false);
      setSelectedClient(null);
      setClientRoutines([]);
    } catch (error) {
      console.error('Error starting workout:', error);
      toast.error('Failed to start workout. Please try again.');
    }
  };

  const handleRemoveShare = (shareId, displayName) => {
    setShareToDeleteId(shareId);
    setShareToDeleteName(displayName || "this user");
    setShowDeleteShareDialog(true);
  };

  const handleConfirmDecline = () => {
    if (requestToDecline) {
      // This is handled by SharingRequests component logic via passed setters
      // But wait, the actual mutation call was in handleConfirmDecline which used `declineRequestMutation`
      // We removed `declineRequestMutation` from Account.tsx, so we need to define it again OR pass it down?
      // Actually, the dialog is in Account.tsx. The confirmation button calls `handleConfirmDecline`.
      // `handleConfirmDecline` calls `declineRequestMutation`.
      // So `declineRequestMutation` MUST remain in Account.tsx if the dialog remains here.
      
      // Re-adding the mutation locally for the dialog to work
      rejectInvitation(requestToDecline.id).then(() => {
         queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
         queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
         toast.success("Request declined");
         setShowDeclineConfirmDialog(false);
         setRequestToDecline(null);
      }).catch(error => {
         console.error("Error declining request:", error);
         toast.error(error.message || "Failed to decline request");
      });
    }
  };

  const handleDialogSubmit = async (email: string, permissions: any) => {
    if (!email.trim()) return;

    try {
      console.log("Dialog form submitted with email:", email, "invite type:", dialogInviteType);
      
      // Close dialog and show loading overlay
      setShowAddPersonDialog(false);
      setIsSendingInvitation(true);
      setInviteeEmail(email.trim());
      
      if (dialogInviteType === 'trainer') {
        if (!user.email) {
          throw new Error("Unable to send invitation: your email not found");
        }
        const trainerEmail = email.trim();
        await inviteTrainerToManage(trainerEmail, user.id, permissions, false);
        toast.success("Trainer invitation sent successfully");
      } else {
        const clientEmail = email.trim();
        await inviteClientToBeManaged(clientEmail, user.id, permissions, false);
        toast.success("Client invitation sent successfully");
      }

      setDialogEmail("");
      setDialogInviteType('trainer');
      setDialogMirrorInvite(false);
      setDialogPermissions({
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true
      });
      
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast.error(error.message || "Failed to send invitation. Please try again.");
    } finally {
      setIsSendingInvitation(false);
      setInviteeEmail("");
    }
  };

  const handleDialogCancel = () => {
    setShowAddPersonDialog(false);
  };

  const performDeleteInvitation = async () => {
    if (!invitationToDelete) return;
    try {
      if (invitationToDelete.source === 'token') {
        await cancelInvitationRequest(invitationToDelete.id);
      } else {
        const { error } = await supabase
          .from("account_shares")
          .delete()
          .eq("id", invitationToDelete.id);

        if (error) {
          console.error("Failed to delete invitation:", error);
          toast.error("Failed to delete invitation");
          return;
        }
      }

      toast.success("Invitation deleted");
      queryClient.invalidateQueries({ queryKey: ["pending_requests", user.id] });
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests", user.id] });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setShowDeleteInvitationDialog(false);
      setInvitationToDelete(null);
    }
  };

  // Don't redirect if we're explicitly navigating to account (e.g., when exiting manage mode)
  // Check if we're on the account page, have a section query param, have an activeSection set,
  // OR if we're exiting delegation (passed via navigation state)
  // (activeSection persists even after the query param is removed by useEffect)
  // Also check if we're currently processing a section param (prevents redirect during useEffect execution)
  const sectionParam = searchParams.get('section');
  
  // CRITICAL: If we have a section param (either in searchParams or URL), this is ALWAYS explicit navigation - never redirect
  // This handles the case where returnToSelf navigates to /account?section=clients
  // We check both searchParams and URL directly to catch edge cases where searchParams might not be parsed yet
  const hasSectionParam = sectionParam !== null || urlHasSectionParam;
  
  const isExplicitAccountNavigation = location.pathname === '/account' || 
                                      hasSectionParam || 
                                      activeSection !== null ||
                                      isExitingDelegation;
  
  // Only redirect if delegated AND not explicitly navigating to account
  // The section param check is critical - it prevents redirect when returnToSelf navigates here
  if (isDelegated && !isExplicitAccountNavigation) {
    return <Navigate to="/routines" replace />;
  }

  // Render loading overlays for sharing operations
  const inviteOverlay = (
    <LoadingOverlay 
      isLoading={isSendingInvitation} 
      message={`Sending ${inviteeEmail} your request...`}
    />
  );

  const deleteShareOverlay = (
    <LoadingOverlay 
      isLoading={deleteShareMutation.isPending} 
      message="Removing access..."
    />
  );

  return (
    <>
      {inviteOverlay}
      {deleteShareOverlay}
      <AppLayout  
      title={activeSection ? undefined : "Account"}
      breadcrumbs={activeSection ? [
        { 
          label: 'Account', 
          onClick: () => setActiveSection(null) 
        },
        { 
          label: sectionNames[activeSection as keyof typeof sectionNames] 
        }
      ] : undefined}
      hideBanner={activeSection === 'sharing-requests'}
    >
      <MainContentSection className="!p-0 flex-1 min-h-0">
        <div className="w-full flex flex-col min-h-screen" style={{ paddingTop: 'calc(var(--header-height, 64px) + 20px)' }}>
          {/* Account Settings Header and Menu */}
          {!activeSection && (
            <div className="w-full flex justify-center px-5 pt-5">
              <div className="w-full max-w-[500px] flex flex-col justify-start items-start gap-5">
                <AccountSettingsMenu
                  activeSection={activeSection}
                  onSectionChange={setActiveSection}
                  onDeleteAccount={() => setDeleteConfirmOpen(true)}
                />
                {/* Logout button */}
                <div className="self-stretch flex flex-col justify-start items-start gap-5">
                  <div 
                    className="Swiperbutton self-stretch h-12 min-w-44 px-4 py-2 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-neutral-50"
                    onClick={() => setShowLogoutDialog(true)}
                  >
                    <div className="ButtonText justify-start text-neutral-neutral-600 text-base font-medium font-['Be_Vietnam_Pro'] leading-5">
                      Log out
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section Content */}
          <div className="w-full flex justify-center px-5">
            <div className="w-full max-w-[500px] flex flex-col justify-start items-start">
              {/* Sharing requests section */}
              {activeSection === 'sharing-requests' && (
                <SharingRequests
                  user={user}
                  onInviteTrainer={() => {
                    setDialogInviteType('trainer');
                    setDialogMirrorInvite(false);
                    setShowAddPersonDialog(true);
                  }}
                  onInviteClient={() => {
                    setDialogInviteType('client');
                    setDialogMirrorInvite(false);
                    setShowAddPersonDialog(true);
                  }}
                  setRequestToDecline={setRequestToDecline}
                  setShowDeclineConfirmDialog={setShowDeclineConfirmDialog}
                  setInvitationToDelete={setInvitationToDelete}
                  setShowDeleteInvitationDialog={setShowDeleteInvitationDialog}
                />
              )}

              {/* Trainers section */}
              {activeSection === 'trainers' && (
                <TrainersList
                  user={user}
                  onInviteTrainer={() => {
                    setDialogInviteType('trainer');
                    setDialogMirrorInvite(false);
                    setShowAddPersonDialog(true);
                  }}
                  onRemoveShare={(shareId, displayName) => {
                    setShareToDeleteId(shareId);
                    setShareToDeleteName(displayName);
                    setShowDeleteShareDialog(true);
                  }}
                />
              )}

              {/* Clients section */}
              {activeSection === 'clients' && (
                <ClientsList
                  user={user}
                  onInviteClient={() => {
                    setDialogInviteType('client');
                    setDialogMirrorInvite(false);
                    setShowAddPersonDialog(true);
                  }}
                  onRemoveShare={(shareId, displayName) => {
                    setShareToDeleteId(shareId);
                    setShareToDeleteName(displayName);
                    setShowDeleteShareDialog(true);
                  }}
                  onStartWorkout={(clientProfile) => handleStartWorkout(clientProfile)}
                  onCreateRoutines={(clientProfile) => handleCreateRoutinesForClient(clientProfile)}
                  onReviewHistory={(clientProfile) => handleReviewHistoryForClient(clientProfile)}
                />
              )}

              {/* Personal info section */}
              {activeSection === 'personal-info' && (
                <ProfileSettings user={user} />
              )}

              {/* Email and password section */}
              {activeSection === 'email-password' && (
                <LoginSettings user={user} />
              )}

            </div>
          </div>
        </div>

          {/* Add person dialog */}
          <InviteDialog
            open={showAddPersonDialog}
            onOpenChange={setShowAddPersonDialog}
            type={dialogInviteType as "trainer" | "client"}
            onSubmit={handleDialogSubmit}
            onCancel={handleDialogCancel}
          />

          {/* Routine selection dialog */}
          <RoutineSelectionDialog
            open={showRoutineSelectionDialog}
            onOpenChange={setShowRoutineSelectionDialog}
            client={selectedClient}
            routines={clientRoutines}
            mode={dialogMode as 'workout' | 'manage'}
            onSelectRoutine={dialogMode === 'workout' ? handleRoutineSelect : handleRoutineManage}
            onCreateRoutine={(name) => {
              setNewRoutineName(name);
              // Since we moved the sheet into the dialog component, we need to bridge the logic
              // Actually, the dialog component now calls a prop to create.
              // But handleConfirmCreateRoutineForClient relies on `newRoutineName` state being set.
              // Let's update handleConfirmCreateRoutineForClient to take name as arg or rely on state update.
              // Better: Update handleConfirmCreateRoutineForClient to accept name
              handleConfirmCreateRoutineForClient(name);
            }}
            onCancel={() => {
              setShowRoutineSelectionDialog(false);
              setSelectedClient(null);
              setClientRoutines([]);
              setDialogMode('workout');
            }}
          />

          {/* Delete Share Confirmation Dialog */}

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
              setInvitationToDelete(null);
            }}
          />
          
          <SwiperDialog
            open={showDeleteShareDialog}
            onOpenChange={setShowDeleteShareDialog}
            title="Disconnect trainer"
            description={`${shareToDeleteName} will no longer be a trainer on your account.`}
            confirmText="Remove access"
            cancelText="Cancel"
            confirmVariant="default"
            cancelVariant="default"
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

          <SwiperDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirmOpen(false)}
            title="Confirm deletion"
            confirmText="Delete account"
            cancelText="Cancel"
            confirmVariant="default"
            cancelVariant="default"
            bodyClassName="bg-transparent p-0"
          >
            <div className="self-stretch flex flex-col justify-start items-start gap-4">
              <TextInput
                label="Password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                customPlaceholder="Enter password to delete account"
              />
            </div>
          </SwiperDialog>

          {/* Logout confirmation dialog */}
          <SwiperDialog
            open={showLogoutDialog}
            onOpenChange={setShowLogoutDialog}
            onConfirm={handleLogout}
            onCancel={() => setShowLogoutDialog(false)}
            title="Log out"
            confirmText="Log out"
            cancelText="Cancel"
            confirmVariant="default"
            cancelVariant="outline"
          />

          {/* Decline request confirmation dialog */}
          <SwiperDialog
            open={showDeclineConfirmDialog}
            onOpenChange={setShowDeclineConfirmDialog}
            onConfirm={handleConfirmDecline}
            onCancel={() => {
              setShowDeclineConfirmDialog(false);
              setRequestToDecline(null);
            }}
            title="Decline request?"
            description="Are you sure you want to decline this request?"
            confirmText="Decline"
            cancelText="Cancel"
            confirmVariant="default"
            cancelVariant="default"
          />
      </MainContentSection>
    </AppLayout>
    </>
  );
};

export default Account;