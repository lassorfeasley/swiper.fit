import ActiveExerciseCard, { CARD_ANIMATION_DURATION_MS } from "./components/ActiveExerciseCard";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import SwiperForm from "@/components/molecules/swiper-form";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { supabase } from "@/supabaseClient";

const ActiveWorkoutSection = ({
  section,
  onSectionComplete,
  onUpdateLastExercise,
}) => {
  const { activeWorkout } = useActiveWorkout();

  // Local state for this section's exercises
  const [exercises, setExercises] = useState([]);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);

  // Internal focus state management
  const [focusedExerciseId, setFocusedExerciseId] = useState(null);
  const [focusedCardHeight, setFocusedCardHeight] = useState(0);
  const [focusedNode, setFocusedNode] = useState(null);

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

      console.log('[ActiveWorkoutSection] Section:', section, 'Fetched workoutExercises:', workoutExercises);

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

      // Group saved sets by exercise_id
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
        templateConfigs.forEach((template) => {
          const savedSet = savedSetsForExercise.find(
            (saved) => saved.routine_set_id === template.routine_set_id
          );

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
            });
          } else {
            mergedSetConfigs.push({
              ...template,
              unit: template.unit || "lbs",
              weight_unit: template.unit || "lbs",
            });
          }
        });

        // Add orphaned saved sets
        savedSetsForExercise.forEach((saved) => {
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
            });
          }
        });

        // Ensure unique set_variant names
        const usedNames = new Set();
        mergedSetConfigs.forEach((set, index) => {
          if (!set.set_variant || usedNames.has(set.set_variant)) {
            // Find the next available set number
            let nextSetNumber = 1;
            while (usedNames.has(`Set ${nextSetNumber}`)) {
              nextSetNumber++;
            }
            set.set_variant = `Set ${nextSetNumber}`;
          }
          usedNames.add(set.set_variant);
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
      setLoading(false);
      setFirstLoad(false);
      console.log('[ActiveWorkoutSection] Section:', section, 'Processed exercises:', processedExercises);
      console.log('[ActiveWorkoutSection] Section:', section, 'Final exercises state set:', processedExercises.map(ex => ({ name: ex.name, setCount: ex.setConfigs.length })));
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
  }, [fetchExercises]);

  // Real-time subscription for sets in this section
  useEffect(() => {
    if (!activeWorkout?.id) return;

    const exerciseIds = exercises.map(ex => ex.exercise_id);
    if (exerciseIds.length === 0) return;

    const setsChan = supabase
      .channel(`sets-section-${section}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sets', 
        filter: `workout_id=eq.${activeWorkout.id}` 
      }, ({ eventType, new: row, old }) => {
        // Only process if the set belongs to an exercise in this section
        if (!exerciseIds.includes(row.exercise_id)) return;

        // Refresh exercises to get updated data
        fetchExercises();
      })
      .subscribe();

    return () => {
      void setsChan.unsubscribe();
    };
  }, [activeWorkout?.id, exercises, section, fetchExercises]);

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

  const focusedCardRef = useCallback((node) => {
    if (node !== null) {
      setFocusedNode(node);
    }
  }, []);

  // Monitor focused node for height changes
  useEffect(() => {
    if (focusedNode) {
      const resizeObserver = new ResizeObserver(() => {
        setFocusedCardHeight(focusedNode.offsetHeight);
      });
      resizeObserver.observe(focusedNode);
      return () => resizeObserver.disconnect();
    }
  }, [focusedNode]);

  // Handle scroll when focus changes
  useEffect(() => {
    if (!focusedNode) return;

    const scrollTimeout = setTimeout(() => {
      if (focusedNode?.scrollIntoView) {
        focusedNode.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, CARD_ANIMATION_DURATION_MS + 50);

    return () => clearTimeout(scrollTimeout);
  }, [focusedNode]);

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

  // Handle set completion for this section
  const handleSetComplete = async (exerciseId, setConfig) => {
    try {
      // Save set to database
      const payload = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        set_variant: setConfig.set_variant,
        status: 'complete'
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
      await fetchExercises();
    } catch (error) {
      console.error("Failed to save set:", error);
      toast.error(`Failed to save set. Please try again.`);
    }
  };

  // Handle set data changes (inline editing)
  const handleSetDataChange = async (
    exerciseId,
    setIdOrUpdates,
    field,
    value
  ) => {
    toast.info("Set editing feature is under construction");
  };

  // Handle exercise completion and navigation
  const handleExerciseComplete = (exerciseId) => {
    const nextExercise = findNextIncompleteExercise(exerciseId);

    if (nextExercise && nextExercise.section === section) {
      changeFocus(nextExercise.exercise_id);
    } else {
      // Mark exercise as complete
      setCompletedExercises(prev => {
        const newSet = new Set(prev);
        newSet.add(exerciseId);
        
        // Check if all exercises in this section are complete
        if (newSet.size === exercises.length) {
          onSectionComplete?.(section);
        }
        
        return newSet;
      });
    }
  };

  // Helper to find next incomplete exercise
  const findNextIncompleteExercise = (currentExerciseId) => {
    const currentIndex = exercises.findIndex(
      (ex) => ex.exercise_id === currentExerciseId
    );

    // Look for next incomplete exercise in this section
    for (let i = currentIndex + 1; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!completedExercises.has(ex.exercise_id)) {
        return { ...ex, section };
      }
    }

    // Look for previous incomplete exercise in this section
    for (let i = currentIndex - 1; i >= 0; i--) {
      const ex = exercises[i];
      if (!completedExercises.has(ex.exercise_id)) {
        return { ...ex, section };
      }
    }

    return null;
  };

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

  // Internal focus change logic
  const changeFocus = useCallback(
    (newExerciseId) => {
      const collapseDurationMs = CARD_ANIMATION_DURATION_MS;

      setFocusedExerciseId(null);

      setTimeout(() => {
        setFocusedExerciseId(newExerciseId);

        const exercise = exercises.find(
          (ex) => ex.exercise_id === newExerciseId
        );
        if (exercise?.id && onUpdateLastExercise) {
          onUpdateLastExercise(exercise.id);
        }
      }, collapseDurationMs);
    },
    [exercises, onUpdateLastExercise]
  );

  // Handle focus from external calls
  const handleFocus = (exerciseId) => {
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

      const { data: workoutExercises, error: workoutExerciseError } =
        await supabase
          .from("workout_exercises")
          .insert({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            exercise_order: nextOrder,
            snapshot_name: exerciseName.trim(),
            section_override: section, // Force this exercise into the section
          })
          .select("*");

      if (workoutExerciseError) throw workoutExerciseError;

      // Create sets: use form setConfigs if provided, otherwise default to 3 sets
      let setRows;
      if (setConfigs && setConfigs.length > 0) {
        // Use the form-provided setConfigs
        setRows = setConfigs.map((cfg, idx) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
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

      // Focus on the newly added exercise
      changeFocus(exerciseId);
    } catch (error) {
      console.error("Error adding exercise:", error);
      toast.error("Failed to add exercise. Please try again.");
    }
  };

  // Handle adding exercise to routine (future workouts)
  const handleAddExerciseFuture = async (data) => {
    // First add to routine, then add to current workout
    await handleAddExerciseToday(data);
    // TODO: Add routine template logic if needed
  };

  // Handle saving exercise edits
  const handleSaveExerciseEdit = async (data, type = "today") => {
    console.log('[DEBUG] handleSaveExerciseEdit called with:', { data, type, editingExercise });
    if (!editingExercise) {
      console.log('[DEBUG] No editingExercise, returning');
      return;
    }

    try {
      const { id: workoutExerciseId, exercise_id } = editingExercise;
      const newName = data.name?.trim();
      const newSection = data.section;
      const newSetConfigs = data.setConfigs || [];

      console.log('[DEBUG] Processing exercise edit:', { 
        workoutExerciseId, 
        exercise_id, 
        newName, 
        newSection, 
        newSetConfigs 
      });

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

      // Handle set changes
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
      console.log('[DEBUG] About to refresh exercises after save');
      await fetchExercises();
      console.log('[DEBUG] Finished refreshing exercises after save');
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

      if (setConfig.id) {
        const { error } = await supabase
          .from("sets")
          .update(setData)
          .eq("id", setConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sets").insert(setData);
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
    if (!editingSet?.setConfig?.id) {
      toast.error("Cannot delete unsaved set");
      setEditSheetOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("sets")
        .delete()
        .eq("id", editingSet.setConfig.id);

      if (error) throw error;

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
        showPlusButton={true}
        onPlus={handleAddExercise}
        stickyTopClass="top-11"
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
          stickyTopClass="top-11"
        >
          <div className="text-center py-8 text-gray-500">
            No {section} exercises yet. Add one to get started!
          </div>
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
        stickyTopClass="top-11"
      >
        {exercises.map((ex, index) => {
          const focusedIndex = exercises.findIndex(
            (e) => e.exercise_id === focusedExerciseId
          );
          const isFocused = focusedIndex === index;
          const isExpanded = isFocused || index === exercises.length - 1;

          const STACKING_OFFSET_PX = 64;
          let topOffset = 80 + index * STACKING_OFFSET_PX;

          if (focusedIndex !== -1) {
            const collapsedHeight = 80;
            const extraHeight = Math.max(
              0,
              focusedCardHeight - collapsedHeight
            );
            if (index > focusedIndex) {
              topOffset =
                80 +
                focusedIndex * STACKING_OFFSET_PX +
                focusedCardHeight +
                (index - focusedIndex - 1) * STACKING_OFFSET_PX;
            }
          }

          return (
            <ActiveExerciseCard
              ref={isFocused ? focusedCardRef : null}
              key={ex.id}
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
              isFocused={isFocused}
              isExpanded={isExpanded}
              onFocus={() => {
                if (!isFocused) handleFocus(ex.exercise_id);
              }}
              onEditExercise={() => handleEditExercise(ex)}
              index={index}
              focusedIndex={focusedIndex}
              totalCards={exercises.length}
              topOffset={topOffset}
            />
          );
        })}
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

      {/* Exercise Edit Form */}
      {editingExercise && (
        <SwiperForm
          open={!!editingExercise}
          onOpenChange={() => setEditingExercise(null)}
          title={`Edit ${
            section.charAt(0).toUpperCase() + section.slice(1)
          } Exercise`}
          leftAction={() => setEditingExercise(null)}
          leftText="Close"
          rightAction={() => {
            console.log('[DEBUG] Save button clicked, using ref');
            if (editExerciseFormRef.current) {
              console.log('[DEBUG] Calling requestSubmit on form ref');
              editExerciseFormRef.current.requestSubmit();
            } else {
              console.log('[DEBUG] Form ref not found!');
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
        title={`Edit ${section.charAt(0).toUpperCase() + section.slice(1)} Set`}
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
            hideToggle={editingSet?.fromEditExercise}
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