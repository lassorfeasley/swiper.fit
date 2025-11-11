import React, { useEffect, useState, useRef, useContext, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import PageSectionWrapper from "@/components/shared/cards/wrappers/PageSectionWrapper";
import { PageNameContext } from "@/App";
import { FormHeader } from "@/components/shadcn/sheet";
import AddNewExerciseForm from "../components/AddNewExerciseForm";
import ExerciseCard from "@/components/shared/cards/ExerciseCard";
import AppLayout from "@/components/layout/AppLayout";
import SwiperDialog from "@/components/shared/SwiperDialog";
import SwiperForm from "@/components/shared/SwiperForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
import SwiperFormSwitch from "@/components/shared/SwiperFormSwitch";
import SectionNav from "@/components/shared/SectionNav";
import { SwiperButton } from "@/components/shared/SwiperButton";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { MAX_ROUTINE_NAME_LEN } from "@/lib/constants";
import SetEditForm from "../components/SetEditForm";
import { ActionCard } from "@/components/shared/ActionCard";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/toastReplacement";
import { scrollToSection } from "@/lib/scroll";
import { useIsMobile } from "@/hooks/use-mobile";
import { Copy, Blend, X, ListChecks, Bookmark } from "lucide-react";
import { useSpacing } from "@/hooks/useSpacing";

const RoutineBuilder = () => {
  const { routineId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setPageName } = useContext(PageNameContext);
  const { isWorkoutActive, startWorkout } = useActiveWorkout();
  const { isDelegated, actingUser, returnToSelf } = useAccount();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [isDeleteProgramConfirmOpen, setDeleteProgramConfirmOpen] =
    useState(false);
  const [isEditProgramOpen, setEditProgramOpen] = useState(false);
  const [isDeleteExerciseConfirmOpen, setDeleteExerciseConfirmOpen] =
    useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [program, setProgram] = useState(null);

  const isUnmounted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  const [sectionFilter, setSectionFilter] = useState("workout");
  const [editingSet, setEditingSet] = useState(null);
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [isEditSetFormOpen, setIsEditSetFormOpen] = useState(false);
  const [editingSetFormDirty, setEditingSetFormDirty] = useState(false);
  const reorderTimeoutRef = useRef(null);
  const [addExerciseSection, setAddExerciseSection] = useState(null);
  const ogGenTimerRef = useRef(null);
  const ogLastSigRef = useRef("");
  const ogLastRunRef = useRef(0);
  
  // Viewer mode state (for non-owners)
  const [isViewerMode, setIsViewerMode] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  
  // Use spacing hook for consistent layout
  const spacing = useSpacing('SIMPLE_LIST');
  
  // Helper to format delegate display name
  const formatUserDisplay = (profile) => {
    if (!profile) return "Unknown User";
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    const email = profile.email || "";
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return email;
  };

  // Full sharing nav row content matching Active Workout style
  const headerSharingContent = isDelegated ? (
    <>
      <div className="Frame73 max-w-[500px] pl-2 pr-5 bg-neutral-950 rounded-lg shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-start items-center">
        <div className="Iconbutton w-10 h-10 p-2.5 flex justify-start items-center gap-2.5">
          <Blend className="w-6 h-6 text-white" />
        </div>
        <div className="Frame71 flex justify-center items-center gap-5">
          <div className="AccountOwnersName justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {formatUserDisplay(actingUser)}
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-label="Exit delegate mode"
        onClick={returnToSelf}
        className="ActionIcons w-10 h-10 p-2 bg-neutral-950 rounded-lg shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] flex justify-center items-center gap-2"
      >
        <X className="w-6 h-6 text-white" />
      </button>
    </>
  ) : undefined;


  useEffect(() => {
    setPageName("RoutineBuilder");
  }, [setPageName]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (reorderTimeoutRef.current) {
        clearTimeout(reorderTimeoutRef.current);
      }
    };
  }, []);


  useEffect(() => {
    async function fetchProgramAndExercises() {
      setLoading(true);
      
      // Fetch routine with user_id to determine ownership
      const { data: programData } = await supabase
        .from("routines")
        .select("routine_name, og_image_url, user_id, created_by, shared_by")
        .eq("id", routineId)
        .single();
        
      if (!programData) {
        setLoading(false);
        return;
      }
      
      setProgramName(programData?.routine_name || "");
      setProgram(programData);
      console.log('Program data:', programData);
      console.log('OG Image URL:', programData?.og_image_url);

      // Determine if current user is the owner
      const userIsOwner = user && programData.user_id === user.id;
      setIsViewerMode(!userIsOwner);
      
      // If not owner, fetch owner name
      if (!userIsOwner && programData.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', programData.user_id)
          .maybeSingle();
        if (profile) {
          const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          setOwnerName(name);
        }
      }

      const { data: progExs, error } = await supabase
        .from("routine_exercises")
        .select(
          `id,
           exercise_id,
           exercise_order,
           exercises!fk_routine_exercises__exercises(
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
           )`
        )
        .eq("routine_id", routineId)
        .order("exercise_order", { ascending: true });
      if (error) {
        setExercises([]);
        setLoading(false);
        return;
      }
      const items = (progExs || []).map((pe) => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        name: (pe.exercises as any)?.name || "[Exercise name]",
        section: (pe.exercises as any)?.section || "training",
        sets: pe.routine_sets?.length || 0,
        order: pe.exercise_order || 0,
        setConfigs: (pe.routine_sets || [])
          .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
          .map((set) => {
            const unit = set.weight_unit || 'lbs';
            return {
              reps: set.reps,
              weight: set.weight,
              unit,
              set_variant: set.set_variant || `Set ${set.set_order}`,
              set_type: set.set_type,
              timed_set_duration: set.timed_set_duration,
            };
          }),
      }));
      setExercises(items);
      
      // Do not auto-open add exercise sheet; UI now indicates next step clearly
      setLoading(false);
    }
    fetchProgramAndExercises();
    return () => {
      isUnmounted.current = true;
      if (!isViewerMode) {
        saveOrder();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routineId, user]);

  // Reset OG image generation refs when routine changes to avoid cross-routine bleed
  useEffect(() => {
    ogLastSigRef.current = "";
    ogLastRunRef.current = 0;
    if (ogGenTimerRef.current) {
      clearTimeout(ogGenTimerRef.current);
      ogGenTimerRef.current = null;
    }
  }, [routineId]);

  // Debounced + throttled routine OG image regeneration on material changes
  useEffect(() => {
    if (!routineId) return;

    const exerciseCount = exercises.length;
    const setCount = exercises.reduce((t, ex) => t + (ex.setConfigs?.length || 0), 0);
    const name = (programName || '').trim();
    const sig = `${name}|${exerciseCount}|${setCount}`;

    if (sig === ogLastSigRef.current) return;

    const now = Date.now();
    const tooSoon = now - ogLastRunRef.current < 60000; // throttle: 60s minimum between uploads

    if (ogGenTimerRef.current) {
      clearTimeout(ogGenTimerRef.current);
    }

    ogGenTimerRef.current = setTimeout(() => {
      if (tooSoon) return;
      ogLastSigRef.current = sig;
      ogLastRunRef.current = Date.now();

      const run = async () => {
        try {
          const { generateAndUploadRoutineOGImage } = await import('@/lib/ogImageGenerator');
          const imageUrl = await generateAndUploadRoutineOGImage(routineId, {
            routineName: name || 'Routine',
            ownerName: '',
            exerciseCount,
            setCount,
          });
          setProgram(prev => (prev ? { ...prev, og_image_url: imageUrl } : prev));
        } catch (e) {
          console.warn('[OG] routine image refresh failed', e);
        }
      };

      if ('requestIdleCallback' in window) {
        // @ts-ignore
        requestIdleCallback(run, { timeout: 2000 });
      } else {
        setTimeout(run, 0);
      }
    }, 2500); // debounce: 2.5s inactivity

    return () => {
      if (ogGenTimerRef.current) {
        clearTimeout(ogGenTimerRef.current);
        ogGenTimerRef.current = null;
      }
    };
  }, [routineId, programName, exercises]);

  const handleEditSet = (index, setConfig) => {
    setEditingSet(setConfig);
    setEditingSetIndex(index);
    setIsEditSetFormOpen(true);
  };

  const handleSetEditFormSave = (values) => {
    if (editingExercise) {
      const newSetConfigs = [...editingExercise.setConfigs];
      newSetConfigs[editingSetIndex] = values;
      setEditingExercise({
        ...editingExercise,
        setConfigs: newSetConfigs,
      });
    }
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetEditFormClose = () => {
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetDelete = () => {
    if (editingExercise && editingSetIndex !== null) {
      // If deleting the last remaining set for this exercise, prompt to delete the exercise instead
      const currentLen = Array.isArray(editingExercise.setConfigs)
        ? editingExercise.setConfigs.length
        : 0;
      if (currentLen <= 1) {
        setIsEditSetFormOpen(false);
        setEditingSet(null);
        setEditingSetIndex(null);
        setDeleteExerciseConfirmOpen(true);
        return;
      }
      const newSetConfigs = [...(editingExercise.setConfigs || [])];
      newSetConfigs.splice(editingSetIndex, 1);
      
      // Update the editing exercise
      const updatedExercise = {
        ...editingExercise,
        setConfigs: newSetConfigs,
      };
      setEditingExercise(updatedExercise);
      
      // Also update the main exercises list
      setExercises((prev) =>
        prev.map((ex) =>
          ex.id === editingExercise.id
            ? { ...ex, setConfigs: newSetConfigs }
            : ex
        )
      );
      
      // Save to database
      handleSetConfigsChange(editingExercise.exercise_id, newSetConfigs);
    }
    setIsEditSetFormOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const saveOrder = async () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await supabase
        .from("routine_exercises")
        .update({ exercise_order: i + 1 })
        .eq("id", ex.id);
    }
  };

  // Handler for reordering exercises within a section
  // Debounced database update function
  const updateExerciseOrderInDatabase = useCallback(async (exercisesToUpdate) => {
    try {
      // First, set all exercises to temporary negative order values to avoid constraint conflicts
      for (const ex of exercisesToUpdate) {
        const { error } = await supabase
          .from("routine_exercises")
          .update({ exercise_order: -ex.order }) // Use negative values as temporary
          .eq("id", ex.id);
        
        if (error) {
          console.error(`Failed to update exercise ${ex.id} to temporary order:`, error);
          return; // Stop if we can't set temporary values
        }
      }
      
      // Then, set the final positive order values
      for (const ex of exercisesToUpdate) {
        const { error } = await supabase
          .from("routine_exercises")
          .update({ exercise_order: ex.order })
          .eq("id", ex.id);
        
        if (error) {
          console.error(`Failed to update exercise ${ex.id} to final order:`, error);
          // Continue with other updates even if one fails
        }
      }
    } catch (error) {
      console.error("Failed to save exercise order:", error);
      // Could add toast notification here
    }
  }, []);

  const handleReorderExercises = (section) => (newOrder) => {
    const target = section === "workout" ? "training" : section;
    
    // Update local state first for immediate UI feedback
    setExercises(prev => {
      // Get exercises from other sections
      const otherSectionExercises = prev.filter(ex => ex.section !== target);
      
      // Update order numbers for the reordered section
      const reorderedWithNewOrder = newOrder.map((ex, index) => ({
        ...ex,
        order: index + 1 // Simple 1-based ordering within section
      }));
      
      // Combine all exercises and sort by section priority then order
      const allExercises = [...otherSectionExercises, ...reorderedWithNewOrder];
      
      return allExercises;
    });

    // Clear any existing timeout
    if (reorderTimeoutRef.current) {
      clearTimeout(reorderTimeoutRef.current);
    }

    // Debounce the database update - only save after user stops dragging for 300ms
    reorderTimeoutRef.current = setTimeout(() => {
      const exercisesToUpdate = newOrder.map((ex, index) => ({
        id: ex.id,
        order: index + 1
      }));
      updateExerciseOrderInDatabase(exercisesToUpdate);
    }, 300);
  };

  // Clone routine for non-owner viewers
  const cloneRoutineForCurrentUser = async () => {
    if (!program) return null;
    
    // Try RPC first (if function exists)
    try {
      const { data: newId, error: rpcError } = await supabase.rpc('clone_routine', {
        source_routine_id: routineId,
        new_name: program.routine_name,
      });
      if (!rpcError && newId) {
        console.log('[RoutineBuilder] RPC clone_routine succeeded, new routine ID:', newId);
        return newId;
      }
    } catch (e) {
      console.log('[RoutineBuilder] RPC clone_routine failed, falling back to manual clone:', e);
    }

    // Fallback manual clone
    const { data: newRoutine, error: routineErr } = await supabase
      .from('routines')
      .insert({
        routine_name: program.routine_name,
        user_id: user.id,
        is_archived: false,
        created_by: program.created_by || program.user_id,
        shared_by: program.user_id,
      })
      .select('id')
      .single();
    if (routineErr || !newRoutine) throw routineErr || new Error('Failed to create routine');

    const newRoutineId = newRoutine.id;

    // Insert routine_exercises
    const exercisesPayload = exercises
      .map((ex) => ({
        routine_id: newRoutineId,
        exercise_id: ex.exercise_id,
        exercise_order: ex.order || 0,
        user_id: user.id,
      }));
    let insertedREs = [];
    if (exercisesPayload.length > 0) {
      const { data: reRows, error: reErr } = await supabase
        .from('routine_exercises')
        .insert(exercisesPayload)
        .select('id, exercise_id');
      if (reErr) throw reErr;
      insertedREs = reRows || [];
    }

    // Insert routine_sets
    for (const ex of exercises) {
      const newRE = insertedREs.find((row) => row.exercise_id === ex.exercise_id);
      if (!newRE) continue;
      const setsPayload = (ex.setConfigs || [])
        .map((config, idx) => ({
          routine_exercise_id: newRE.id,
          set_order: idx + 1,
          reps: config.reps,
          weight: config.weight,
          weight_unit: config.unit,
          set_type: config.set_type,
          timed_set_duration: config.timed_set_duration,
          set_variant: config.set_variant,
          user_id: user.id,
        }));
      if (setsPayload.length > 0) {
        const { error: rsErr } = await supabase
          .from('routine_sets')
          .insert(setsPayload);
        if (rsErr) throw rsErr;
      }
    }

    return newRoutineId;
  };

  // Handler for non-owner to add routine to their account
  const handleAddRoutineToAccount = async () => {
    if (!user) {
      navigate(`/create-account?importRoutineId=${routineId}`);
      return;
    }
    
    setSaving(true);
    try {
      const newId = await cloneRoutineForCurrentUser();
      toast.success('Routine saved to your account');
      navigate(`/routines/${newId}`);
    } catch (e) {
      toast.error(e?.message || 'Failed to save routine');
    } finally {
      setSaving(false);
      setAddDialogOpen(false);
    }
  };

  // Handler for non-owner to add and start workout
  const handleAddAndStart = async () => {
    if (!user) {
      navigate(`/create-account?importRoutineId=${routineId}`);
      return;
    }
    
    setSaving(true);
    try {
      const newId = await cloneRoutineForCurrentUser();
      
      // Build program payload for startWorkout
      const programForWorkout = {
        id: newId,
        name: program.routine_name,
        exercises: exercises.map((ex, idx) => ({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise_order: idx + 1,
          exercises: {
            name: ex.name,
            section: ex.section
          },
          routine_sets: (ex.setConfigs || []).map((config, i) => ({
            reps: config.reps,
            weight: config.weight,
            weight_unit: config.unit,
            set_order: i + 1,
            set_variant: config.set_variant,
            set_type: config.set_type,
            timed_set_duration: config.timed_set_duration
          }))
        }))
      };
      
      await startWorkout(programForWorkout);
      navigate('/workout/active');
    } catch (e) {
      console.error('[RoutineBuilder] Add & start error:', e);
      toast.error(e?.message || 'Failed to start workout');
    } finally {
      setSaving(false);
      setAddDialogOpen(false);
    }
  };

  const openAddDialog = () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }
    setAddDialogOpen(true);
  };

  const handleBack = () => {
    if (!isViewerMode) {
      saveOrder();
    }
    if (location.state && location.state.fromPublicImport) {
      navigate('/routines');
    } else if (location.state && location.state.managingForClient) {
      // If trainer is managing a client, go back to the trainer's account page
      navigate('/account');
    } else {
      navigate(-1);
    }
  };

  const handleOpenAddExercise = (section) => {
    setAddExerciseSection(section);
    setShowAddExercise(true);
  };
  
  const openShareDialog = () => {
    setShareDialogOpen(true);
  };


  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/routines/${routineId}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied");
    } catch (e) {
      console.error("Failed to copy share link", e);
      toast.error("Failed to copy link");
    }
  };


  const shareRoutine = async () => {
    setSharing(true);
    try {
      const url = `${window.location.origin}/routines/${routineId}`;
      const title = programName || 'Routine';
      const text = title;

      // Prefer native share whenever available
      if (navigator.share) {
        try {
          await navigator.share({ title, text, url });
        } catch (shareErr) {
          // Swallow user cancellations or share errors
        } finally {
          setSharing(false);
        }
        return;
      }

      // Desktop/unsupported fallback: copy URL only
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      } catch (copyErr) {
        try {
          // Legacy execCommand fallback
          const tmp = document.createElement('input');
          tmp.style.position = 'fixed';
          tmp.style.opacity = '0';
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
          toast.success('Link copied');
        } catch {
          toast.message('Share this link:', { description: url });
        }
      }
    } finally {
      setSharing(false);
    }
  };

  const handleStartWorkout = () => {
    // Create a routine object with exercises data to pass to startWorkout
    // Convert our exercises format to the format expected by ActiveWorkout
    const routine_exercises = exercises
      .filter((ex) => (ex.setConfigs?.length || 0) > 0)
      .map((ex) => ({
      id: ex.id,
      exercise_id: ex.exercise_id,
      exercises: {
        name: ex.name,
        section: ex.section
      },
      routine_sets: ex.setConfigs.map((config, index) => ({
        id: `${ex.id}-set-${index}`, // Generate a unique ID for each set
        reps: config.reps,
        weight: config.weight,
        weight_unit: config.unit,
        set_order: index + 1,
        set_variant: config.set_variant,
        set_type: config.set_type,
        timed_set_duration: config.timed_set_duration,
      }))
    }));

    const routine = {
      id: routineId,
      routine_name: programName,
      routine_exercises: routine_exercises,
    };
    
    console.log('[RoutineBuilder] handleStartWorkout invoked for routine:', routine);
    
    // Users should never be able to access this page with an active workout due to redirect logic
    // If they somehow do, just start the workout (this will end the current one)
    const programForWorkout = {
      id: routine.id,
      name: routine.routine_name,
      exercises: routine.routine_exercises
    };
    startWorkout(programForWorkout)
      .then(() => navigate("/workout/active"))
      .catch((error) => {
        console.error('[RoutineBuilder] startWorkout error for routine', routine, error);
        toast.error('Failed to start workout: ' + error.message);
      });
  };



  const handleAddExercise = async (exerciseData) => {
    try {
      let { data: existing } = await supabase
        .from("exercises")
        .select("id, section")
        .eq("name", exerciseData.name)
        .maybeSingle();
      let exercise_id = existing?.id;
      if (!exercise_id) {
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert([{ name: exerciseData.name, section: exerciseData.section || "training" }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      } else {
        // Ensure the exercise's canonical section matches the user's selection from the sheet
        const desiredSection = exerciseData.section || "training";
        if (existing.section !== desiredSection) {
          await supabase
            .from("exercises")
            .update({ section: desiredSection })
            .eq("id", exercise_id);
        }
      }
      // Check if this exercise is already in the routine
      const { data: existingRoutineExercise } = await supabase
        .from("routine_exercises")
        .select("id")
        .eq("routine_id", routineId)
        .eq("exercise_id", exercise_id)
        .maybeSingle();

      if (existingRoutineExercise) {
        throw new Error("This exercise is already in the routine");
      }

      // Get the next available exercise_order to avoid conflicts
      const { data: maxOrderResult } = await supabase
        .from("routine_exercises")
        .select("exercise_order")
        .eq("routine_id", routineId)
        .order("exercise_order", { ascending: false })
        .limit(1)
        .single();

      const nextOrder = (maxOrderResult?.exercise_order || 0) + 1;

      const { data: progEx, error: progExError } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: routineId,
          exercise_id,
          exercise_order: nextOrder,
        })
        .select("id")
        .single();
      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        routine_exercise_id: program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${idx + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("routine_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to save set details: " + setError.message);
      }
      setShowAddExercise(false);
      await refreshExercises();
      // After adding, scroll the selected (possibly changed) section into view for user feedback
      if (exerciseData.section) {
        const scrollKey = exerciseData.section === 'training' ? 'workout' : exerciseData.section;
        setTimeout(() => scrollSectionIntoView(scrollKey), 0);
      }
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      await supabase
        .from("exercises")
        .update({ name: exerciseData.name, section: exerciseData.section })
        .eq("id", editingExercise.exercise_id);
      // Safely persist set changes using the shared updater that respects the DB trigger
      await handleSetConfigsChange(editingExercise.exercise_id, exerciseData.setConfigs || []);
      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to update exercise");
    }
  };

  const handleDeleteExercise = () => {
    if (!editingExercise) return;
    setDeleteExerciseConfirmOpen(true);
  };

  const handleConfirmDeleteExercise = async () => {
    try {
      if (!editingExercise) return;

      // Delete the routine exercise directly (trigger prevents zero-set state otherwise)
      const { error: deleteError } = await supabase
        .from("routine_exercises")
        .delete()
        .eq("id", editingExercise.id);

      if (deleteError) throw deleteError;

      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this exercise because it is used by other routines or has logged sets.');
      } else {
        alert(err.message || 'Failed to delete exercise');
      }
    } finally {
      setDeleteExerciseConfirmOpen(false);
    }
  };

  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from("routine_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         exercises!fk_routine_exercises__exercises(
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
         )`
      )
      .eq("routine_id", routineId)
      .order("exercise_order", { ascending: true });
    const items = (progExs || []).map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: (pe.exercises as any)?.name || "[Exercise name]",
      section: (pe.exercises as any)?.section || "training",
      sets: pe.routine_sets?.length || 0,
      order: pe.exercise_order || 0,
      setConfigs: (pe.routine_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => {
          const unit = set.weight_unit || 'lbs';
          return {
            reps: set.reps,
            weight: set.weight,
            unit,
            set_variant: set.set_variant || `Set ${set.set_order}`,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
          };
        }),
    }));
    setExercises(items);
  };

  const searchFiltered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const SECTION_KEYS = ["warmup", "workout", "cooldown"];

  const exercisesBySection = SECTION_KEYS.map((key) => {
    const target = key === "workout" ? "training" : key;
    const items = searchFiltered
      .filter((ex) => ex.section === target)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { section: key, exercises: items };
  });

  const scrollSectionIntoView = (key) => {
    scrollToSection(`section-${key}`);
  };

  const handleModalClose = () => {
    setShowAddExercise(false);
    setEditingExercise(null);
    setAddExerciseSection(null);
  };

  // Handler to update setConfigs for an exercise and persist to Supabase
  const handleSetConfigsChange = async (exerciseId, newSetConfigs) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId
          ? { ...ex, setConfigs: newSetConfigs }
          : ex
      )
    );
    // Find the program_exercise_id for this exercise
    const programExercise = exercises.find(
      (ex) => ex.exercise_id === exerciseId
    );
    if (!programExercise) return;
    const program_exercise_id = programExercise.id;
    
    // If no sets remain, delete all existing routine_sets; DB trigger will auto-delete exercise
    if (!newSetConfigs || newSetConfigs.length === 0) {
      await supabase
        .from("routine_sets")
        .delete()
        .eq("routine_exercise_id", program_exercise_id);
      await refreshExercises();
      return;
    }

    // Update existing sets without ever hitting zero remaining rows
    // 1) Load current sets ordered by set_order
    const { data: currentSets, error: currentErr } = await supabase
      .from("routine_sets")
      .select("id")
      .eq("routine_exercise_id", program_exercise_id)
      .order("set_order", { ascending: true });
    if (currentErr) {
      console.error("Failed to load current routine sets:", currentErr);
      return;
    }

    const curIds = (currentSets || []).map((s) => s.id);
    const curCount = curIds.length;
    const nextCount = newSetConfigs.length;
    const minCount = Math.min(curCount, nextCount);

    // 2) Update rows for the overlapping range
    for (let i = 0; i < minCount; i++) {
      const cfg = newSetConfigs[i];
      const id = curIds[i];
      const payload = {
        set_order: i + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${i + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      };
      // eslint-disable-next-line no-await-in-loop
      await supabase.from("routine_sets").update(payload).eq("id", id);
    }

    // 3) If there are extra current rows beyond nextCount, delete only those extras (leaves >=1 row)
    if (curCount > nextCount) {
      const toDelete = curIds.slice(nextCount); // keep first `nextCount` rows
      if (toDelete.length > 0) {
        await supabase
          .from("routine_sets")
          .delete()
          .in("id", toDelete);
      }
    }

    // 4) If new configs exceed current count, insert the additional rows
    if (nextCount > curCount) {
      const rowsToInsert = [];
      for (let i = curCount; i < nextCount; i++) {
        const cfg = newSetConfigs[i];
        rowsToInsert.push({
          routine_exercise_id: program_exercise_id,
          set_order: i + 1,
          reps: Number(cfg.reps),
          weight: Number(cfg.weight),
          weight_unit: cfg.unit,
          set_variant: cfg.set_variant || `Set ${i + 1}`,
          set_type: cfg.set_type,
          timed_set_duration: cfg.timed_set_duration,
        });
      }
      if (rowsToInsert.length > 0) {
        await supabase.from("routine_sets").insert(rowsToInsert);
      }
    }
  };

  const handleTitleChange = async (newTitle) => {
    const nameClamped = (newTitle || '').slice(0, MAX_ROUTINE_NAME_LEN);
    setProgramName(nameClamped);
    await supabase
      .from("routines")
      .update({ routine_name: nameClamped })
      .eq("id", routineId);
    setEditProgramOpen(false);

    // Immediately refresh OG image for fast rename propagation
    try {
      // Compute current metrics from state
      const exerciseCount = exercises.length;
      const setCount = exercises.reduce((t, ex) => t + (ex.setConfigs?.length || 0), 0);

      // Update generation fingerprints to avoid duplicate effect runs
      const name = (newTitle || '').trim();
      const sig = `${name}|${exerciseCount}|${setCount}`;
      if (ogGenTimerRef.current) {
        clearTimeout(ogGenTimerRef.current);
        ogGenTimerRef.current = null;
      }
      ogLastSigRef.current = sig;
      ogLastRunRef.current = Date.now();

      const { generateAndUploadRoutineOGImage } = await import('@/lib/ogImageGenerator');
      const imageUrl = await generateAndUploadRoutineOGImage(routineId, {
        routineName: name || 'Routine',
        ownerName: '',
        exerciseCount,
        setCount,
      });
      setProgram(prev => (prev ? { ...prev, og_image_url: imageUrl } : prev));
    } catch (e) {
      console.warn('[OG] immediate rename image refresh failed', e);
    }
  };

  const handleDeleteProgram = () => {
    setDeleteProgramConfirmOpen(true);
    setEditProgramOpen(false);
  };

  const handleConfirmDeleteProgram = async () => {
    try {
      const { error } = await supabase
        .from("routines")
        .update({ is_archived: true })
        .eq("id", routineId);

      if (error) throw error;

      navigate("/routines");
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this routine because it has associated workouts.');
      } else {
        alert('Failed to delete routine: ' + err.message);
      }
    }
  };



  return (
    <>
      <AppLayout
        hideHeader={false}
        hideDelegateHeader={true}
        title={programName || "Routine"}
        titleRightText={isViewerMode && ownerName ? `Shared by ${ownerName}` : undefined}
        showPlusButton={false}
        showShare={true}
        onShare={shareRoutine}
        showStartWorkoutIcon={!isViewerMode && !isDelegated}
        onStartWorkoutIcon={handleStartWorkout}
        showSettings={!isViewerMode}
        onSettings={() => setEditProgramOpen(true)}
        showDelete={!isViewerMode}
        onDelete={() =>	setDeleteProgramConfirmOpen(true)}
        showSidebar={!isViewerMode && !isDelegated && !isMobile}
        sharingSection={undefined}
      >
        {isViewerMode ? (
          /* VIEWER MODE: Read-only view for non-owners */
          <div className="flex flex-col min-h-screen" style={{ paddingTop: 'calc(var(--header-height) + 20px)' }}>
            {/* Routine Image */}
            <div className="self-stretch inline-flex flex-col justify-center items-center mb-3">
              <div className="w-full max-w-[500px] rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 flex flex-col justify-center items-center overflow-hidden">
                <img 
                  data-layer="open-graph-image"
                  className="OpenGraphImage w-full h-auto" 
                  src={program?.og_image_url || `/api/og-images?type=routine&routineId=${routineId}`} 
                  alt={`${programName} routine`}
                  draggable={false}
                  style={{ maxHeight: '256px', objectFit: 'contain' }}
                  onError={(e) => {
                    console.log('Image failed to load:', (e.target as HTMLImageElement).src);
                    console.log('Falling back to default image');
                    (e.target as HTMLImageElement).src = "/images/default-open-graph.png";
                  }}
                  onLoad={(e) => console.log('Image loaded successfully:', (e.target as HTMLImageElement).src)}
                />
                <div 
                  data-layer="routine-link"
                  className="RoutineLink w-full h-11 max-w-[500px] px-3 bg-neutral-Neutral-50 border-t border-neutral-neutral-300 inline-flex justify-between items-center"
                  onClick={shareRoutine}
                  style={{ cursor: "pointer" }}
                >
                  <div data-layer="routine-name" className="ChestAndTriceps justify-center text-neutral-neutral-600 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
                    {programName} 
                  </div>
                  <div data-layer="lucide-icon" data-icon="list-checks" className="LucideIcon size-6 relative overflow-hidden">
                    <ListChecks className="w-6 h-6 text-neutral-neutral-600" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Exercise list (read-only) */}
            <PageSectionWrapper
              section="workout"
              id={`section-workout`}
              deckGap={12}
              deckVariant="cards"
              reorderable={false}
              items={exercises}
              className="flex-1"
              applyPaddingOnParent={true}
              style={{ paddingLeft: 28, paddingRight: 28, paddingBottom: 0, maxWidth: '500px', minWidth: '0px' }}
            >
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exerciseName={ex.name}
                setConfigs={ex.setConfigs}
                hideGrip
                addTopBorder
              />
            ))}
            </PageSectionWrapper>
            
            {/* Persistent Add Button - Absolutely positioned at bottom */}
            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center items-center px-5 pb-5 bg-[linear-gradient(to_bottom,rgba(245,245,244,0)_0%,rgba(245,245,244,0)_10%,rgba(245,245,244,0.5)_40%,rgba(245,245,244,1)_80%,rgba(245,245,244,1)_100%)]" style={{ paddingBottom: '20px' }}>
              <div 
                className="w-full max-w-[500px] h-14 pl-2 pr-5 bg-green-600 rounded-[20px] shadow-[0px_0px_8px_0px_rgba(212,212,212,1.00)] backdrop-blur-[1px] inline-flex justify-start items-center cursor-pointer"
                onClick={openAddDialog}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAddDialog(); } }}
                aria-label={user ? "Add routine to my account" : "Create account or login to add routine"}
              >
                <div className="p-2.5 flex justify-start items-center gap-2.5">
                  <div className="relative">
                    <Bookmark className="w-6 h-6" stroke="white" strokeWidth="2" />
                  </div>
                </div>
                <div className="flex justify-center items-center gap-5">
                  <div className="justify-center text-white text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
                    {user ? "Add routine to my account" : "Create account or login to add routine"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* OWNER MODE: Full editor for routine owners */
          <>
            <div className="flex flex-col min-h-screen" style={{ paddingTop: spacing.paddingTop }}>
              {/* Routine Image and Link Section */}
          <div className="self-stretch inline-flex flex-col justify-center items-center mb-3">
            <div className="w-full max-w-[500px] rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 overflow-hidden flex flex-col">
              <img 
                data-layer="open-graph-image"
                className="OpenGraphImage w-full h-auto" 
                src={program?.og_image_url || "https://placehold.co/500x262"} 
                alt={`${programName} routine`}
                draggable={false}
                style={{ maxHeight: '256px', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  console.log('Image failed to load:', program?.og_image_url);
                  (e.target as HTMLImageElement).src = "https://placehold.co/500x262";
                }}
                onLoad={() => console.log('Image loaded successfully:', program?.og_image_url)}
              />
              <div 
                data-layer="routine-link"
                className="RoutineLink w-full h-11 max-w-[500px] px-3 bg-neutral-Neutral-50 border-t border-neutral-neutral-300 inline-flex justify-between items-center"
                onClick={() => navigate('/history', { state: { filterRoutine: programName } })}
                style={{ cursor: "pointer" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/history', { state: { filterRoutine: programName } }); } }}
                aria-label="View routine history"
              >
                <div data-layer="routine-name" className="justify-center text-neutral-neutral-600 text-sm font-semibold font-['Be_Vietnam_Pro'] leading-5">
                  {programName} 
                </div>
                <div data-layer="lucide-icon" data-icon="list-checks" className="LucideIcon size-6 relative overflow-hidden">
                  <ListChecks className="w-6 h-6 text-neutral-neutral-600" />
                </div>
              </div>
            </div>
          </div>
          
          {exercisesBySection.map(({ section, exercises: secExercises }, index) => (
          <PageSectionWrapper
            key={section}
            section={section} 
            id={`section-${section}`} 
            deckGap={12} 
            deckVariant="cards"
            reorderable={true}
            items={secExercises}
            onReorder={handleReorderExercises(section)}
            isFirst={section === "warmup"}
            className={`${section === "warmup" ? "border-t-0" : ""} ${index === exercisesBySection.length - 1 ? "flex-1" : ""}`}
            backgroundClass="bg-transparent"
            showPlusButton={false}
            applyPaddingOnParent={true}
            style={{ paddingLeft: spacing.paddingX, paddingRight: spacing.paddingX, paddingBottom: 0, maxWidth: spacing.maxWidth, minWidth: '0px' }}
          >
          {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : secExercises.map((ex, exIndex) => (
              <ExerciseCard
                key={ex.id}
                mode="default"
                exerciseName={ex.name}
                setConfigs={ex.setConfigs}
                onEdit={() => setEditingExercise(ex)}
                onSetConfigsChange={(newSetConfigs) =>
                  handleSetConfigsChange(ex.exercise_id, newSetConfigs)
                }
                onCardClick={() => setEditingExercise(ex)}
              />
            ))}
            {/* Single persistent add button as last item */}
            <CardWrapper gap={0} marginTop={12} marginBottom={0}>
              <ActionCard
                text="Add an exercise"
                onClick={() => handleOpenAddExercise(section)}
                className="self-stretch w-full"
              />
            </CardWrapper>
          </PageSectionWrapper>
        ))}
            </div>
            <SwiperForm
          open={showAddExercise || !!editingExercise}
          onOpenChange={(open) => {
            handleModalClose();
          }}
          title={showAddExercise ? "Exercise" : "Edit"}
          description={
            showAddExercise 
              ? "Add a new exercise to your routine with name, section, and sets" 
              : "Edit exercise details including name, section, and sets"
          }
          leftAction={handleModalClose}
          rightAction={() => formRef.current.requestSubmit()}
          rightEnabled={dirty}
          className="add-exercise-drawer"
        >
          <div className="flex flex-col h-full overflow-y-scroll md:overflow-y-auto">
            <div className="overflow-y-scroll md:overflow-auto h-[650px] md:h-full">
              <AddNewExerciseForm
                ref={formRef}
                key={editingExercise ? editingExercise.id : "add-new"}
                formPrompt={
                  showAddExercise ? "Add a new exercise" : "Edit exercise"
                }
                onActionIconClick={
                  showAddExercise ? (exerciseData) => handleAddExercise(exerciseData) : (exerciseData) => handleEditExercise(exerciseData)
                }
                onDelete={editingExercise ? handleDeleteExercise : undefined}
                initialName={editingExercise?.name}
                initialSection={
                  showAddExercise
                    ? addExerciseSection === "workout" || addExerciseSection === "training"
                      ? "training"
                      : addExerciseSection
                    : editingExercise?.section
                }
                initialSets={editingExercise?.setConfigs?.length}
                initialSetConfigs={editingExercise?.setConfigs}
                onDirtyChange={() => setDirty(true)}
                hideActionButtons
                showAddToProgramToggle={false}
                hideSetDefaults={!!editingExercise}
                onEditSet={() => handleEditSet(0, {})}
              />
              {editingExercise && (
                <div className="flex flex-col gap-3 py-4 px-4">
                  <SwiperButton
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteExercise}
                  >
                    Delete exercise
                  </SwiperButton>
                </div>
              )}
            </div>
          </div>
        </SwiperForm>
          </>
        )}
        
      </AppLayout>

      {/* Share Routine Sheet */}
      <SwiperForm
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        title="Share"
        leftAction={() => setShareDialogOpen(false)}
        leftText="Close"
      >
        <FormSectionWrapper bordered={true} className="flex flex-col gap-5">
          <p className="text-base font-medium leading-tight font-vietnam text-slate-600">
            Publish your routine <span className="text-slate-300">to a public website that anyone you share the link with can view.</span>
          </p>
        </FormSectionWrapper>

        <FormSectionWrapper bordered={false} className="flex flex-col gap-5">
          <TextInput
            label="Click to copy"
            value={`${window.location.origin}/routines/${routineId}`}
            readOnly
            onFocus={(e) => e.target.select()}
            onClick={handleCopyLink}
            icon={<Copy />}
          />
        </FormSectionWrapper>
      </SwiperForm>

      <SwiperForm
        open={isEditProgramOpen}
        onOpenChange={setEditProgramOpen}
        title="Edit"
        description="Edit routine name and manage program settings"
        leftAction={() => setEditProgramOpen(false)}
        leftText="Cancel"
        rightAction={() => handleTitleChange(programName)}
        rightText="Save"
      >
        <FormSectionWrapper>
          <div className="w-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-2">
              <div className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Routine name</div>
              <div
                className={`${(programName || '').length >= MAX_ROUTINE_NAME_LEN ? 'text-red-400' : 'text-neutral-400'} text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight`}
                aria-live="polite"
              >
                {(programName || '').length} of {MAX_ROUTINE_NAME_LEN} characters
              </div>
            </div>
            <TextInput
              value={programName}
              onChange={(e) => setProgramName(e.target.value)}
              maxLength={MAX_ROUTINE_NAME_LEN}
              error={(programName || '').length >= MAX_ROUTINE_NAME_LEN}
            />
          </div>
        </FormSectionWrapper>
        <FormSectionWrapper bordered={false}>
          <SwiperButton
            variant="destructive"
            onClick={handleDeleteProgram}
            className="w-full"
          >
            Delete program
          </SwiperButton>
        </FormSectionWrapper>
      </SwiperForm>

      <SwiperForm
        open={isEditSetFormOpen}
        onOpenChange={setIsEditSetFormOpen}
        title="Edit"
        description="Edit set configuration including type, reps, weight, and unit"
        leftAction={handleSetEditFormClose}
        rightAction={() => handleSetEditFormSave(editingSet)}
        rightEnabled={editingSetFormDirty}
        rightText="Save"
        leftText="Cancel"
        padding={0}
      >
        <SetEditForm
          hideInternalHeader
          hideActionButtons
          hideToggle={true}
          onDirtyChange={setEditingSetFormDirty}
          onValuesChange={setEditingSet}
          onDelete={handleSetDelete}
          initialValues={editingSet}
        />
      </SwiperForm>

      <SwiperDialog
        open={isDeleteProgramConfirmOpen}
        onOpenChange={setDeleteProgramConfirmOpen}
        onConfirm={handleConfirmDeleteProgram}
        title="Delete routine?"
        confirmText="Delete forever"
        cancelText="Cancel"
        confirmVariant="destructive"
        cancelVariant="outline"
      />
      <SwiperDialog
        open={isDeleteExerciseConfirmOpen}
        onOpenChange={setDeleteExerciseConfirmOpen}
        onConfirm={() => setDeleteExerciseConfirmOpen(false)}
        onCancel={handleConfirmDeleteExercise}
        title="Delete Exercise"
        confirmText="Cancel"
        cancelText="Delete"
        confirmVariant="outline"
        cancelVariant="destructive"
        contentClassName=""
        headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-t border-neutral-300 inline-flex justify-start items-center"
        footerClassName="self-stretch px-3 py-3"
        showHeaderDismiss={true}
      />

      {/* Viewer Mode Dialogs */}
      {isViewerMode && (
        <>
          {/* Add/Save Dialog */}
          <SwiperDialog
            open={addDialogOpen}
            onOpenChange={setAddDialogOpen}
            title="Add routine to my account?"
            hideFooter
          >
            <div className="grid grid-cols-1 gap-3 pb-3">
              <SwiperButton
                variant="outline"
                onClick={handleAddAndStart}
                disabled={saving}
              >
                Add & start workout
              </SwiperButton>
              <SwiperButton
                variant="outline"
                onClick={handleAddRoutineToAccount}
                disabled={saving}
              >
                Add to my account
              </SwiperButton>
            </div>
          </SwiperDialog>

          {/* Auth Dialog for logged-out users */}
          <SwiperDialog
            open={authDialogOpen}
            onOpenChange={setAuthDialogOpen}
            title="Have an account?"
            hideFooter
          >
            <div className="grid grid-cols-1 gap-3 pb-3">
              <SwiperButton
                variant="outline"
                onClick={() => navigate(`/create-account?importRoutineId=${routineId}`)}
              >
                Create account
              </SwiperButton>
              <SwiperButton
                variant="outline"
                onClick={() => navigate(`/login?importRoutineId=${routineId}`)}
              >
                Login
              </SwiperButton>
            </div>
          </SwiperDialog>
        </>
      )}

    </>
  );
};

export default RoutineBuilder;
