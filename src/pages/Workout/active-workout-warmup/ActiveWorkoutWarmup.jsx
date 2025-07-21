import ActiveExerciseCard, {
  CARD_ANIMATION_DURATION_MS,
} from "@/components/common/Cards/ActiveExerciseCard";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import SwiperForm from "@/components/molecules/swiper-form";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { supabase } from "@/supabaseClient";

const ActiveWorkoutWarmup = ({
  sectionExercises,
  onSetComplete,
  onSetDataChange,
  onExerciseComplete,
  onAddExercise,
  onUpdateLastExercise,
  onRefreshExercises,
}) => {
  const section = "warmup";
  const {
    activeWorkout,
    workoutProgress,
    setWorkoutProgress,
    fetchWorkoutSets,
    updateWorkoutProgress,
  } = useActiveWorkout();

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

  // Form refs
  const addExerciseFormRef = useRef(null);

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

  // Handle set completion for warmup section
  const handleSetComplete = async (exerciseId, setConfig) => {
    try {
      await onSetComplete(exerciseId, setConfig);
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
    try {
      await onSetDataChange(exerciseId, setIdOrUpdates, field, value);
    } catch (error) {
      console.error("Failed to update set:", error);
      toast.error("Failed to update set. Please try again.");
    }
  };

  // Handle exercise completion and navigation
  const handleExerciseComplete = (exerciseId) => {
    const nextExercise = findNextIncompleteExercise(exerciseId);

    if (nextExercise && nextExercise.section === section) {
      changeFocus(nextExercise.exercise_id);
    } else {
      onExerciseComplete(exerciseId);
    }
  };

  // Helper to find next incomplete exercise
  const findNextIncompleteExercise = (currentExerciseId) => {
    const currentIndex = sectionExercises.findIndex(
      (ex) => ex.exercise_id === currentExerciseId
    );

    // Look for next incomplete exercise in this section
    for (let i = currentIndex + 1; i < sectionExercises.length; i++) {
      const ex = sectionExercises[i];
      const exerciseProgress = workoutProgress[ex.exercise_id] || [];
      const totalSets = ex.setConfigs?.length || 0;
      const completedSets = exerciseProgress.filter(
        (set) => set.status === "complete"
      ).length;

      if (completedSets < totalSets) {
        return { ...ex, section };
      }
    }

    // Look for previous incomplete exercise in this section
    for (let i = currentIndex - 1; i >= 0; i--) {
      const ex = sectionExercises[i];
      const exerciseProgress = workoutProgress[ex.exercise_id] || [];
      const totalSets = ex.setConfigs?.length || 0;
      const completedSets = exerciseProgress.filter(
        (set) => set.status === "complete"
      ).length;

      if (completedSets < totalSets) {
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

        const exercise = sectionExercises.find(
          (ex) => ex.exercise_id === newExerciseId
        );
        if (exercise?.id && onUpdateLastExercise) {
          onUpdateLastExercise(exercise.id);
        }
      }, collapseDurationMs);
    },
    [sectionExercises, onUpdateLastExercise]
  );

  // Handle focus from external calls
  const handleFocus = (exerciseId) => {
    changeFocus(exerciseId);
  };

  // Handle adding new exercise to warmup
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
            section_override: section, // Force this exercise into warmup section
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

      // Refresh exercises in parent
      if (onRefreshExercises) {
        await onRefreshExercises();
      }

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
    if (!editingExercise) return;

    try {
      const { id: workoutExerciseId, exercise_id } = editingExercise;
      const newName = data.name?.trim();
      const newSection = data.section;
      const newSetConfigs = data.setConfigs || [];

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

      toast.success("Exercise updated successfully");
      setEditingExercise(null);

      // Refresh exercises in parent
      if (onRefreshExercises) {
        await onRefreshExercises();
      }
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

      // Refresh workout progress
      await fetchWorkoutSets();
      if (onRefreshExercises) {
        await onRefreshExercises();
      }
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

      // Refresh workout progress
      await fetchWorkoutSets();
      if (onRefreshExercises) {
        await onRefreshExercises();
      }
    } catch (error) {
      console.error("Failed to delete set:", error);
      toast.error("Failed to delete set. Please try again.");
    }
  };

  if (!sectionExercises || sectionExercises.length === 0) {
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
        {sectionExercises.map((ex, index) => {
          const focusedIndex = sectionExercises.findIndex(
            (e) => e.exercise_id === focusedExerciseId
          );
          const isFocused = focusedIndex === index;
          const isExpanded = isFocused || index === sectionExercises.length - 1;

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
              setData={workoutProgress[ex.exercise_id] || []}
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
              totalCards={sectionExercises.length}
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
            const formRef = document.querySelector(
              `[data-form-ref="edit-${editingExercise.id}"]`
            );
            if (formRef) formRef.requestSubmit();
          }}
          rightText="Save"
          rightEnabled={editingExerciseDirty}
          padding={0}
          className="edit-exercise-drawer"
        >
          <div className="flex-1 overflow-y-auto">
            <AddNewExerciseForm
              data-form-ref={`edit-${editingExercise.id}`}
              key={`edit-${editingExercise.id}`}
              formPrompt={`Edit ${section} exercise`}
              initialName={editingExercise.name}
              initialSection={
                editingExercise.section === "workout"
                  ? "training"
                  : editingExercise.section
              }
              initialSets={editingExercise.setConfigs?.length}
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

export default ActiveWorkoutWarmup;
