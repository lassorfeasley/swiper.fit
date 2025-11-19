import ActiveExerciseCard from "../components/ActiveExerciseCard";
import PageSectionWrapper from "@/components/shared/cards/wrappers/PageSectionWrapper";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import { useAccount } from "@/contexts/AccountContext";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "@/lib/toastReplacement";
import SwiperForm from "@/components/shared/SwiperForm";
import { AddNewExerciseForm } from "@/features/routines";
import { SetEditForm } from "@/features/routines";
import { supabase } from "@/supabaseClient";
import { fetchWorkoutExercises } from "@/features/workout/api/workoutExercises";
import { fetchRoutineTemplateSets, fetchSavedSets } from "@/features/workout/api/sets";
import { useRealtimeSets } from "@/features/workout/hooks/useRealtimeSets";
import { useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";
import { MAX_SET_NAME_LEN, MAX_ROUTINE_NAME_LEN, MAX_WORKOUT_NAME_LEN } from "@/lib/constants";
import { ActionCard } from "@/components/shared/ActionCard";
import { Button } from "@/components/shadcn/button";
import { Plus } from "lucide-react";
import SwiperDialog from "@/components/shared/SwiperDialog";

const ActiveWorkoutSection = ({
  section,
  onSectionComplete,
  onUpdateLastExercise,
  isLastSection = false,
}) => {
  const { activeWorkout, markSetManuallyCompleted, markSetToasted, isSetToasted, isPaused } = useActiveWorkout();
  const { isDelegated, currentUser } = useAccount();
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
  const [confirmDeleteExerciseOpen, setConfirmDeleteExerciseOpen] = useState(false);
  const [confirmUndoSetOpen, setConfirmUndoSetOpen] = useState(false);
  const undoTargetRef = useRef(null);

  // Form refs
  const addExerciseFormRef = useRef(null);
  const editExerciseFormRef = useRef(null);

  // Fetch exercises for this section (via feature services)
  const fetchExercises = useCallback(async () => {
    if (!activeWorkout?.id) return;

    if (firstLoad) setLoading(true);

    try {
      // Fetch core data via services
      const workoutExercises = await fetchWorkoutExercises(activeWorkout.id);

      // Filter by section_override if present, otherwise by exercises.section
      const filteredExercises = (workoutExercises || []).filter(we => {
        const sec = we.section_override || we.exercises?.section;
        if (section === "training") return sec === "training" || sec === "workout";
        return sec === section;
      });

      // Fetch template sets for routine
      const templateSets = await fetchRoutineTemplateSets(activeWorkout.routine_id);

      // Fetch saved sets for this workout
      const savedSets = await fetchSavedSets(activeWorkout.id);

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
          weight_unit: rs.weight_unit,
          set_order: rs.set_order,
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
        const templateConfigs = templateSetsMap[we.exercise_id] || [];
        const savedSetsForExercise = savedSetsMap[we.exercise_id] || [];

        // Merge template sets with saved sets
        const mergedSetConfigs = [];

        // Start with template sets in their original order
        // If no template configs exist AND no saved sets exist, create a default set
        if (templateConfigs.length === 0 && savedSetsForExercise.length === 0) {
          mergedSetConfigs.push({
            id: null,
            routine_set_id: null,
            reps: 10,
            weight: 0,
            unit: "lbs",
            weight_unit: "lbs",
            set_variant: "Set 1",
            set_type: "reps",
            timed_set_duration: null,
            status: "default",
            set_order: 1,
          });
        } else if (templateConfigs.length === 0 && savedSetsForExercise.length > 0) {
          console.log(`No template configs but ${savedSetsForExercise.length} saved sets exist for exercise ${we.exercise_id}, skipping default set creation`);
        }
        
        // Process template configs if they exist
        if (templateConfigs.length > 0) {
          templateConfigs.forEach((template, templateIndex) => {
          const savedSet = savedSetsForExercise.find(
            (saved) => saved.routine_set_id === template.routine_set_id
          );

          // Skip this template set if there's a hidden saved set for it
          if (savedSet && savedSet.status === "hidden") {
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
        }

        // Since saved sets have null routine_set_ids, we need to handle them differently
        // Include all saved sets, but handle null routine_set_ids differently
        const validSavedSets = savedSetsForExercise.filter(saved => {
          // Include sets with routine_set_ids (template-based)
          if (saved.routine_set_id !== null) return true;
          // Include sets without routine_set_ids (custom/added sets) but only if they're not duplicates
          // We'll handle deduplication differently for these
          return true;
        });
        
        // Deduplicate valid saved sets by routine_set_id (keep the first occurrence)
        // For sets without routine_set_id, deduplicate by ID to avoid duplicates
        const deduplicatedSavedSets = [];
        const seenRoutineSetIds = new Set();
        const seenSetIds = new Set();
        
        validSavedSets.forEach((saved) => {
          if (saved.routine_set_id !== null) {
            // Handle template-based sets (with routine_set_id)
            if (!seenRoutineSetIds.has(saved.routine_set_id)) {
              seenRoutineSetIds.add(saved.routine_set_id);
              deduplicatedSavedSets.push(saved);
            }
          } else {
            // Handle custom sets (without routine_set_id) - deduplicate by ID
            if (!seenSetIds.has(saved.id)) {
              seenSetIds.add(saved.id);
              deduplicatedSavedSets.push(saved);
            }
          }
        });

        // Add orphaned saved sets at the end
        let orphanIndex = templateConfigs.length;
        deduplicatedSavedSets.forEach((saved) => {
          if (saved.status === "hidden") return; // never render hidden orphan sets

          if (saved.routine_set_id !== null) {
            // Handle template-based sets
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
          } else {
            // Handle custom sets (without routine_set_id)
            // Only add if there are NO template configs (i.e., this is a completely custom exercise)
            if (templateConfigs.length === 0) {
              mergedSetConfigs.push({
                id: saved.id,
                routine_set_id: saved.routine_set_id, // This will be null
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
            // If there ARE template configs, don't add custom sets as orphaned
            // because the template sets should be used instead
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

        const finalSetConfigs = mergedSetConfigs.filter(set => set != null);
        
        return {
          id: we.id,
          exercise_id: we.exercise_id,
          section: section,
          name: we.name_override || we.snapshot_name,
          setConfigs: finalSetConfigs,
        };
      });

      // Hide exercises that have no visible sets (safety against zero-set configs)
      const nonEmptyExercises = processedExercises.filter((ex) => (ex.setConfigs?.length || 0) > 0);
      

      setExercises(nonEmptyExercises);
      // Update global context with exercises for this section
      updateSectionExercises(section, nonEmptyExercises);
      setLoading(false);
      setFirstLoad(false);
      return nonEmptyExercises; // Return the processed exercises for the next step
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast.error("Failed to load exercises");
    } finally {
      // setLoading(false); // This line is removed as per the new_code
    }
  }, [activeWorkout?.id, activeWorkout?.routine_id, section, firstLoad]);

  // Fetch exercises when workout changes
  useEffect(() => {
    fetchExercises();
  }, [fetchExercises, markSetManuallyCompleted]);

  // Real-time subscriptions via hook
  useRealtimeSets({
    workoutId: activeWorkout?.id,
    section,
    getCurrentExerciseIds: () => exercises.map(ex => ex.exercise_id),
    fetchExercises,
    getUserId: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
    isDelegated,
    isSetToasted,
    markSetToasted,
  });

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
    if (isPaused) {
      toast.info('Resume your workout to complete sets');
      return;
    }
    try {
      // Get current user for account_id - always use the authenticated user's ID, not the acting user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save set to database
      const payload = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        set_variant: (setConfig.set_variant || '').slice(0, MAX_SET_NAME_LEN),
        status: 'complete',
        account_id: user?.id, // Always use the authenticated user's ID (manager's ID when delegating)
        reps: 0,
        weight: 0,
        weight_unit: 'lbs',
        routine_set_id: setConfig.routine_set_id || null,
        set_type: 'reps',
        timed_set_duration: 0,
        set_order: 0
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

      // Refresh exercises to get updated data for UI consistency.
      // Do not advance focus here; the card will call onExerciseComplete after
      // its animation finishes, which routes to handleExerciseComplete.
      await fetchExercises();
    } catch (error) {
      console.error("Failed to save set:", error);
      toast.error(`Failed to save set. Please try again.`);
    }
  }, [activeWorkout?.id, globalCompletedExercises, section, changeFocus, onSectionComplete, fetchExercises, markSetManuallyCompleted, isPaused]);

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
    // Mark as completed in global context
    markExerciseComplete(exerciseId);

    // Keep a local completed set that includes the just-completed exercise immediately
    const completedNow = new Set(globalCompletedExercises);
    completedNow.add(exerciseId);

    // Prefer next incomplete lower in the list; if none, go upward; if none, section is complete
    const currentIndex = exercises.findIndex((ex) => ex.exercise_id === exerciseId);
    if (currentIndex !== -1) {
      for (let i = currentIndex + 1; i < exercises.length; i++) {
        const ex = exercises[i];
        if (!completedNow.has(ex.exercise_id)) {
          changeFocus(ex.exercise_id);
          return;
        }
      }
      for (let i = currentIndex - 1; i >= 0; i--) {
        const ex = exercises[i];
        if (!completedNow.has(ex.exercise_id)) {
          changeFocus(ex.exercise_id);
          return;
        }
      }
    }

    // No incomplete exercises left in this section
    // Pass the just-completed exercise ID so handleSectionComplete can account for it
    // even if the state update hasn't propagated yet
    onSectionComplete?.(section, exerciseId);
  }, [globalCompletedExercises, exercises, section, onSectionComplete, changeFocus, markExerciseComplete]);

  // Handle set press (open edit modal)
  const handleSetPress = (exerciseId, setConfig, index) => {
    // Check if setConfig is valid
    if (!setConfig) {
      console.error('[ActiveWorkoutSection] handleSetPress called with null/undefined setConfig');
      return;
    }

    // If completed set is tapped, open undo dialog instead of editor
    if (setConfig?.status === 'complete') {
      undoTargetRef.current = { exerciseId, setConfig };
      setConfirmUndoSetOpen(true);
      return;
    }
    
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

  // Handle marking a set incomplete
  const handleSetMarkIncomplete = useCallback(async () => {
    try {
      const target = undoTargetRef.current;
      if (!target?.setConfig) {
        setConfirmUndoSetOpen(false);
        return;
      }
      const { setConfig } = target;
      if (!activeWorkout?.id) return;

      if (setConfig.id && !String(setConfig.id).startsWith('temp-')) {
        // Update existing set back to default
        const { error } = await supabase
          .from('sets')
          .update({ status: 'default', account_id: null })
          .eq('id', setConfig.id);
        if (error) throw error;
      } else if (setConfig.routine_set_id) {
        // If completion was created as a saved row (INSERT) for template set, delete that row to revert
        // Try to find a saved set row matching this routine_set_id
        const { data: rows, error: findErr } = await supabase
          .from('sets')
          .select('id')
          .eq('workout_id', activeWorkout.id)
          .eq('exercise_id', target.exerciseId)
          .eq('routine_set_id', setConfig.routine_set_id)
          .eq('status', 'complete')
          .limit(1);
        if (findErr) throw findErr;
        if (rows && rows.length > 0) {
          const { error: delErr } = await supabase
            .from('sets')
            .delete()
            .eq('id', rows[0].id);
          if (delErr) throw delErr;
        }
      }

      toast.success('Set marked incomplete');
      setConfirmUndoSetOpen(false);
      undoTargetRef.current = null;

      // Refresh UI
      await fetchExercises();
    } catch (error) {
      console.error('Failed to mark set incomplete:', error);
      toast.error('Failed to mark set incomplete');
      setConfirmUndoSetOpen(false);
    }
  }, [activeWorkout?.id, fetchExercises]);

  // Handle exercise edit
  const handleEditExercise = (exercise) => {
    console.log('[ActiveWorkoutSection] Opening edit form for exercise:', exercise);
    setEditingExercise({
      id: exercise.id,
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      section: exercise.section,
      setConfigs: exercise.setConfigs,
    });
    setEditingExerciseDirty(false); // Reset dirty state when opening
  };

  // Simplified handle focus function
  const handleFocus = (exerciseId) => {
    // Allow focusing any exercise, including completed ones
    changeFocus(exerciseId);
  };

  // Handle adding new exercise to section
  const handleAddExercise = () => {
    setShowAddExercise(true);
  };

  // Helper to determine next exercise_order value (1-based)
  const getNextOrder = useCallback(async (table: string, fkField: string, fkValue: string) => {
    try {
      const { data: rows, error } = await supabase
        .from(table)
        .select("exercise_order")
        .eq(fkField, fkValue)
        .order("exercise_order", { ascending: false })
        .limit(1);
      
      if (error) {
        console.error("[getNextOrder] error querying", table, error);
        throw error;
      }
      
      // Handle case where no rows exist or multiple rows returned
      const maxOrder = rows && rows.length > 0 ? rows[0].exercise_order : 0;
      return maxOrder + 1;
    } catch (err) {
      console.error("[getNextOrder] unexpected error:", err);
      // Fallback to order 1 if there's any issue
      return 1;
    }
  }, []);

  // Handle adding exercise (today only)
  const handleAddExerciseToday = async (data) => {
    try {
      const { name: exerciseName, section: exerciseSection, setConfigs } = data;

      // Find or create exercise
      let exerciseId;
      const { data: existingExercises, error: searchError } = await supabase
        .from("exercises")
        .select("id, section")
        .eq("name", exerciseName);

      if (searchError) throw searchError;

      // Handle multiple exercises with the same name by taking the first one
      const existingExercise = existingExercises && existingExercises.length > 0 ? existingExercises[0] : null;

      if (existingExercise) {
        exerciseId = existingExercise.id;
        // Keep canonical exercise section in sync with user's selection
        const desiredSection = exerciseSection || "training";
        if (existingExercise.section !== desiredSection) {
          await supabase
            .from("exercises")
            .update({ section: desiredSection })
            .eq("id", exerciseId);
        }
      } else {
        const { data: newExercise, error: createError } = await supabase
          .from("exercises")
          .insert({ name: exerciseName, section: exerciseSection || "training" })
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

      // Check if this exercise already exists in this workout to prevent duplicates
      const { data: existingWorkoutExercise, error: checkError } = await supabase
        .from("workout_exercises")
        .select("id")
        .eq("workout_id", activeWorkout.id)
        .eq("exercise_id", exerciseId)
        .limit(1);

      if (checkError) {
        console.error("Error checking for existing workout exercise:", checkError);
        throw checkError;
      }

      let workoutExerciseId;
      if (existingWorkoutExercise && existingWorkoutExercise.length > 0) {
        // Exercise already exists in this workout, use the existing one
        workoutExerciseId = existingWorkoutExercise[0].id;
        console.log("Exercise already exists in workout, using existing ID:", workoutExerciseId);
      } else {
        // Create new workout exercise
        const { data: workoutExercise, error: workoutExerciseError } =
          await supabase
            .from("workout_exercises")
            .insert({
              workout_id: activeWorkout.id,
              exercise_id: exerciseId,
              exercise_order: nextOrder,
              snapshot_name: exerciseName.trim(),
              // Honor the drawer's chosen section; fall back to the current section tab
              section_override: exerciseSection || section,
            })
            .select("id")
            .single();

        if (workoutExerciseError) throw workoutExerciseError;
        workoutExerciseId = workoutExercise.id;
      }

      // Add null check for currentUser.id before creating sets
      if (!currentUser?.id) {
        console.error('[ActiveWorkoutSection] Cannot create sets: currentUser ID is null');
        toast.error('User not authenticated. Please refresh and try again.');
        return;
      }

      // Create sets: use form setConfigs if provided, otherwise default to 3 sets
      let setRows;
      if (setConfigs && setConfigs.length > 0) {
        // Use the form-provided setConfigs
        setRows = setConfigs.map((cfg, idx) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          workout_exercise_id: workoutExerciseId,
          set_order: idx + 1, // Add proper set_order for database consistency
          reps: Number(cfg.reps) || 10,
          weight: Number(cfg.weight) || 25,
          weight_unit: cfg.unit || "lbs",
          set_variant: cfg.set_variant || `Set ${idx + 1}`,
          set_type: cfg.set_type || "reps",
          timed_set_duration: cfg.timed_set_duration || 30,
          status: "default",
          user_id: currentUser?.id, // Add user_id to prevent null constraint error
        }));
      } else {
        // Default to 3 sets
        setRows = Array.from({ length: 3 }, (_, idx) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          workout_exercise_id: workoutExerciseId,
          set_order: idx + 1, // Add proper set_order for database consistency
          reps: 10,
          weight: 25,
          weight_unit: "lbs",
          set_variant: `Set ${idx + 1}`,
          set_type: "reps",
          timed_set_duration: 30,
          status: "default",
          user_id: currentUser?.id, // Add user_id to prevent null constraint error
        }));
      }

      // Only create sets if this is a new workout exercise
      if (!existingWorkoutExercise || existingWorkoutExercise.length === 0) {
        const { error: setError } = await supabase.from("sets").insert(setRows);

        if (setError) {
          console.error("Failed to create sets:", setError);
          // Don't throw here - the exercise was created successfully
          // Just log the error and continue
        }
      } else {
        console.log("Exercise already exists in workout, skipping set creation");
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
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      toast.error("Failed to add exercise. Please try again.");
    }
  };

  // Handle adding exercise to routine (future workouts)
  const handleAddExerciseFuture = async (data) => {
    console.log('[ActiveWorkoutSection] handleAddExerciseFuture called with:', data);
    try {
      const { name: exerciseName, section: exerciseSection, setConfigs } = data;

      // Find or create exercise
      let exerciseId;
      const { data: existingExercises, error: searchError } = await supabase
        .from("exercises")
        .select("id, section")
        .eq("name", exerciseName);

      if (searchError) throw searchError;

      // Handle multiple exercises with the same name by taking the first one
      const existingExercise = existingExercises && existingExercises.length > 0 ? existingExercises[0] : null;

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
        activeWorkout.routine_id
      );

      // Add to routine_exercises
      console.log('[ActiveWorkoutSection] Adding to routine_exercises:', {
        routine_id: activeWorkout.routine_id,
        exercise_id: exerciseId,
        exercise_order: nextRoutineOrder,
      });
      
      const { data: routineExercise, error: routineExerciseError } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: activeWorkout.routine_id,
          exercise_id: exerciseId,
          exercise_order: nextRoutineOrder,
        })
        .select("id")
        .single();

      if (routineExerciseError) {
        console.error('[ActiveWorkoutSection] Error adding to routine_exercises:', routineExerciseError);
        throw routineExerciseError;
      }
      
      console.log('[ActiveWorkoutSection] Successfully added to routine_exercises:', routineExercise);

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

        console.log('[ActiveWorkoutSection] Adding routine_sets:', routineSetRows);

        const { error: routineSetError } = await supabase
          .from("routine_sets")
          .insert(routineSetRows);

        if (routineSetError) {
          console.error('[ActiveWorkoutSection] Failed to add sets to routine template:', routineSetError);
          toast.error("Failed to add sets to routine template. Exercise added to today's workout only.");
        } else {
          console.log('[ActiveWorkoutSection] Successfully added routine_sets');
          toast.success("Exercise added to routine template");
        }
      } else {
        console.log('[ActiveWorkoutSection] No setConfigs provided, skipping routine_sets');
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
            section_override: exerciseSection || section, // Use the form section or current tab
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
      console.error('[ActiveWorkoutSection] Error adding exercise to routine:', error);
      toast.error("Failed to add exercise to routine. Please try again.");
    }
  };

  // Handle saving exercise edits
  const handleSaveExerciseEdit = async (data, type = "today") => {
    if (!editingExercise) {
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

      // Track if routine template update was successful
      let routineTemplateUpdated = false;
      
      // If type is "future", also update the routine template
      if (type === "future") {
        console.log('[ActiveWorkoutSection] Updating routine template for exercise:', exercise_id);
        
        // Update the exercise name and section in the exercises table
        const { error: exerciseUpdateError } = await supabase
          .from("exercises")
          .update({ 
            name: newName,
            section: newSection 
          })
          .eq("id", exercise_id);

        if (exerciseUpdateError) {
          console.error("[ActiveWorkoutSection] Failed to update exercise in routine template:", exerciseUpdateError);
          toast.error("Failed to update exercise in routine template. Changes saved for today only.");
          // Don't return - continue with set updates attempt
        } else {
          console.log('[ActiveWorkoutSection] Exercise name/section updated successfully');
        }

        // Find the routine_exercise_id for this exercise
        console.log('[ActiveWorkoutSection] Looking for routine_exercise with routine_id:', activeWorkout.routine_id, 'exercise_id:', exercise_id);
        const { data: routineExercise, error: queryError } = await supabase
          .from("routine_exercises")
          .select("id")
          .eq("routine_id", activeWorkout.routine_id)
          .eq("exercise_id", exercise_id)
          .maybeSingle();

        if (queryError) {
          console.error('[ActiveWorkoutSection] Error querying routine_exercises:', queryError);
          toast.error("Failed to query routine template. Changes saved for today only.");
        } else if (routineExercise) {
          // Exercise exists in routine template - update it
          console.log('[ActiveWorkoutSection] Exercise exists in routine template (id:', routineExercise.id, '), updating sets');
          
          // Delete existing routine_sets for this exercise
          const { error: deleteError } = await supabase
            .from("routine_sets")
            .delete()
            .eq("routine_exercise_id", routineExercise.id);

          if (deleteError) {
            console.error('[ActiveWorkoutSection] Error deleting existing routine_sets:', deleteError);
            toast.error("Failed to update routine template sets. Changes saved for today only.");
          } else {
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

            console.log('[ActiveWorkoutSection] Inserting', routineSetRows.length, 'routine_sets');
            if (routineSetRows.length > 0) {
              const { error: routineSetError } = await supabase
                .from("routine_sets")
                .insert(routineSetRows);
              
              if (routineSetError) {
                console.error("[ActiveWorkoutSection] Failed to update routine template sets:", routineSetError);
                toast.error("Failed to update routine template sets. Changes saved for today only.");
              } else {
                console.log('[ActiveWorkoutSection] Routine template sets updated successfully');
                routineTemplateUpdated = true;
              }
            } else {
              console.log('[ActiveWorkoutSection] No sets to insert');
              routineTemplateUpdated = true;
            }
          }
        } else {
          // Exercise doesn't exist in routine template - add it
          console.log('[ActiveWorkoutSection] Exercise not in routine template, adding it');
          
          // Get the next exercise order for this routine
          const { data: maxOrderData, error: orderError } = await supabase
            .from("routine_exercises")
            .select("exercise_order")
            .eq("routine_id", activeWorkout.routine_id)
            .order("exercise_order", { ascending: false })
            .limit(1);

          if (orderError) {
            console.error('[ActiveWorkoutSection] Error getting max exercise order:', orderError);
            toast.error("Failed to add exercise to routine template. Changes saved for today only.");
          } else {
            const nextOrder = maxOrderData && maxOrderData.length > 0 
              ? (maxOrderData[0].exercise_order || 0) + 1 
              : 1;

            console.log('[ActiveWorkoutSection] Adding exercise to routine with order:', nextOrder);

            // Add exercise to routine template
            const { data: newRoutineExercise, error: routineExerciseError } = await supabase
              .from("routine_exercises")
              .insert({
                routine_id: activeWorkout.routine_id,
                exercise_id: exercise_id,
                exercise_order: nextOrder,
              })
              .select("id")
              .single();

            if (routineExerciseError) {
              console.error("[ActiveWorkoutSection] Failed to add exercise to routine template:", routineExerciseError);
              console.error("[ActiveWorkoutSection] Error details:", {
                code: routineExerciseError.code,
                message: routineExerciseError.message,
                details: routineExerciseError.details,
                hint: routineExerciseError.hint
              });
              toast.error("Failed to add exercise to routine template. Changes saved for today only.");
            } else {
              console.log('[ActiveWorkoutSection] Exercise added to routine template (id:', newRoutineExercise.id, ')');
              
              // Insert routine_sets for the new exercise
              const routineSetRows = newSetConfigs.map((cfg, idx) => ({
                routine_exercise_id: newRoutineExercise.id,
                set_order: idx + 1,
                reps: Number(cfg.reps),
                weight: Number(cfg.weight),
                weight_unit: cfg.weight_unit,
                set_variant: cfg.set_variant,
                set_type: cfg.set_type,
                timed_set_duration: cfg.timed_set_duration,
              }));

              console.log('[ActiveWorkoutSection] Inserting', routineSetRows.length, 'routine_sets for new exercise');
              if (routineSetRows.length > 0) {
                const { error: routineSetError } = await supabase
                  .from("routine_sets")
                  .insert(routineSetRows);
                
                if (routineSetError) {
                  console.error("[ActiveWorkoutSection] Failed to add sets to routine template:", routineSetError);
                  console.error("[ActiveWorkoutSection] Error details:", {
                    code: routineSetError.code,
                    message: routineSetError.message,
                    details: routineSetError.details,
                    hint: routineSetError.hint
                  });
                  toast.error("Failed to add sets to routine template. Exercise added to routine only.");
                } else {
                  console.log('[ActiveWorkoutSection] Routine sets added successfully');
                  routineTemplateUpdated = true;
                }
              } else {
                console.log('[ActiveWorkoutSection] No sets to insert');
                routineTemplateUpdated = true;
              }
            }
          }
        }
      }

      // Handle set changes for current workout
      const currentSets = (editingExercise.setConfigs || []).slice().sort((a, b) => {
        const aOrder = a.set_order ?? 0;
        const bOrder = b.set_order ?? 0;
        return aOrder - bOrder;
      });
      const newSets = (newSetConfigs || []).slice();

      const currentCount = currentSets.length;
      const newCount = newSets.length;
      const minCount = Math.min(currentCount, newCount);

      // Determine sets to update (by ID) in the overlapping range
      const setsToUpdate = [];
      for (let i = 0; i < minCount; i++) {
        const newSet = newSets[i];
        if (!newSet?.id) continue; // Only update persisted rows
        const currentSet = currentSets.find((cs) => cs.id === newSet.id);
        if (!currentSet) continue;
        if (
          newSet.reps !== currentSet.reps ||
          newSet.weight !== currentSet.weight ||
          newSet.weight_unit !== currentSet.weight_unit ||
          newSet.set_variant !== currentSet.set_variant ||
          newSet.set_type !== currentSet.set_type ||
          newSet.timed_set_duration !== currentSet.timed_set_duration
        ) {
          setsToUpdate.push(newSet);
        }
      }

      // LIFO removals: remove the last N current sets by set_order
      const numToRemove = Math.max(0, currentCount - newCount);
      const setsToRemove = numToRemove > 0 ? currentSets.slice(-numToRemove) : [];

      // Remove sets (LIFO: delete highest set_order first)
      const setsToRemoveInLifo = [...setsToRemove].sort((a, b) => {
        const aOrder = a.set_order ?? 0;
        const bOrder = b.set_order ?? 0;
        return bOrder - aOrder;
      });
      for (const set of setsToRemoveInLifo) {
        if (set.id) {
          // Delete saved sets directly
          await supabase
            .from("sets")
            .delete()
            .eq("id", set.id);
        } else if (set.routine_set_id) {
          // For template sets, create a hidden set to override the template
          const hiddenSetData = {
            workout_id: activeWorkout.id,
            exercise_id: exercise_id,
            routine_set_id: set.routine_set_id,
            reps: set.reps,
            weight: set.weight,
            weight_unit: set.weight_unit,
            set_type: set.set_type,
            set_variant: set.set_variant,
            timed_set_duration: set.timed_set_duration,
            status: "hidden", // Mark as hidden to exclude from display
          };

          console.log("Creating hidden set for exercise ID:", exercise_id);
          console.log("Hidden set data:", hiddenSetData);
          const { error } = await supabase
            .from("sets")
            .insert(hiddenSetData);

          if (error) {
            console.error("Error creating hidden set:", error);
            throw error;
          }
        }
      }

      // Add new sets appended after the last existing set
      // Determine the current max set_order among existing sets
      const currentMaxOrder = (currentSets || []).reduce((max, s) => {
        const order = s.set_order ?? 0;
        return order > max ? order : max;
      }, 0);

      let nextOrder = currentMaxOrder;
      // Only add the extra sets beyond the current count, in the order shown in the form
      const numToAdd = Math.max(0, newCount - currentCount);
      const setsToAdd = numToAdd > 0 ? newSets.slice(-numToAdd) : [];
      for (const set of setsToAdd) {
        nextOrder += 1;
        await supabase
          .from("sets")
          .insert({
            workout_id: activeWorkout.id,
            exercise_id: exercise_id,
            // Always append after the last existing set
            set_order: nextOrder,
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

      // Show appropriate success message
      if (type === "future") {
        if (routineTemplateUpdated) {
          toast.success("Exercise updated in routine template");
        } else {
          toast.success("Exercise updated for today only");
        }
      } else {
        toast.success("Exercise updated successfully");
      }
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
        set_variant: (values.set_variant || "").slice(0, MAX_SET_NAME_LEN),
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
          set_variant: (values.set_variant || "").slice(0, MAX_SET_NAME_LEN),
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
      // If this deletion would result in zero visible sets, confirm exercise deletion instead
      const exerciseIdForEdit = editingSet?.exerciseId;
      const exerciseForEdit = exercises.find(ex => ex.exercise_id === exerciseIdForEdit);
      const visibleSetCount = exerciseForEdit?.setConfigs?.length || 0;
      if (visibleSetCount <= 1) {
        setConfirmDeleteExerciseOpen(true);
        return;
      }

      // If setUpdateType is "future" and we have a routine_set_id, handle routine template deletion
      if (setUpdateType === "future" && isTemplateSet) {
        const routineSetId = editingSet.setConfig.routine_set_id;

        // Look up routine_exercise_id for this routine_set
        const { data: rsRow, error: rsFetchErr } = await supabase
          .from("routine_sets")
          .select("id, routine_exercise_id")
          .eq("id", routineSetId)
          .single();
        if (rsFetchErr) {
          console.error("Failed to lookup routine_set:", rsFetchErr);
          throw rsFetchErr;
        }

        const routineExerciseId = rsRow.routine_exercise_id;

        // Count how many routine_sets remain for this exercise
        const { count, error: cntErr } = await supabase
          .from("routine_sets")
          .select("id", { count: "exact", head: true })
          .eq("routine_exercise_id", routineExerciseId);
        if (cntErr) {
          console.error("Failed to count routine sets:", cntErr);
          throw cntErr;
        }

        if ((count || 0) <= 1) {
          // Last set: delete the routine_set; DB trigger will remove the parent exercise
          const { error: routineSetError } = await supabase
            .from("routine_sets")
            .delete()
            .eq("id", routineSetId);
          if (routineSetError) {
            console.error("Failed to delete routine set:", routineSetError);
            throw routineSetError;
          }
          toast.success("Removed exercise from routine");
        } else {
          // Normal case: delete just this routine_set
          const { error: routineSetError } = await supabase
            .from("routine_sets")
            .delete()
            .eq("id", routineSetId);

          if (routineSetError) {
            console.error("Failed to delete from routine template:", routineSetError);
            toast.error("Failed to delete from routine template. Set deleted from today's workout only.");
          } else {
            toast.success("Set deleted from routine template");
          }
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
      if (!exercise) return;

      // Prevent deleting the last remaining set for an exercise
      if ((exercise.setConfigs?.length || 0) <= 1) {
        // If this is the last remaining set, confirm that we will delete the exercise instead
        setConfirmDeleteExerciseOpen(true);
        return;
      }

      if (exercise.setConfigs.length === 0) return;

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
        applyPaddingOnParent={true}
        style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 32, paddingRight: 32 }}
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
          applyPaddingOnParent={true}
          style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 32, paddingRight: 32 }}
        >
          <CardWrapper>
            <ActionCard
              text="Add an exercise"
              onClick={handleAddExercise}
              className="self-stretch w-full"
            />
          </CardWrapper>
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
                if (type === "future") {
                  handleAddExerciseFuture(data);
                } else {
                  handleAddExerciseToday(data);
                }
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
        showPlusButton={false}
        onPlus={handleAddExercise}
        isFirst={section === "warmup"}
        className={`${section === "warmup" ? "border-t-0" : ""} ${isLastSection ? "flex-1" : ""}`}
        deckGap={12}
        backgroundClass="bg-transparent"
        paddingX={0}
        applyPaddingOnParent={true}
        style={{ paddingBottom: 0, paddingTop: 0, paddingLeft: 32, paddingRight: 32 }}
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
                onSetDataChange={(setId, data) => handleSetDataChange(ex.exercise_id, setId, 'data', data)}
                onExerciseComplete={() => handleExerciseComplete(ex.exercise_id)}
                onSetPress={(setConfig, index) => {
                  console.log(`[ActiveWorkoutSection] onSetPress called with:`, { setConfig, index, exerciseId: ex.exercise_id, setConfigsLength: ex.setConfigs?.length });
                  console.log(`[ActiveWorkoutSection] Full setConfigs array:`, ex.setConfigs);
                  handleSetPress(ex.exercise_id, setConfig, index);
                }}
                isUnscheduled={false}
                onSetProgrammaticUpdate={(setId, data) => handleSetDataChange(ex.exercise_id, setId, 'data', data)}
                onSetReorder={(exerciseId, reorderedSets) => handleSetReorder(exerciseId, reorderedSets, 0, 0)}
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
        {/* Persistent add button as last item in section */}
        <CardWrapper>
          <ActionCard
            text="Add an exercise"
            onClick={handleAddExercise}
            className="self-stretch w-full"
          />
        </CardWrapper>
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
          onOpenChange={() => {
            setEditingExercise(null);
          }}
          title="Edit exercise"
          description="Edit exercise details including name, section, and sets"
          leftAction={() => {
            setEditingExercise(null);
          }}
          leftText="Close"
          rightAction={() => {
            if (editExerciseFormRef.current) {
              editExerciseFormRef.current.requestSubmit();
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
              onActionIconClick={(data) => {
                handleSaveExerciseEdit(data, exerciseUpdateType);
              }}
              onDirtyChange={(dirty) => {
                setEditingExerciseDirty(dirty);
              }}
              showUpdateTypeToggle={true}
              updateType={exerciseUpdateType}
              onUpdateTypeChange={(newType) => {
                setExerciseUpdateType(newType);
              }}
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

      {/* Confirm undo completed set */}
      <SwiperDialog
        open={confirmUndoSetOpen}
        onOpenChange={setConfirmUndoSetOpen}
        onConfirm={handleSetMarkIncomplete}
        onCancel={() => setConfirmUndoSetOpen(false)}
        title="Mark set incomplete?"
        confirmText="Mark incomplete"
        cancelText="Cancel"
        confirmVariant="default"
        cancelVariant="outline"
        contentClassName=""
        headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-t border-neutral-300 inline-flex justify-start items-center"
        footerClassName="self-stretch px-3 py-3"
      />

      {/* Confirm deleting last set => delete exercise */}
      <SwiperDialog
        open={confirmDeleteExerciseOpen}
        onOpenChange={setConfirmDeleteExerciseOpen}
        onConfirm={() => setConfirmDeleteExerciseOpen(false)}
        onCancel={async () => {
          // Proceed with deleting the exercise from today's workout
          try {
            const exerciseId = editingSet?.exerciseId;
            if (!exerciseId) {
              setConfirmDeleteExerciseOpen(false);
              return;
            }

            // 1) Delete all saved sets for this exercise in today's workout
            await supabase
              .from("sets")
              .delete()
              .eq("workout_id", activeWorkout.id)
              .eq("exercise_id", exerciseId);

            // 2) Remove the workout_exercises row so this card disappears entirely
            await supabase
              .from("workout_exercises")
              .delete()
              .eq("workout_id", activeWorkout.id)
              .eq("exercise_id", exerciseId);

            // Refresh UI
            await fetchExercises();
            setConfirmDeleteExerciseOpen(false);
            setEditSheetOpen(false);
          } catch (e) {
            console.error("Failed to delete exercise for today:", e);
            toast.error("Failed to delete exercise for today");
            setConfirmDeleteExerciseOpen(false);
          }
        }}
        title="Delete exercise?"
        confirmText="Cancel"
        cancelText="Delete exercise"
        confirmVariant="outline"
        cancelVariant="destructive"
        contentClassName=""
        headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-t border-neutral-300 inline-flex justify-start items-center"
        footerClassName="self-stretch px-3 py-3"
      >
        Deleting this set will remove the exercise from today’s workout.
      </SwiperDialog>
    </>
  );
};

export default ActiveWorkoutSection; 