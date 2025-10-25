import React, { useEffect, useState, useRef } from "react";
import { useAccount } from "@/contexts/AccountContext";
import { Navigate, useNavigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { supabase } from "@/supabaseClient";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { SwiperButton } from "@/components/shared/SwiperButton";
import SectionWrapperLabel from "@/components/shared/cards/wrappers/SectionWrapperLabel";
import ToggleInput from "@/components/shared/inputs/ToggleInput";
import { toast } from "@/lib/toastReplacement";
import EditableTextInput from "@/components/shared/inputs/EditableTextInput";
import { Eye, EyeOff, Pencil, UserRoundPlus, UserRoundX, Blend, Plus, Play, Cog, History, MoveUpRight, X, Trash2, AlertCircle, ArrowRight } from "lucide-react";
import SwiperDialog from "@/components/shared/SwiperDialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import ActionPill from "@/components/shared/ActionPill";
import { ActionCard } from "@/components/shared/ActionCard";
import DeckWrapper from "@/components/shared/cards/wrappers/DeckWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";
import PageSectionWrapper from "@/components/shared/cards/wrappers/PageSectionWrapper";
import SwiperForm from "@/components/shared/SwiperForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import { postSlackEvent } from "@/lib/slackEvents";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";
import { getPendingInvitations, acceptInvitation, rejectInvitation, createTrainerInvite, createClientInvite } from "@/lib/sharingApi";
import MainContentSection from "@/components/layout/MainContentSection";
import ManagePermissionsCard from "@/features/sharing/components/ManagePermissionsCard";
import { generateWorkoutName } from "@/lib/utils";

const Account = () => {
  const { isDelegated, switchToUser } = useAccount();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Account info state
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ first_name: "", last_name: "" });
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dirtyName, setDirtyName] = useState(false);
  const [dirtyEmail, setDirtyEmail] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLogin, setIsEditingLogin] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

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
  const [showDeleteShareDialog, setShowDeleteShareDialog] = useState(false);
  const [shareToDeleteId, setShareToDeleteId] = useState(null);
  const [shareToDeleteName, setShareToDeleteName] = useState("");
  const [showDeleteInvitationDialog, setShowDeleteInvitationDialog] = useState(false);
  const [invitationToDeleteId, setInvitationToDeleteId] = useState(null);
  const [showRoutineSelectionDialog, setShowRoutineSelectionDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientRoutines, setClientRoutines] = useState([]);
  const [dialogMode, setDialogMode] = useState('workout');
  const subscriptionRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const [showCreateRoutineSheet, setShowCreateRoutineSheet] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const createNameInputRef = useRef(null);

  // Helper function to format user display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    
    if (firstName) {
      return firstName;
    }
    
    if (lastName) {
      return lastName;
    }
    
    return email;
  };

  // Account info queries and handlers
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }
      setEmail(authUser.email || "");

      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", authUser.id)
        .single();

      if (profileErr && profileErr.code === "PGRST116") {
        await supabase.from("profiles").insert({ id: authUser.id });
      }

      if (profileData) {
        setProfile(profileData);
        setFirstName(profileData.first_name || "");
        setLastName(profileData.last_name || "");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSaveName = async () => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ first_name: firstName, last_name: lastName })
        .eq("id", user.id);
      if (error) throw error;
      setProfile({ first_name: firstName, last_name: lastName });
      setDirtyName(false);
      toast.success("Name updated");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSaveLoginSection = async () => {
    try {
      if (dirtyEmail) {
        const { data, error } = await supabase.auth.updateUser({ email });
        if (error) throw error;
        setEmail(data.user.email);
        setDirtyEmail(false);
        toast.success("Email updated. Please check your inbox to confirm.");
      }
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        toast.success("Password updated");
        setNewPassword("");
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await supabase.from("profiles").delete().eq("id", user.id);
      toast.success("Account deletion requested (admin action required)");
    } catch (e) {
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

  // Trainers functionality queries
  const trainerSharesQuery = useQuery({
    queryKey: ["shares_owned_by_me", user?.id],
    queryFn: async () => {
      console.log('[Account] Fetching trainers (account managers) for user:', user.id);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, delegate_user_id, delegate_email, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("owner_user_id", user.id)
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
    enabled: !!user?.id,
  });

  const clientSharesQuery = useQuery({
    queryKey: ["shares_shared_with_me", user?.id],
    queryFn: async () => {
      console.log('[Account] Fetching clients (account owners) for user:', user.id);
      const { data: shares, error } = await supabase
        .from("account_shares")
        .select("id, owner_user_id, created_at, can_create_routines, can_start_workouts, can_review_history")
        .eq("delegate_user_id", user.id)
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
    enabled: !!user?.id,
  });

  const pendingRequestsQuery = useQuery({
    queryKey: ["pending_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Account] Fetching pending requests for user:', user.id);
      return await getPendingInvitations(user.id);
    },
    enabled: !!user?.id,
  });

  const outgoingRequestsQuery = useQuery({
    queryKey: ["outgoing_requests", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log('[Account] Fetching outgoing requests for user:', user.id);
      
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

      const requestsWithProfiles = await Promise.all(
        requests.map(async (request) => {
          let profile = null;
          if (request.delegate_user_id) {
            const { data: fetchedProfile } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email")
              .eq("id", request.delegate_user_id)
              .maybeSingle();
            profile = fetchedProfile || null;
          }
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
            profiles: profile || (request.delegate_email ? { email: request.delegate_email } : null),
          };
        })
      );

      const now = new Date();
      return requestsWithProfiles.filter(request => 
        new Date(request.expires_at) > now
      );
    },
    enabled: !!user?.id,
  });

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
      setEmail("");
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

  const updateSharePermissionsMutation = useMutation({
    mutationFn: async (params: { shareId: string; permissions: any }) => {
      const { shareId, permissions } = params;
      const { data, error } = await supabase
        .from("account_shares")
        .update(permissions)
        .eq("id", shareId)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
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

  const acceptRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await acceptInvitation(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
      queryClient.invalidateQueries({ queryKey: ["shares_shared_with_me"] });
      queryClient.invalidateQueries({ queryKey: ["shares_owned_by_me"] });
      toast.success("Request accepted successfully");
    },
    onError: (error) => {
      console.error("Error accepting request:", error);
      toast.error(error.message || "Failed to accept request");
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return await rejectInvitation(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
      toast.success("Request declined");
    },
    onError: (error) => {
      console.error("Error declining request:", error);
      toast.error(error.message || "Failed to decline request");
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
    try {
      console.log('[Account] Starting workout for client:', selectedClient.id);
      console.log('[Account] Selected routine:', routine);
      
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
      
      console.log('[Account] Formatted routine data:', routineData);
      
      const workoutName = generateWorkoutName();
      
      try {
        await supabase
          .from("workouts")
          .update({ is_active: false, completed_at: new Date().toISOString() })
          .eq("user_id", selectedClient.id)
          .eq("is_active", true);
      } catch (e) {
        console.warn("Failed to auto-close previous active workouts", e);
      }

      let workout;
      try {
        const { data: inserted, error: insertErr } = await supabase
          .from('workouts')
          .insert({
            user_id: selectedClient.id,
            routine_id: routine.id,
            workout_name: workoutName,
            is_active: true,
            is_public: true,
            running_since: new Date().toISOString(),
            active_seconds_accumulated: 0
          })
          .select()
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
          .select();

        if (snapshotErr) throw snapshotErr;

        // Add null check for selectedClient.id before creating sets
        if (!selectedClient?.id) {
          console.error('[Account] Cannot create sets: selectedClient ID is null');
          throw new Error('Client not selected. Please try again.');
        }

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
              user_id: selectedClient.id, // This is now guaranteed to be non-null
              account_id: selectedClient.id,
            }));

            const { error: setsErr } = await supabase
              .from('sets')
              .insert(setsPayload);

            if (setsErr) {
              console.error('Error creating sets for exercise:', setsErr);
            }
          }
        }

        console.log('[Account] Workout and exercises created successfully for account owner');
      } catch (err) {
        console.error("Error snapshotting exercises for workout:", err);
        throw new Error('Could not create workout exercises. Please try again.');
      }
      
      toast.success(`Workout started for ${formatUserDisplay(selectedClient)}. They will be notified when they open the app.`);
      
      switchToUser(selectedClient);
      
      // Wait for the workout to be detected before navigating
      // This prevents the double routine selection issue
      const checkWorkoutAndNavigate = async () => {
        let attempts = 0;
        const maxAttempts = 20; // 2 seconds max wait
        
        while (attempts < maxAttempts) {
          try {
            const { data: workoutData } = await supabase
              .from("workouts")
              .select("id")
              .eq("user_id", selectedClient.id)
              .eq("is_active", true)
              .single();
            
            if (workoutData) {
              // Workout is detected, navigate to active workout page
              navigate('/workout/active');
              break;
            }
          } catch (error) {
            // Workout not found yet, continue waiting
          }
          
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // If we couldn't detect the workout after max attempts, navigate anyway
        if (attempts >= maxAttempts) {
          navigate('/workout/active');
        }
      };
      
      checkWorkoutAndNavigate();
      
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
        await createTrainerInvite(dialogEmail.trim(), user.id, dialogPermissions);
        toast.success("Trainer invitation sent successfully");
      } else {
        await createClientInvite(dialogEmail.trim(), user.id, dialogPermissions);
        toast.success("Client invitation sent successfully");
      }

      setDialogEmail("");
      setDialogInviteType('trainer');
      setDialogPermissions({
        can_create_routines: true,
        can_start_workouts: true,
        can_review_history: true
      });
      setShowAddPersonDialog(false);
      
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending_requests"] });
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

  const handlePermissionToggle = (shareId: string, permission: string, value: any) => {
    updateSharePermissionsMutation.mutate({
      shareId,
      permissions: { [permission]: value }
    });
  };

  const handleDeleteInvitation = (requestId: string) => {
    setInvitationToDeleteId(requestId);
    setShowDeleteInvitationDialog(true);
  };

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
      queryClient.invalidateQueries({ queryKey: ["pending_requests", user.id] });
      queryClient.invalidateQueries({ queryKey: ["outgoing_requests", user.id] });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("Failed to delete invitation");
    } finally {
      setShowDeleteInvitationDialog(false);
      setInvitationToDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">Loading…</div>
    );
  }

  if (isDelegated) {
    return <Navigate to="/routines" replace />;
  }

  return (
    <AppLayout title="Account">
      <MainContentSection className="!p-0 flex-1 min-h-0">
        <div className="w-full flex flex-col min-h-screen pt-20">
          {/* Requests section */}
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
                    <div className="w-full bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center p-6">
                      <div className="text-neutral-neutral-400 text-sm font-medium">Loading incoming requests...</div>
                    </div>
                  )}
                  {pendingRequestsQuery.data && pendingRequestsQuery.data.length > 0 && (
                    pendingRequestsQuery.data.map((request) => (
                      <div key={request.id} className="SharedWithMeCard w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
                        <div className="CardHeader self-stretch p-3 border border-neutral-300 inline-flex justify-between items-center">
                          <div className="Frame84 flex-1 flex justify-start items-center gap-3">
                            <div className="flex-1 justify-center text-neutral-neutral-700 text-xl font-medium font-['Be_Vietnam_Pro'] leading-tight">
                              {request.request_type === 'trainer_invite'
                                ? `${formatUserDisplay((request as any).profiles)} wants you to be their trainer`
                                : `${formatUserDisplay((request as any).profiles)} wants you to be their client`
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
                          <div className="PermissionRows self-stretch bg-stone-100 rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
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
                              className="flex-1 h-12 min-w-44 px-4 py-2 bg-neutral-neutral-600 rounded-[20px] flex justify-center items-center gap-2.5"
                            >
                              <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Accept</div>
                            </SwiperButton>
                            <SwiperButton
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={declineRequestMutation.isPending}
                              variant="destructive"
                              className="flex-1 h-12 min-w-44 px-4 py-2 bg-red-red-400 rounded-[20px] flex justify-center items-center gap-2.5"
                            >
                              <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Decline</div>
                            </SwiperButton>
                          </div>
                          <div className="ThisInvitationWillExpireIn14Days self-stretch justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
                            This invitation will expire in {Math.ceil((new Date(request.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days.
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Outgoing requests */}
                  {outgoingRequestsQuery.isLoading && (
                    <div className="w-full bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center p-6">
                      <div className="text-neutral-neutral-400 text-sm font-medium">Loading outgoing requests...</div>
                    </div>
                  )}
                  {outgoingRequestsQuery.data && outgoingRequestsQuery.data.length > 0 && (
                    outgoingRequestsQuery.data.map((request) => (
                      <div key={request.id} data-layer="Property 1=Awaiting responce" className="Property1AwaitingResponce w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden">
                        <div data-layer="card-header" className="CardHeader self-stretch p-3 bg-white border border-neutral-300 flex flex-col justify-start items-start gap-3">
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
                    <div className="w-full bg-red-50 rounded-lg border border-red-200 flex flex-col justify-center items-center p-6">
                      <div className="text-red-600 text-sm font-medium">Failed to load incoming requests. Please try again.</div>
                    </div>
                  )}
                  {outgoingRequestsQuery.isError && (
                    <div className="w-full bg-red-50 rounded-lg border border-red-200 flex flex-col justify-center items-center p-6">
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
                    className="w-full h-14 rounded-lg border border-neutral-300"
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
                    className="w-full h-14 rounded-lg border border-neutral-300"
                  />
                </DeckWrapper>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="w-full flex justify-center px-5">
            <div className="w-full max-w-[500px] pt-5 pb-10 flex flex-col justify-start items-start gap-3">
              <div className="PersonalInformation w-full h-8 flex items-center justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Personal information</div>
              <div className="CardWrapper w-full p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-center items-center gap-5">
              {/* First Name Field */}
              <EditableTextInput
                label="First name"
                value={firstName}
                onChange={(value) => {
                  setFirstName(value);
                  setDirtyName(true);
                }}
                editing={isEditingName}
                onActivate={() => setIsEditingName(true)}
                className="w-full"
              />

              {/* Last Name Field */}
              <EditableTextInput
                label="Last name"
                value={lastName}
                onChange={(value) => {
                  setLastName(value);
                  setDirtyName(true);
                }}
                editing={isEditingName}
                onActivate={() => setIsEditingName(true)}
                className="w-full"
              />

              {/* Action Buttons */}
              {isEditingName && (
                <>
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-green-200 rounded-[20px] border border-neutral-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-green-300"
                    onClick={() => {
                      handleSaveName();
                      setIsEditingName(false);
                    }}
                  >
                    <div className="justify-start text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Save changes
                    </div>
                  </div>
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-red-300 rounded-[20px] inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-400"
                    onClick={() => {
                      setFirstName(profile.first_name);
                      setLastName(profile.last_name);
                      setDirtyName(false);
                      setIsEditingName(false);
                    }}
                  >
                    <div className="justify-start text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Discard changes
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Login and Password Section */}
          <div className="w-full flex justify-center px-5">
            <div className="w-full max-w-[500px] pt-5 pb-10 flex flex-col justify-start items-start gap-3">
              <div className="LoginAndPassword w-full h-8 flex items-center justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Login and password</div>
              <div className="Frame56 w-full p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-5">
              {/* Email Field */}
              <EditableTextInput
                label="Email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setDirtyEmail(true);
                }}
                editing={isEditingLogin}
                onActivate={() => setIsEditingLogin(true)}
                className="w-full"
              />

              {/* Password Field */}
              <EditableTextInput
                label="Password"
                value="●●●●●●●●●"
                onChange={(value) => {
                  setNewPassword(value);
                }}
                editing={isEditingLogin}
                onActivate={() => setIsEditingLogin(true)}
                className="w-full"
                inputProps={{
                  type: "password",
                  placeholder: "Enter new password"
                }}
              />

              {/* Action Buttons for Login Section */}
              {isEditingLogin && (
                <>
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-green-200 rounded-[20px] border border-neutral-300 inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-green-300"
                    onClick={() => {
                      handleSaveLoginSection();
                      setIsEditingLogin(false);
                    }}
                  >
                    <div className="justify-start text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Save changes
                    </div>
                  </div>
                  <div 
                    className="self-stretch h-12 px-4 py-2 bg-red-300 rounded-[20px] inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-400"
                    onClick={() => {
                      setEmail(user.email || "");
                      setDirtyEmail(false);
                      setNewPassword("");
                      setIsEditingLogin(false);
                    }}
                  >
                    <div className="justify-start text-neutral-neutral-700 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      Discard changes
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="w-full flex justify-center px-5">
            <div className="w-full max-w-[500px] pt-5 pb-20 flex flex-col justify-start items-start gap-3">
              <div className="Account w-full h-8 flex items-center justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">Account</div>
              <div className="Frame62 self-stretch w-full p-5 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-5">
              <div 
                className="Swiperbutton self-stretch h-12 px-4 py-2 bg-neutral-neutral-600 rounded-[20px] inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-neutral-700"
                onClick={handleLogout}
              >
                <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  Log out
                </div>
              </div>
              <div 
                className="Swiperbutton self-stretch h-12 px-4 py-2 bg-red-400 rounded-[20px] inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-red-500"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <div className="ButtonText justify-start text-white text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  Delete account
                </div>
              </div>
              </div>
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
                <div className="self-stretch h-11 pl-3 bg-white rounded-lg border border-neutral-300 inline-flex justify-center items-center gap-2.5">
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
              <div className="self-stretch rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
                {dialogInviteType === 'client' ? (
                  <div className="self-stretch rounded-lg border border-neutral-300 flex flex-col justify-start items-start overflow-hidden">
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
            {clientRoutines.map((routine, index) => (
              <div 
                key={routine.id}
                data-layer="Routine Card" 
                className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden cursor-pointer hover:bg-neutral-50"
                onClick={() => dialogMode === 'workout' ? handleRoutineSelect(routine) : handleRoutineManage(routine)}
              >
                <div data-layer="Frame 5001" className="Frame5001 self-stretch flex flex-col justify-start items-start gap-5">
                  <div data-layer="Frame 5007" className="Frame5007 self-stretch flex flex-col justify-start items-start">
                    <div data-layer="Biceps and chest" className="BicepsAndChest w-[452px] justify-start text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight text-neutral-neutral-600">
                      {routine.routine_name || routine.name || routine.title || `Routine ${routine.id}`}
                    </div>
                    <div data-layer="Completed 5 days ago" className="Completed5DaysAgo text-center justify-center text-xs font-medium font-['Be_Vietnam_Pro'] leading-none text-neutral-neutral-400">
                      {routine.lastCompletedText || 'Never completed'}
                    </div>
                  </div>
                </div>
                <div data-layer="Frame 5014" className="Frame5014 inline-flex justify-start items-start gap-2">
                  {dialogMode === 'workout' ? (
                    <div 
                      data-layer="Frame 5012" 
                      className="Frame5012 h-7 px-2 bg-green-600 rounded-lg flex justify-start items-center gap-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoutineSelect(routine);
                      }}
                    >
                      <div data-layer="lucide-icon" className="LucideIcon w-4 h-4 relative flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                      <div data-layer="Start" className="Start justify-center text-sm font-normal font-['Be_Vietnam_Pro'] leading-tight text-white">
                        Start
                      </div>
                    </div>
                  ) : (
                    <div 
                      data-layer="Frame 5013" 
                      className="Frame5013 w-7 h-7 bg-neutral-200 rounded-lg flex justify-center items-center gap-1 cursor-pointer"
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
              <div data-layer="Routine Card" className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-lg border border-neutral-300 flex flex-col justify-start items-start gap-6 overflow-hidden">
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

          {/* Create routine name sheet */}
          <SwiperForm
            open={showCreateRoutineSheet}
            onOpenChange={setShowCreateRoutineSheet}
            title=""
            description={`Create a new workout routine for ${formatUserDisplay(selectedClient)}`}
            leftAction={() => {
              setShowCreateRoutineSheet(false);
              setTimeout(() => setShowRoutineSelectionDialog(true), 0);
            }}
            rightAction={handleConfirmCreateRoutineForClient}
            rightEnabled={(newRoutineName || "").trim().length > 0}
            rightText="Create"
            leftText="Cancel"
          >
            <FormSectionWrapper bordered={false}>
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
            </FormSectionWrapper>
          </SwiperForm>

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

          <SwiperDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirmOpen(false)}
            title="Confirm deletion"
            description="Deleting your account is permanent. This action cannot be undone."
            confirmText="Delete account"
            cancelText="Cancel"
            confirmVariant="destructive"
            cancelVariant="outline"
          >
            <div className="self-stretch px-3 py-5 flex flex-col justify-start items-start gap-4">
              <p className="text-neutral-neutral-700 text-base font-normal font-['Be_Vietnam_Pro'] leading-tight">
                Please enter your password to permanently delete your account.
              </p>
              <TextInput
                label="Password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                customPlaceholder="Enter your password"
              />
            </div>
          </SwiperDialog>
      </MainContentSection>
    </AppLayout>
  );
};

export default Account;