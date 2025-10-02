import ActiveExerciseCard from "./components/ActiveExerciseCard";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import SwiperForm from "@/components/molecules/swiper-form";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { supabase } from "@/supabaseClient";
import { useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";
import { ActionCard } from "@/components/molecules/action-card";

const ActiveWorkoutSection = ({
  section,
  onSectionComplete,
  onUpdateLastExercise,
  isLastSection = false,
}) => {
  const { activeWorkout, markSetManuallyCompleted, markSetToasted, isSetToasted } = useActiveWorkout();
  const { isDelegated } = useAccount();
  const {
    updateSectionExercises,
    markExerciseComplete,
    completedExercises: globalCompletedExercises,
    focusedExercise,
    setFocusedExerciseId,
    isRestoringFocus
  } = useWorkoutNavigation();

  // Local state for this section's exercises
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  // Remove local focus state - use global focus only
  const [lastCompletedExerciseId, setLastCompletedExerciseId] = useState(null);
  

  // Form state management
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [canAddExercise, setCanAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);
  const [exerciseUpdateType, setExerciseUpdateType] = useState("today");
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [setUpdateType, setSetUpdateType] = useState("today");
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);
  const [addingSetToExercise, setAddingSetToExercise] = useState(null);
  const [removingSetFromExercise, setRemovingSetFromExercise] = useState(null);

  // Form refs
  const addExerciseFormRef = useRef(null);
  const editExerciseFormRef = useRef(null);

  // Fetch exercises for this section
  const fetchExercises = useCallback(async () => {
    if (!activeWorkout?.id) return;

    if (firstLoad) setLoading(true);

    try {
      // Fetch workout exercises for this section
      const { data: workoutExercises, error: workoutError } = await supabase
        .from("workout_exercises")
        .select(`
          id,
          exercise_id,
          exercise_order,
          snapshot_name,
          name_override,
          section_override,
          exercises!workout_exercises_exercise_id_fkey(
            name,
            section
          )
        `)
        .eq("workout_id", activeWorkout.id)
        .order("exercise_order", { ascending: true });

      if (workoutError) {
        console.error("Error fetching workout exercises:", workoutError);
        return;
      }

      // Filter by section_override if present, otherwise by exercises.section
      const filteredExercises = (workoutExercises || []).filter(we => {
        const sec = we.section_override || we.exercises?.section;
        if (section === "training") return sec === "training" || sec === "workout";
        return sec === section;
      });

      // Fetch template sets for each exercise
      const { data: templateSets, error: templateError } = await supabase
        .from("routine_exercises")
        .select(`
          exercise_id,
          routine_sets!fk_routine_sets__routine_exercises(
            id,
            set_order,
            reps,
            weight,
            weight_unit,
            set_variant,
            set_type,
            timed_set_duration
          )
        `)
        .eq("routine_id", activeWorkout.programId)
        .order("set_order", { foreignTable: "routine_sets", ascending: true });

      if (templateError) {
        console.error("Error fetching template sets:", templateError);
      }

      // Fetch saved sets for this workout
      const { data: savedSets, error: savedError } = await supabase
        .from("sets")
        .select("*")
        .eq("workout_id", activeWorkout.id);

      if (savedError) {
        console.error("Error fetching saved sets:", savedError);
      }

              // Group template sets by exercise_id
        const templateSetsMap = {};
        (templateSets || []).forEach((re) => {
        templateSetsMap[re.exercise_id] = (re.routine_sets || []).map((rs) => ({
          id: null,
          routine_set_id: rs.id,
          reps: rs.reps,
          weight: rs.weight,
          unit: rs.weight_unit,
          set_variant: rs.set_variant,
          set_type: rs.set_type,
          timed_set_duration: rs.timed_set_duration,
        }));
      });

              // Group saved sets by exercise_id (include hidden so we can match them to templates)
        const savedSetsMap = {};
        (savedSets || []).forEach((set) => {
          if (!savedSetsMap[set.exercise_id]) {
            savedSetsMap[set.exercise_id] = [];
          }
          savedSetsMap[set.exercise_id].push(set);
        });

              // Build exercise objects with merged set configs
        const processedExercises = filteredExercises.map((we) => {
          console.log(`Processing exercise ID: ${we.exercise_id}`);
          const templateConfigs = templateSetsMap[we.exercise_id] || [];
          const savedSetsForExercise = savedSetsMap[we.exercise_id] || [];

        // Merge template sets with saved sets
        const mergedSetConfigs = [];

        // Start with template sets in their original order
        console.log("Template configs for this exercise:", templateConfigs);
        console.log("Saved sets for this exercise:", savedSetsForExercise);
        templateConfigs.forEach((template) => {
          const savedSet = savedSetsForExercise.find(
            (saved) => saved.routine_set_id === template.routine_set_id
          );

          console.log(`Checking template ${template.routine_set_id}:`, template);
          console.log(`Found saved set:`, savedSet);

          // Skip this template set if there's a hidden saved set for it
          if (savedSet && savedSet.status === "hidden") {
            console.log(`Skipping template ${template.routine_set_id} due to hidden set`);
            return;
          }

          if (savedSet) {
            mergedSetConfigs.push({
              id: savedSet.id,
              routine_set_id: savedSet.routine_set_id,
              reps: savedSet.reps,
              weight: savedSet.weight,
              unit: savedSet.weight_unit,
              weight_unit: savedSet.weight_unit,
              set_variant: savedSet.set_variant,
              set_type: savedSet.set_type,
              timed_set_duration: savedSet.timed_set_duration,
              status: savedSet.status || "default",
              set_order: template.set_order, // Use the actual set_order from template
              account_id: savedSet.account_id, // Include account_id to track who completed the set
            });
          } else {
            mergedSetConfigs.push({
              ...template,
              unit: template.unit || "lbs",
              weight_unit: template.unit || "lbs",
              set_order: template.set_order, // Use the actual set_order from template
            });
          }
        });

        // Add orphaned saved sets at the end
        let orphanIndex = templateConfigs.length;
        savedSetsForExercise.forEach((saved) => {
          if (saved.status === "hidden") return; // never render hidden orphan sets

          const hasTemplateCounterpart = templateConfigs.some(
            (template) => template.routine_set_id === saved.routine_set_id
          );

          if (!hasTemplateCounterpart) {
            mergedSetConfigs.push({
              id: saved.id,
              routine_set_id: saved.routine_set_id,
              reps: saved.reps,
              weight: saved.weight,
              unit: saved.weight_unit,
              weight_unit: saved.weight_unit,
              set_variant: saved.set_variant,
              set_type: saved.set_type,
              timed_set_duration: saved.timed_set_duration,
              status: saved.status || "default",
              set_order: saved.set_order || orphanIndex++, // Use saved set_order or assign next
              account_id: saved.account_id, // Include account_id to track who completed the set
            });
          }
        });

        // Sort by set_order first to ensure stable positioning
        // This prevents sets from reordering when renamed
        mergedSetConfigs.sort((a, b) => {
          const aOrder = a.set_order ?? 0;
          const bOrder = b.set_order ?? 0;
          return aOrder - bOrder;
        });

        // Ensure unique set_variant names while preserving original order
        const usedNames = new Set();
        
        // First pass: collect all existing names
        mergedSetConfigs.forEach((set) => {
          if (set.set_variant) {
            usedNames.add(set.set_variant);
          }
        });
        
        // Second pass: assign default names only to sets that need them
        // Use set_order for naming to maintain consistency
        mergedSetConfigs.forEach((set) => {
          // Only assign a default name if the set doesn't have one
          if (!set.set_variant) {
            // Use the set_order for naming to maintain consistency
            const setOrder = set.set_order ?? 1;
            set.set_variant = `Set ${setOrder}`;
            usedNames.add(set.set_variant);
          }
        });

        return {
          id: we.id,
          exercise_id: we.exercise_id,
          section: section,
          name: we.name_override || we.snapshot_name,
          setConfigs: mergedSetConfigs,
        };
      });

      setExercises(processedExercises);
      // Update global context with exercises for this section
      updateSectionExercises(section, processedExercises);
      setLoading(false);
      setFirstLoad(false);
      return processedExercises; // Return the processed exercises for the next step
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Failed to load exercises");
    } finally {
      // setLoading(false); // This line is removed as per the new_code
    }
  }, [activeWorkout?.id, activeWorkout?.programId, section, firstLoad]);

  // Fetch exercises when workout changes
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises, markSetManuallyCompleted]);

  // Real-time subscription for sets in this section
  useEffect(() => {
    if (!activeWorkout?.id) return;

    // We'll check exercise membership dynamically inside the callback
    // to avoid recreating the subscription when exercises change

    const setsChan = supabase
      .channel(`sets-section-${section}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sets', 
        filter: `workout_id=eq.${activeWorkout.id}` 
      }, async ({ eventType, new: row, old }) => {
        console.log('[Real-time] Set change received:', { eventType, row, old });
        
        // Check if this set belongs to an exercise in this section FIRST
        const currentExerciseIds = exercises.map(ex => ex.exercise_id);
        if (!currentExerciseIds.includes(row.exercise_id)) return;
        
        // Handle different event types
        if (eventType === "DELETE") {
          console.log('[Real-time] Set deleted:', old);
          // For DELETE events, refresh exercises to get updated data
          fetchExercises();
          return;
        }
        
        // Only process if the set belongs to an exercise in this section
        // Check if this is a remote set completion (either INSERT or UPDATE)
        if ((eventType === "UPDATE" && row.status === "complete" && old?.status !== "complete") ||
            (eventType === "INSERT" && row.status === "complete")) {
          console.log('[Real-time] Remote set completion detected:', row);
          
          // Get current user to compare with the set's account_id
          const { data: { user } } = await supabase.auth.getUser();
          
          // Note: We don't mark sets as manually completed here anymore
          // This was causing issues where DB updates from other clients
          // were being marked as manually completed, preventing animations
          // Manual completion tracking is now handled only in the swipe-switch component
          
          // Show toast for ALL set completions (both local and remote) for debugging
          // Check if we've already shown a toast for this set globally
          if (isSetToasted(row.id)) {
            console.log('[Real-time] Skipping toast - already shown for set:', row.id);
            return;
          }
          
          // Determine who completed the set based on account_id comparison
          const wasCompletedByCurrentUser = row.account_id === user?.id;
          const completedByUserType = wasCompletedByCurrentUser ? (isDelegated ? 'Manager' : 'Client') : (isDelegated ? 'Client' : 'Manager');
          
          console.log('[Real-time] Set completed by:', completedByUserType, 'account_id:', row.account_id, 'user_id:', user?.id, 'isDelegated:', isDelegated, 'wasCompletedByCurrentUser:', wasCompletedByCurrentUser);
          
          // Mark this set as toasted globally to prevent duplicates across sections
          markSetToasted(row.id);
        }

        // Refresh exercises to get updated data for all other events (INSERT, UPDATE)
        fetchExercises();
      })
      .subscribe();

    return () => {
      void setsChan.unsubscribe();
    };
  }, [activeWorkout?.id, section, fetchExercises, markSetToasted, isSetToasted]);



  // Real-time subscription for workout exercises in this section
  useEffect(() => {
    if (!activeWorkout?.id) return;

    const exercisesChan = supabase
      .channel(`workout-exercises-section-${section}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'workout_exercises', 
        filter: `workout_id=eq.${activeWorkout.id}` 
      }, ({ eventType, new: row, old }) => {
        // Handle new exercise additions, updates, and deletions
        if (eventType === "INSERT" || eventType === "UPDATE" || eventType === "DELETE") {
          // Refresh exercises to get updated data
          fetchExercises();
          
          // Log new exercise additions
          if (eventType === "INSERT") {
            const swiperType = isDelegated ? 'Manager' : 'Client';
            console.log('[Real-time] Exercise added by:', swiperType);
          }
        }
      })
      .subscribe();

    return () => {
      void exercisesChan.unsubscribe();
    };
  }, [activeWorkout?.id, section, fetchExercises, isDelegated]);

  // Memoized initial values for SetEditForm
  const setEditFormInitialValues = React.useMemo(() => {
    if (!editingSet?.setConfig) return {};
    const initialValues = {
      ...editingSet.setConfig,
      unit:
        editingSet.setConfig.weight_unit || editingSet.setConfig.unit || "lbs",
      set_type: editingSet.setConfig.set_type || "reps",
      timed_set_duration: editingSet.setConfig.timed_set_duration || 30,
    };
    return initialValues;
  }, [
    editingSet?.setConfig?.routine_set_id,
    editingSet?.setConfig?.weight_unit,
    editingSet?.setConfig?.unit,
    editingSet?.setConfig?.weight,
    editingSet?.setConfig?.reps,
    editingSet?.setConfig?.timed_set_duration,
    editingSet?.setConfig?.set_type,
    editingSet?.setConfig?.set_variant,
  ]);

  // Simplified focus management - just use global focus
  const isExerciseFocused = useCallback((exerciseId) => {
    return focusedExercise?.exercise_id === exerciseId;
  }, [focusedExercise]);

  // Handle cross-section navigation when focused exercise changes
  useEffect(() => {
    if (focusedExercise && (focusedExercise.section === section || focusedExercise.section === null)) {
      // Check if the exercise exists in this section before setting focus
      const exerciseExists = exercises.some(ex => ex.exercise_id === focusedExercise.exercise_id);
      if (exerciseExists) {
        // console.log(`[${section}] Global focus set to exercise: ${focusedExercise.exercise_id}`);
      }
    }
  }, [focusedExercise, section, exercises]);

  // Reset form state when forms are opened
  useEffect(() => {
    if (editingExercise) {
      setExerciseUpdateType("today");
    }
  }, [editingExercise]);

  useEffect(() => {
    if (editingSet) {
      setSetUpdateType("today");
    }
  }, [editingSet]);

  // Internal focus change logic
  const changeFocus = useCallback(
    (newExerciseId) => {
      // Set global focus immediately
      setFocusedExerciseId(newExerciseId, section);

      const exercise = exercises.find(
        (ex) => ex.exercise_id === newExerciseId
      );
      // Only update database if this is a user-initiated focus change, not restoration
      if (exercise?.id && onUpdateLastExercise && !isRestoringFocus) {
        onUpdateLastExercise(exercise.id);
      }
    },
    [exercises, onUpdateLastExercise, setFocusedExerciseId, section, isRestoringFocus]
  );

  // Handle set completion
  const handleSetComplete = useCallback(async (exerciseId, setConfig) => {
    try {
      // Get current user for account_id - always use the authenticated user's ID, not the acting user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save set to database
      const payload = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        set_variant: setConfig.set_variant,
        status: 'complete',
        account_id: user?.id // Always use the authenticated user's ID (manager's ID when delegating)
      };

      const isTimed = setConfig.set_type === 'timed';

      if (isTimed) {
        payload.reps = 1;
      } else if (setConfig.reps !== undefined) {
        payload.reps = Number(setConfig.reps);
      }

      if (setConfig.unit) {
        payload.weight_unit = setConfig.unit;
      }

      if (setConfig.weight !== undefined) {
        payload.weight = Number(setConfig.weight);
      }

      if (setConfig.routine_set_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(setConfig.routine_set_id)) {
        payload.routine_set_id = setConfig.routine_set_id;
      }

      if (setConfig.set_type) {
        payload.set_type = setConfig.set_type;
      }
      if (setConfig.timed_set_duration !== undefined) {
        payload.timed_set_duration = Number(setConfig.timed_set_duration);
      }

      // Add set_order if not present to ensure database consistency
      if (setConfig.set_order !== undefined) {
        payload.set_order = setConfig.set_order;
      }

      let data, error;
      if (setConfig.id && !setConfig.id.startsWith('temp-')) {
        const updateResult = await supabase
          .from('sets')
          .update({ ...payload, status: 'complete' })
          .eq('id', setConfig.id)
          .select()
          .single();
        data = updateResult.data;
        error = updateResult.error;
      } else {
        const insertResult = await supabase
          .from('sets')
          .insert(payload)
          .select()
          .single();
        data = insertResult.data;
        error = insertResult.error;
      }
      
      if (error) {
        console.error("Error saving set:", error);
        throw error;
      }

      // Refresh exercises to get updated data
      const updatedExercises = await fetchExercises();
      
      // Check if all sets in this exercise are now complete
      const currentExercise = updatedExercises.find(ex => ex.exercise_id === exerciseId);
      if (currentExercise) {
        const allSetsComplete = currentExercise.setConfigs.every(set => set.status === 'complete');
        if (allSetsComplete) {
          // console.log(`[${section}] All sets complete for exercise ${exerciseId}, auto-focusing next exercise`);
          
          // Find the next incomplete exercise in this section
          const currentIndex = updatedExercises.findIndex(ex => ex.exercise_id === exerciseId);
          
          // Look for next incomplete exercise after current position
          for (let i = currentIndex + 1; i < updatedExercises.length; i++) {
            const ex = updatedExercises[i];
            if (!globalCompletedExercises.has(ex.exercise_id)) {
              // console.log(`[${section}] Auto-focusing next exercise: ${ex.name} (${ex.exercise_id})`);
              changeFocus(ex.exercise_id);
              return;
            }
          }
          
          // If no next exercise found, look for previous incomplete exercise
          for (let i = currentIndex - 1; i >= 0; i--) {
            const ex = updatedExercises[i];
            if (!globalCompletedExercises.has(ex.exercise_id)) {
              // console.log(`[${section}] Auto-focusing previous exercise: ${ex.name} (${ex.exercise_id})`);
              changeFocus(ex.exercise_id);
              return;
            }
          }
          
          // If no incomplete exercises found in this section, trigger section complete
          // console.log(`[${section}] All exercises in section complete, triggering section complete`);
          onSectionComplete?.(section);
        }
      }
    } catch (error) {
      console.error("Failed to save set:", error);
      toast.error(`Failed to save set. Please try again.`);
    }
  }, [activeWorkout?.id, globalCompletedExercises, section, changeFocus, onSectionComplete, fetchExercises, markSetManuallyCompleted]);

  // Handle set data changes (inline editing)
  const handleSetDataChange = async (
    exerciseId,
    setIdOrUpdates,
    field,
    value
  ) => {
    toast.info("Set editing feature is under construction");
  };

  // Handle set reordering - called by ActiveExerciseCard
  const handleSetReorder = async (exerciseId, newSetOrder, fromIndex, toIndex) => {
    try {
      // console.log(`[ActiveWorkoutSection] Reordering sets for exercise ${exerciseId}: ${fromIndex} -> ${toIndex}`);
      
      // Update only the local exercises state to reflect the reorder
      // We don't update the global context for reordering to avoid infinite loops
      // The global context is mainly used for completion tracking and navigation
      setExercises(prevExercises => 
        prevExercises.map(ex => 
          ex.exercise_id === exerciseId 
            ? { ...ex, setConfigs: newSetOrder }
            : ex
        )
      );

      // For now, we'll just update the local state
      // In the future, this could be extended to persist the reorder to the database
      // by updating the set_order field in the sets table
      
      // console.log(`[ActiveWorkoutSection] Set reorder completed for exercise ${exerciseId}`);
    } catch (error) {
      console.error(`[ActiveWorkoutSection] Failed to handle set reorder for exercise ${exerciseId}:`, error);
      toast.error("Failed to reorder sets. Please try again.");
      throw error; // Re-throw to trigger optimistic update rollback in the card
    }
  };

  // Handle exercise completion
  const handleExerciseComplete = useCallback((exerciseId) => {
    // console.log(`[${section}] Exercise completed:`, exerciseId);
    
    // Mark as completed in global context
    markExerciseComplete(exerciseId);
    
    // Store the last completed exercise for this section
    setLastCompletedExerciseId(exerciseId);
    
    // Check if all exercises in this section are complete
    const allExercisesInSection = exercises.filter(
      (ex) => !globalCompletedExercises.has(ex.exercise_id)
    );
    
    if (allExercisesInSection.length === 0) {
      // All exercises in this section are complete
      // console.log(`[${section}] All exercises complete, triggering section complete`);
      onSectionComplete?.(section);
    } else if (lastCompletedExerciseId) {
      // Find the next incomplete exercise after the last completed one
      const lastCompletedIndex = exercises.findIndex(
        (ex) => ex.exercise_id === lastCompletedExerciseId
      );
      
      // Look for next incomplete exercise
      for (let i = lastCompletedIndex + 1; i < exercises.length; i++) {
        const ex = exercises[i];
        if (!globalCompletedExercises.has(ex.exercise_id)) {
          changeFocus(ex.exercise_id);
          return;
        }
      }
      
      // If no next exercise found, look for previous incomplete exercise
      for (let i = lastCompletedIndex - 1; i >= 0; i--) {
        const ex = exercises[i];
        if (!globalCompletedExercises.has(ex.exercise_id)) {
          changeFocus(ex.exercise_id);
          return;
        }
      }
      
      // Clear the last completed exercise ID
      setLastCompletedExerciseId(null);
    }
  }, [globalCompletedExercises, exercises, lastCompletedExerciseId, section, onSectionComplete, changeFocus, markExerciseComplete]);

  // Handle set press (open edit modal)
  const handleSetPress = (exerciseId, setConfig, index) => {
    setEditingSet({ exerciseId, setConfig, index });
    setEditSheetOpen(true);
    const initialValues = {
      ...setConfig,
      unit: setConfig.weight_unit || setConfig.unit || "lbs",
      set_type: setConfig.set_type || "reps",
      timed_set_duration: setConfig.timed_set_duration || 30,
    };
    setCurrentFormValues(initialValues);
  };

  // Handle exercise edit
  const handleEditExercise = (exercise) => {
    setEditingExercise({
      id: exercise.id,
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      section: exercise.section,
      setConfigs: exercise.setConfigs,
    });
  };

  // Simplified handle focus function
  const handleFocus = (exerciseId) => {
    // Safety check: Never focus on a completed exercise
    if (globalCompletedExercises.has(exerciseId)) {
      // console.log(`[${section}] Attempted to focus on completed exercise via handleFocus:`, exerciseId);
      return;
    }
    
    changeFocus(exerciseId);
  };

  // Handle adding new exercise to section
  const handleAddExercise = () => {
    setShowAddExercise(true);
  };

  // Helper to determine next exercise_order value (1-based)
  const getNextOrder = useCallback(async (table, fkField, fkValue) => {
    const { data: row, error } = await supabase
      .from(table)
      .select("exercise_order")
      .eq(fkField, fkValue)
      .order("exercise_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("[getNextOrder] error querying", table, error);
      throw error;
    }
    return (row?.exercise_order ?? 0) + 1;
  }, []);

  // Handle adding exercise (today only)
  const handleAddExerciseToday = async (data) => {
    try {
      const { name: exerciseName, section: exerciseSection, setConfigs } = data;

      // Find or create exercise
      let exerciseId;
      const { data: existingExercise, error: searchError } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseName)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingExercise) {
        exerciseId = existingExercise.id;
      } else {
        const { data: newExercise, error: createError } = await supabase
          .from("exercises")
          .insert({ name: exerciseName })
          .select("id")
          .single();

        if (createError) throw createError;
        exerciseId = newExercise.id;
      }

      const nextOrder = await getNextOrder(
        "workout_exercises",
        "workout_id",
        activeWorkout.id
      );

      const { data: workoutExercise, error: workoutExerciseError } =
        await supabase
          .from("workout_exercises")
          .insert({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            exercise_order: nextOrder,
            snapshot_name: exerciseName.trim(),
            section_override: section, // Force this exercise into the section
          })
          .select("id")
          .single();

      if (workoutExerciseError) throw workoutExerciseError;

      // Create sets: use form setConfigs if provided, otherwise default to 3 sets
      let setRows;
      if (setConfigs && setConfigs.length > 0) {
        // Use the form-provided setConfigs
        setRows = setConfigs.map((cfg, idx) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          set_order: idx + 1, // Add proper set_order for database consistency
          reps: Number(cfg.reps) || 10,
          weight: Number(cfg.weight) || 25,
          weight_unit: cfg.unit || "lbs",
          set_variant: cfg.set_variant || `Set ${idx + 1}`,
          set_type: cfg.set_type || "reps",
          timed_set_duration: cfg.timed_set_duration || 30,
          status: "default",
        }));
      } else {
        // Default to 3 sets
        setRows = Array.from({ length: 3 }, (_, idx) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          set_order: idx + 1, // Add proper set_order for database consistency
          reps: 10,
          weight: 25,
          weight_unit: "lbs",
          set_variant: `Set ${idx + 1}`,
          set_type: "reps",
          timed_set_duration: 30,
          status: "default",
        }));
      }

      const { error: setError } = await supabase.from("sets").insert(setRows);

      if (setError) {
        console.error("Failed to create sets:", setError);
        // Don't throw here - the exercise was created successfully
        // Just log the error and continue
      }

      toast.success(`Added ${exerciseName} to ${section}`);
      setShowAddExercise(false);

      // Refresh exercises to get updated data
      await fetchExercises();

      // Focus on the newly added exercise with a small delay to ensure UI is updated
      setTimeout(() => {
        changeFocus(exerciseId);
      }, 100);
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise. Please try again.");
    }
  };

  // Handle adding exercise to routine (future workouts)
  const handleAddExerciseFuture = async (data) => {
    try {
      const { name: exerciseName, section: exerciseSection, setConfigs } = data;

      // Find or create exercise
      let exerciseId;
      const { data: existingExercise, error: searchError } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseName)
        .maybeSingle();

      if (searchError) throw searchError;

      if (existingExercise) {
        exerciseId = existingExercise.id;
        // Update the section if it changed
        if (existingExercise.section !== exerciseSection) {
          await supabase
            .from("exercises")
            .update({ section: exerciseSection })
            .eq("id", exerciseId);
        }
      } else {
        const { data: newExercise, error: createError } = await supabase
          .from("exercises")
          .insert({ 
            name: exerciseName,
            section: exerciseSection 
          })
          .select("id")
          .single();

        if (createError) throw createError;
        exerciseId = newExercise.id;
      }

      // Get the next order for routine_exercises
      const nextRoutineOrder = await getNextOrder(
        "routine_exercises",
        "routine_id",
        activeWorkout.programId
      );

      // Add to routine_exercises
      const { data: routineExercise, error: routineExerciseError } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: activeWorkout.programId,
          exercise_id: exerciseId,
          exercise_order: nextRoutineOrder,
        })
        .select("id")
        .single();

      if (routineExerciseError) throw routineExerciseError;

      // Add to routine_sets
      if (setConfigs && setConfigs.length > 0) {
        const routineSetRows = setConfigs.map((cfg, idx) => ({
          routine_exercise_id: routineExercise.id,
          set_order: idx + 1,
          reps: Number(cfg.reps) || 10,
          weight: Number(cfg.weight) || 25,
          weight_unit: cfg.unit || "lbs",
          set_variant: cfg.set_variant || `Set ${idx + 1}`,
          set_type: cfg.set_type || "reps",
          timed_set_duration: cfg.timed_set_duration || 30,
        }));

        const { error: routineSetError } = await supabase
          .from("routine_sets")
          .insert(routineSetRows);

        if (routineSetError) {
          console.error("Failed to add sets to routine template:", routineSetError);
          toast.error("Failed to add sets to routine template. Exercise added to today's workout only.");
        } else {
          toast.success("Exercise added to routine template");
        }
      }

      // Add to current workout (but don't call handleAddExerciseToday to avoid duplication)
      const nextWorkoutOrder = await getNextOrder(
        "workout_exercises",
        "workout_id",
        activeWorkout.id
      );

      const { data: workoutExercise, error: workoutExerciseError } =
        await supabase
          .from("workout_exercises")
          .insert({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            exercise_order: nextWorkoutOrder,
            snapshot_name: exerciseName.trim(),
            section_override: exerciseSection, // Use the form section, not current section
          })
          .select("id")
          .single();

      if (workoutExerciseError) throw workoutExerciseError;

      // Don't create sets for current workout - they will be created from the routine template
      // when fetchExercises runs and merges the template sets

      toast.success(`Added ${exerciseName} to ${exerciseSection}`);
      setShowAddExercise(false);

      // Refresh exercises to get updated data
      await fetchExercises();

      // Focus on the newly added exercise
      changeFocus(exerciseId);
    } catch (error) {
      console.error("Error adding exercise to routine:", error);
      toast.error("Failed to add exercise to routine. Please try again.");
    }
  };

  // Handle saving exercise edits
  const handleSaveExerciseEdit = async (data, type = "today") => {
    // console.log('[DEBUG] handleSaveExerciseEdit called with:', { data, type, editingExercise });
    if (!editingExercise) {
      // console.log('[DEBUG] No editingExercise, returning');
      return;
    }

    try {
      const { id: workoutExerciseId, exercise_id } = editingExercise;
      const newName = data.name?.trim();
      const newSection = data.section;
      const newSetConfigs = data.setConfigs || [];

      // console.log('[DEBUG] Processing exercise edit:', { 
      //   workoutExerciseId, 
      //   exercise_id, 
      //   newName, 
      //   newSection, 
      //   newSetConfigs 
      // });

      if (!newName) {
        toast.error("Exercise name cannot be empty");
        return;
      }

      // Update the workout_exercises table
      const updatePayload = {
        name_override: newName,
        section_override: newSection,
      };

      const { error } = await supabase
        .from("workout_exercises")
        .update(updatePayload)
        .eq("id", workoutExerciseId);

      if (error) throw error;

      // If type is "future", also update the routine template
      if (type === "future") {
        // Update the exercise name and section in the exercises table
        const { error: exerciseUpdateError } = await supabase
          .from("exercises")
          .update({ 
            name: newName,
            section: newSection 
          })
          .eq("id", exercise_id);

        if (exerciseUpdateError) {
          console.error("Failed to update exercise in routine template:", exerciseUpdateError);
          toast.error("Failed to update exercise in routine template. Changes saved for today only.");
        }

        // Find the routine_exercise_id for this exercise
        const { data: routineExercise } = await supabase
          .from("routine_exercises")
          .select("id")
          .eq("routine_id", activeWorkout.programId)
          .eq("exercise_id", exercise_id)
          .single();

        if (routineExercise) {
          // Delete existing routine_sets for this exercise
          await supabase
            .from("routine_sets")
            .delete()
            .eq("routine_exercise_id", routineExercise.id);

          // Insert new routine_sets
          const routineSetRows = newSetConfigs.map((cfg, idx) => ({
            routine_exercise_id: routineExercise.id,
            set_order: idx + 1,
            reps: Number(cfg.reps),
            weight: Number(cfg.weight),
            weight_unit: cfg.weight_unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
          }));

          if (routineSetRows.length > 0) {
            const { error: routineSetError } = await supabase
              .from("routine_sets")
              .insert(routineSetRows);
            
            if (routineSetError) {
              console.error("Failed to update routine template:", routineSetError);
              toast.error("Failed to update routine template. Changes saved for today only.");
            } else {
              toast.success("Exercise updated in routine template");
            }
          }
        }
      }

      // Handle set changes for current workout
      const currentSets = editingExercise.setConfigs || [];
      const newSets = newSetConfigs || [];

      // Find sets to add (new sets without IDs)
      const setsToAdd = newSets.filter((newSet) => {
        if (newSet.id) return false; // Already saved

        // If this set already exists in currentSets (matched by routine_set_id or key fields), skip
        const existsInCurrent = currentSets.some((cs) => {
          if (cs.id) return false;

          // Match by routine_set_id if present on both
          if (newSet.routine_set_id && cs.routine_set_id) {
            return newSet.routine_set_id === cs.routine_set_id;
          }

          // Otherwise compare the core fields
          return (
            newSet.reps === cs.reps &&
            newSet.weight === cs.weight &&
            newSet.weight_unit === cs.weight_unit &&
            newSet.set_variant === cs.set_variant &&
            newSet.set_type === cs.set_type &&
            newSet.timed_set_duration === cs.timed_set_duration
          );
        });

        return !existsInCurrent;
      });
      
      // Find sets to remove (current sets not in new sets)
      const setsToRemove = currentSets.filter(currentSet => 
        !newSets.some(newSet => newSet.id === currentSet.id)
      );

      // Find sets to update (sets with IDs that have changes)
      const setsToUpdate = newSets.filter(newSet => {
        if (!newSet.id) return false; // Skip new sets
        const currentSet = currentSets.find(cs => cs.id === newSet.id);
        if (!currentSet) return false;
        
        // Check if any field changed
        return (
          newSet.reps !== currentSet.reps ||
          newSet.weight !== currentSet.weight ||
          newSet.weight_unit !== currentSet.weight_unit ||
          newSet.set_variant !== currentSet.set_variant ||
          newSet.set_type !== currentSet.set_type ||
          newSet.timed_set_duration !== currentSet.timed_set_duration
        );
      });

      // Remove sets
      for (const set of setsToRemove) {
        if (set.id) {
          await supabase
            .from("sets")
            .delete()
            .eq("id", set.id);
        }
      }

      // Add new sets
      for (const set of setsToAdd) {
        await supabase
          .from("sets")
          .insert({
            workout_id: activeWorkout.id,
            exercise_id: exercise_id,
            set_order: set.set_order || 1, // Add proper set_order for database consistency
            reps: set.reps,
            weight: set.weight,
            weight_unit: set.weight_unit,
            set_variant: set.set_variant,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
            status: "default",
          });
      }

      // Update existing sets
      for (const set of setsToUpdate) {
        await supabase
          .from("sets")
          .update({
            reps: set.reps,
            weight: set.weight,
            weight_unit: set.weight_unit,
            set_variant: set.set_variant,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
          })
          .eq("id", set.id);
      }

      toast.success("Exercise updated successfully");
      setEditingExercise(null);

      // Refresh exercises to get updated data
      // console.log('[DEBUG] About to refresh exercises after save');
      await fetchExercises();
      // console.log('[DEBUG] Finished refreshing exercises after save');
    } catch (error) {
      console.error("Failed to update exercise:", error);
      toast.error("Failed to update exercise. Please try again.");
    }
  };

  // Handle set edit form save
  const handleSetEditFormSave = async (values) => {
    if (!editingSet) return;

    try {
      const { exerciseId, setConfig } = editingSet;

      const setData = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        ...(setConfig.routine_set_id
          ? { routine_set_id: setConfig.routine_set_id }
          : {}),
        reps: values.reps || 0,
        weight: values.weight || 0,
        weight_unit: values.unit || "lbs",
        set_type: values.set_type || "reps",
        set_variant: values.set_variant || "",
        timed_set_duration: values.timed_set_duration || 30,
        status: setConfig.status || "default",
      };

      // If setUpdateType is "future" and we have a routine_set_id, update the routine template
      if (setUpdateType === "future" && setConfig.routine_set_id) {
        const routineSetData = {
          reps: values.reps || 0,
          weight: values.weight || 0,
          weight_unit: values.unit || "lbs",
          set_type: values.set_type || "reps",
          set_variant: values.set_variant || "",
          timed_set_duration: values.timed_set_duration || 30,
        };

        const { error: routineSetError } = await supabase
          .from("routine_sets")
          .update(routineSetData)
          .eq("id", setConfig.routine_set_id);

        if (routineSetError) {
          console.error("Failed to update routine template:", routineSetError);
          toast.error("Failed to update routine template. Changes saved for today only.");
        } else {
          toast.success("Set updated in routine template");
        }
      }

      if (setConfig.id) {
        const { error } = await supabase
          .from("sets")
          .update(setData)
          .eq("id", setConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("sets")
          .insert(setData)
          .select("id")
          .single();
        if (error) throw error;
      }

      toast.success("Set updated successfully");
      setEditSheetOpen(false);
      setEditingSet(null);
      setCurrentFormValues({});
      setFormDirty(false);

      // Refresh exercises to get updated data
      await fetchExercises();
    } catch (error) {
      console.error("Failed to save set:", error);
      toast.error("Failed to save set. Please try again.");
    }
  };

  // Handle set edit form close
  const handleSetEditFormClose = () => {
    setEditSheetOpen(false);
    setEditingSet(null);
    setCurrentFormValues({});
    setFormDirty(false);
  };

  // Handle set delete
  const handleSetDelete = async () => {
    // Check if this is a saved set (has an id) or a template set (has routine_set_id)
    const isSavedSet = editingSet?.setConfig?.id;
    const isTemplateSet = editingSet?.setConfig?.routine_set_id;
    
    if (!isSavedSet && !isTemplateSet) {
      toast.error("Cannot delete unsaved set");
      setEditSheetOpen(false);
      return;
    }

    try {
      // If setUpdateType is "future" and we have a routine_set_id, delete from routine template
      if (setUpdateType === "future" && isTemplateSet) {
        const { error: routineSetError } = await supabase
          .from("routine_sets")
          .delete()
          .eq("id", editingSet.setConfig.routine_set_id);

        if (routineSetError) {
          console.error("Failed to delete from routine template:", routineSetError);
          toast.error("Failed to delete from routine template. Set deleted from today's workout only.");
        } else {
          toast.success("Set deleted from routine template");
        }
      }

      // For template sets in "today" mode, create a hidden set to override the template
      if (setUpdateType === "today" && isTemplateSet) {
        const hiddenSetData = {
          workout_id: activeWorkout.id,
          exercise_id: editingSet.exerciseId,
          routine_set_id: editingSet.setConfig.routine_set_id,
          reps: editingSet.setConfig.reps,
          weight: editingSet.setConfig.weight,
          weight_unit: editingSet.setConfig.unit,
          set_type: editingSet.setConfig.set_type,
          set_variant: editingSet.setConfig.set_variant,
          timed_set_duration: editingSet.setConfig.timed_set_duration,
          status: "hidden", // Mark as hidden to exclude from display
        };

        console.log("Creating hidden set for exercise ID:", editingSet.exerciseId);
        console.log("Hidden set data:", hiddenSetData);
        const { error } = await supabase
          .from("sets")
          .insert(hiddenSetData);

        if (error) {
          console.error("Error creating hidden set:", error);
          throw error;
        }
      }

      // Delete from sets table if it's a saved set
      if (isSavedSet) {
        const { error } = await supabase
          .from("sets")
          .delete()
          .eq("id", editingSet.setConfig.id);

        if (error) throw error;
      }

      toast.success("Set deleted successfully");
      setEditSheetOpen(false);
      setEditingSet(null);

      // Refresh exercises to get updated data
      await fetchExercises();
    } catch (error) {
      console.error("Failed to delete set:", error);
      toast.error("Failed to delete set. Please try again.");
    }
  };

  // Handle adding a new set to an exercise
  const handleAddSetToExercise = async (exerciseId) => {
    try {
      setAddingSetToExercise(exerciseId);
      
      // Find the exercise to get its current sets
      const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
      if (!exercise) return;

      // Create a new set with default values
      const newSetNumber = exercise.setConfigs.length + 1;
      const newSet = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        set_order: newSetNumber, // Add proper set_order for database consistency
        reps: 10,
        weight: 25,
        weight_unit: "lbs",
        set_variant: `Set ${newSetNumber}`,
        set_type: "reps",
        timed_set_duration: 30,
        status: "default",
      };

      // Insert the new set into the database
      const { data: insertedSet, error } = await supabase
        .from("sets")
        .insert(newSet)
        .select()
        .single();

      if (error) {
        console.error("Error adding set:", error);
        toast.error("Failed to add set");
        return;
      }

      toast.success("Set added successfully");
      
      // Refresh exercises to get updated data
      await fetchExercises();
    } catch (error) {
      console.error("Error adding set:", error);
      toast.error("Failed to add set");
    } finally {
      setAddingSetToExercise(null);
    }
  };

  // Handle removing the last set from an exercise
  const handleRemoveSetFromExercise = async (exerciseId) => {
    try {
      setRemovingSetFromExercise(exerciseId);
      
      // Find the exercise to get its current sets
      const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
      if (!exercise || exercise.setConfigs.length === 0) return;

      // Get the last set (highest set number)
      const lastSet = exercise.setConfigs[exercise.setConfigs.length - 1];
      
      if (!lastSet.id) {
        // If it's a template set without a database ID, just refresh
        await fetchExercises();
        return;
      }

      // Delete the set from the database
      const { error } = await supabase
        .from("sets")
        .delete()
        .eq("id", lastSet.id);

      if (error) {
        console.error("Error removing set:", error);
        toast.error("Failed to remove set");
        return;
      }

      toast.success("Set removed successfully");
      
      // Refresh exercises to get updated data
      await fetchExercises();
    } catch (error) {
      console.error("Error removing set:", error);
      toast.error("Failed to remove set");
    } finally {
      setRemovingSetFromExercise(null);
    }
  };

  if (firstLoad && loading) {
    return (
      <PageSectionWrapper
        key={section}
        section={section}
        showPlusButton={false}
        isFirst={section === "warmup"}
        className={`${section === "warmup" ? "border-t-0" : ""} ${isLastSection ? "flex-1" : ""}`}
        deckGap={12}
        backgroundClass="bg-transparent"
        style={{ paddingBottom: 0, paddingTop: 40, maxWidth: '500px', minWidth: '0px', paddingLeft: 40, paddingRight: 40 }}
      >
        <div className="text-center py-8 text-gray-500">
          Loading {section} exercises...
        </div>
      </PageSectionWrapper>
    );
  }

  if (!exercises || exercises.length === 0) {
    return (
      <>
        <PageSectionWrapper
          key={section}
          section={section}
          showPlusButton={true}
          onPlus={handleAddExercise}
          isFirst={section === "warmup"}
          className={`${section === "warmup" ? "border-t-0" : ""} ${isLastSection ? "flex-1" : ""}`}
          deckGap={12}
          backgroundClass="bg-transparent"
          style={{ paddingBottom: 0, paddingTop: 40, maxWidth: '500px', minWidth: '0px', paddingLeft: 40, paddingRight: 40 }}
        >
          {/* Removed inline add exercise card; use header button instead */}
        </PageSectionWrapper>

        {/* Add Exercise Form */}
        <SwiperForm
          open={showAddExercise}
          onOpenChange={setShowAddExercise}
          title={`Add ${
            section.charAt(0).toUpperCase() + section.slice(1)
          } Exercise`}
          leftAction={() => setShowAddExercise(false)}
          rightAction={() => addExerciseFormRef.current?.requestSubmit?.()}
          rightEnabled={canAddExercise}
          rightText="Add"
          leftText="Cancel"
          padding={0}
          className="add-exercise-drawer"
        >
          <div className="flex-1 overflow-y-auto">
            <AddNewExerciseForm
              ref={addExerciseFormRef}
              key={`add-exercise-${section}`}
              formPrompt={`Add a new ${section} exercise`}
              disabled={false}
              onActionIconClick={(data, type) => {
                if (type === "future") handleAddExerciseFuture(data);
                else handleAddExerciseToday(data);
              }}
              initialSets={3}
              initialSection={section}
              initialSetConfigs={Array.from({ length: 3 }, () => ({
                reps: 10,
                weight: 25,
                unit: "lbs",
              }))}
              hideActionButtons={true}
              onDirtyChange={setCanAddExercise}
            />
          </div>
        </SwiperForm>
      </>
    );
  }

  return (
    <>
      <PageSectionWrapper
        key={section}
        section={section}
        showPlusButton={true}
        onPlus={handleAddExercise}
        isFirst={section === "warmup"}
        className={`${section === "warmup" ? "border-t-0" : ""} ${isLastSection ? "flex-1" : ""}`}
        deckGap={12}
        backgroundClass="bg-transparent"
        paddingX={0}
        style={{ paddingBottom: 0, paddingTop: 40, maxWidth: '500px', minWidth: '0px' }}
      >
        {exercises.map((ex, index) => {
          const isFocused = isExerciseFocused(ex.exercise_id);
          const isExpanded = isFocused || focusedExercise?.exercise_id === ex.exercise_id;
          
          // Simplified stacking calculation
          const STACKING_OFFSET_PX = 64;
          let topOffset = 80 + index * STACKING_OFFSET_PX;

          // If focused, adjust offset for expanded card
          if (isFocused) {
            const collapsedHeight = 80;
            const expandedHeight = 300; // Approximate expanded height
            const extraHeight = expandedHeight - collapsedHeight;
            
            // Adjust offsets for cards after the focused one
            for (let i = index + 1; i < exercises.length; i++) {
              topOffset += extraHeight;
            }
          }

          return (
            <CardWrapper key={ex.id}>
              <ActiveExerciseCard
                // ref={isFocused ? focusRef : null} // This line is removed
                exerciseId={ex.exercise_id}
                exerciseName={ex.name}
                initialSetConfigs={ex.setConfigs}
                onSetComplete={handleSetComplete}
                onSetDataChange={handleSetDataChange}
                onExerciseComplete={() => handleExerciseComplete(ex.exercise_id)}
                onSetPress={(setConfig, index) =>
                  handleSetPress(ex.exercise_id, setConfig, index)
                }
                isUnscheduled={!!activeWorkout?.is_unscheduled}
                onSetProgrammaticUpdate={handleSetDataChange}
                onSetReorder={handleSetReorder}
                isFocused={isFocused}
                isExpanded={isExpanded}
                onFocus={() => {
                  if (!isFocused) handleFocus(ex.exercise_id);
                }}
                onEditExercise={() => handleEditExercise(ex)}
                index={index}
                focusedIndex={exercises.findIndex(e => e.exercise_id === focusedExercise?.exercise_id)}
                totalCards={exercises.length}
                topOffset={topOffset}
              />
            </CardWrapper>
          );
        })}
        {/* Removed inline add exercise card; use header button instead */}
      </PageSectionWrapper>

      {/* Add Exercise Form */}
      <SwiperForm
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        title="Create"
        leftAction={() => setShowAddExercise(false)}
        rightAction={() => addExerciseFormRef.current?.requestSubmit?.()}
        rightEnabled={canAddExercise}
        rightText="Add"
        leftText="Cancel"
        padding={0}
        className="add-exercise-drawer"
      >
        <div className="flex-1 overflow-y-auto">
          <AddNewExerciseForm
            ref={addExerciseFormRef}
            key={`add-exercise-${section}`}
            formPrompt={`Add a new ${section} exercise`}
            disabled={false}
            onActionIconClick={(data, type) => {
              if (type === "future") handleAddExerciseFuture(data);
              else handleAddExerciseToday(data);
            }}
            initialSets={3}
            initialSection={section}
            initialSetConfigs={Array.from({ length: 3 }, () => ({
              reps: 10,
              weight: 25,
              unit: "lbs",
            }))}
            hideActionButtons={true}
            onDirtyChange={setCanAddExercise}
          />
        </div>
      </SwiperForm>

      {/* Exercise Edit Form */}
      {editingExercise && (
        <SwiperForm
          open={!!editingExercise}
          onOpenChange={() => setEditingExercise(null)}
          title="Edit exercise"
          description="Edit exercise details including name, section, and sets"
          leftAction={() => setEditingExercise(null)}
          leftText="Close"
          rightAction={() => {
            // console.log('[DEBUG] Save button clicked, using ref');
            if (editExerciseFormRef.current) {
              // console.log('[DEBUG] Calling requestSubmit on form ref');
              editExerciseFormRef.current.requestSubmit();
            } else {
              // console.log('[DEBUG] Form ref not found!');
            }
          }}
          rightText="Save"
          rightEnabled={editingExerciseDirty}
          padding={0}
          className="edit-exercise-drawer"
        >
          <div className="flex-1 overflow-y-auto">
            <AddNewExerciseForm
              ref={editExerciseFormRef}
              key={`edit-${editingExercise.id}`}
              formPrompt={`Edit ${section} exercise`}
              initialName={editingExercise.name}
              initialSection={
                editingExercise.section === "workout"
                  ? "training"
                  : editingExercise.section
              }
              initialSets={editingExercise.setConfigs?.length || 0}
              initialSetConfigs={editingExercise.setConfigs}
              hideActionButtons={true}
              showAddToProgramToggle={false}
              hideSetDefaults={true}
              onActionIconClick={(data) =>
                handleSaveExerciseEdit(data, exerciseUpdateType)
              }
              onDirtyChange={setEditingExerciseDirty}
              showUpdateTypeToggle={true}
              updateType={exerciseUpdateType}
              onUpdateTypeChange={setExerciseUpdateType}
            />
          </div>
        </SwiperForm>
      )}

      {/* Set Edit Form */}
      <SwiperForm
        open={isEditSheetOpen}
        onOpenChange={setEditSheetOpen}
        title="Edit"
        description="Edit set configuration including type, reps, weight, and unit"
        leftAction={handleSetEditFormClose}
        rightAction={() => handleSetEditFormSave(currentFormValues)}
        rightEnabled={formDirty}
        leftText="Cancel"
        rightText="Save"
        padding={0}
      >
        <div className="flex-1 overflow-y-auto">
          <SetEditForm
            key={`edit-set-${
              editingSet?.setConfig?.routine_set_id || editingSet?.setConfig?.id
            }`}
            initialValues={setEditFormInitialValues}
            onValuesChange={setCurrentFormValues}
            onDirtyChange={setFormDirty}
            showSetNameField={true}
            hideActionButtons={true}
            hideInternalHeader={true}
            isChildForm={true}
            isUnscheduled={!!editingSet?.setConfig?.routine_set_id}
            hideToggle={false}
            addType={setUpdateType}
            onAddTypeChange={setSetUpdateType}
            onDelete={handleSetDelete}
          />
        </div>
      </SwiperForm>
    </>
  );
};

export default ActiveWorkoutSection; 