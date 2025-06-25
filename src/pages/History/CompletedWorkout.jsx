// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-360

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import DrawerManager from "@/components/organisms/drawer-manager";
import FormSectionWrapper from "@/components/common/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import CompletedWorkoutTable from "@/components/common/Tables/CompletedWorkoutTable";
import SetEditForm from "@/components/common/forms/SetEditForm";

const CompletedWorkout = () => {
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isEditWorkoutOpen, setEditWorkoutOpen] = useState(false);
  const [workoutName, setWorkoutName] = useState("");
  const { user } = useAuth();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSetExerciseId, setEditSetExerciseId] = useState(null);
  const [editSetIndex, setEditSetIndex] = useState(null);
  const [editFormValues, setEditFormValues] = useState({});
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);
  const readOnly = !user || (workout && workout.user_id !== user.id);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
        setWorkout(null);
        setSets([]);
        setExercises({});
        setLoading(false);
        return;
      }
      // Fetch workout with program information
      const { data: workoutData } = await supabase
        .from("workouts")
        .select(
          `
          *,
          programs(program_name)
        `
        )
        .eq("id", workoutId)
        .eq("user_id", user.id);
      setWorkout(workoutData);

      // Fetch sets for this workout
      const { data: setsData } = await supabase
        .from("sets")
        .select("id, exercise_id, reps, weight, weight_unit, order, set_type, timed_set_duration, set_variant")
        .eq("workout_id", workoutId)
        .order("order", { ascending: true });

      // Only keep sets that have reps and weight logged and are valid numbers
      const validSets = (setsData || [])
        .filter((set) => {
          if (set.set_type === 'timed') {
            return (
              typeof set.timed_set_duration === 'number' &&
              !isNaN(set.timed_set_duration) &&
              set.timed_set_duration > 0
            );
          }
          return (
            typeof set.reps === 'number' &&
            !isNaN(set.reps) &&
            set.reps > 0
          );
        })
        .map((set) => {
          const unit = set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs');
          return {
            ...set,
            weight: unit === 'body' ? 0 : set.weight,
            unit,
            set_variant: set.set_variant ?? set.name ?? '',
          };
        });
      setSets(validSets);

      // Get unique exercise_ids from valid sets only
      const exerciseIds = [...new Set(validSets.map((s) => s.exercise_id))];

      // Fetch exercise names
      let exercisesObj = {};
      if (exerciseIds.length > 0) {
        const { data: exercisesData } = await supabase
          .from("exercises")
          .select("id, name, section")
          .in("id", exerciseIds);
        (exercisesData || []).forEach((e) => {
          exercisesObj[e.id] = { name: e.name, section: e.section || "training" };
        });
      }
      setExercises(exercisesObj);
      setLoading(false);
    };
    if (workoutId) fetchData();
  }, [workoutId, user]);

  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.workout_name);
    }
  }, [workout]);

  // Group sets by exercise_id, but only include exercises that have valid sets
  const setsByExercise = {};
  sets.forEach((set) => {
    if (!setsByExercise[set.exercise_id]) {
      setsByExercise[set.exercise_id] = [];
    }
    setsByExercise[set.exercise_id].push(set);
  });

  // Filter out exercises that have no valid sets
  const exercisesWithSets = Object.entries(setsByExercise).filter(
    ([_, sets]) => sets.length > 0
  );

  // Filter exercises based on search
  const filteredExercisesWithSets = exercisesWithSets.filter(([exId, sets]) => {
    const exerciseName = exercises[exId]?.name || "[Exercise name]";
    return exerciseName.toLowerCase().includes(search.toLowerCase());
  });

  // Transform data for table rows
  const tableRows = useMemo(() =>
    filteredExercisesWithSets.map(([exId, exerciseSets]) => {
      const exInfo = exercises[exId] || { name: "[Exercise name]", section: "training" };
      // Capitalize first letter for display
      const sectionLabel = exInfo.section
        ? exInfo.section.charAt(0).toUpperCase() + exInfo.section.slice(1)
        : "Training";
      return {
        id: exId,
        exercise: exInfo.name,
        section: sectionLabel,
        setLog: exerciseSets,
      };
    }), [filteredExercisesWithSets, exercises]);

  const handleSaveWorkoutName = async () => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ workout_name: workoutName })
        .eq("id", workoutId)
        .eq("user_id", user.id);

      if (error) throw error;
      setWorkout((prev) => ({ ...prev, workout_name: workoutName }));
      setEditWorkoutOpen(false);
    } catch (err) {
      alert("Failed to update workout name: " + err.message);
    }
  };

  const handleDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // Manually delete associated sets first
      const { error: setsError } = await supabase
        .from("sets")
        .delete()
        .eq("workout_id", workoutId)
        .eq("user_id", user.id);

      if (setsError) {
        throw new Error(
          "Failed to delete associated sets: " + setsError.message
        );
      }

      // Then, delete the workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId)
        .eq("user_id", user.id);

      if (workoutError) {
        throw new Error("Failed to delete workout: " + workoutError.message);
      }

      // Navigate back to history
      window.history.back();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle edits to sets within an exercise
  const handleSetConfigsChange = (exerciseId) => async (updatedConfigs) => {
    try {
      // Retrieve the existing sets for this exercise
      const originalConfigs = sets.filter(
        (s) => s.exercise_id === exerciseId
      );

      const updatedIds = updatedConfigs.map((c) => c.id);

      // Delete sets that were removed
      const toDelete = originalConfigs.filter(
        (c) => !updatedIds.includes(c.id)
      );
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from("sets")
          .delete()
          .in(
            "id",
            toDelete.map((s) => s.id)
          );
        if (delError) throw delError;
      }

      // Upsert (update) existing sets and insert new ones
      for (const cfg of updatedConfigs) {
        const { id, reps, weight, unit, set_type, timed_set_duration, set_variant } = cfg;
        if (id) {
          const { error: updError } = await supabase
            .from("sets")
            .update({
              reps,
              weight,
              weight_unit: unit,
              set_type,
              timed_set_duration,
              set_variant,
            })
            .eq("id", id);
          if (updError) throw updError;
        } else {
          const { error: insError } = await supabase
            .from("sets")
            .insert({
              workout_id: workoutId,
              exercise_id: exerciseId,
              reps,
              weight,
              weight_unit: unit,
              set_type,
              timed_set_duration,
              set_variant,
              order: 0, // Placeholder; you may want to calculate order properly
            });
          if (insError) throw insError;
        }
      }

      // Update local state
      setSets((prev) => {
        // Remove old records for this exercise
        const remainder = prev.filter((s) => s.exercise_id !== exerciseId);
        // Ensure each updated config has exercise_id
        const updatedWithExercise = updatedConfigs.map((c) => ({
          ...c,
          exercise_id: exerciseId,
        }));
        return [...remainder, ...updatedWithExercise];
      });
    } catch (err) {
      console.error(err);
      alert("Failed to update sets: " + err.message);
    }
  };

  const openSetEdit = (exerciseId, setIdx, setConfig) => {
    setEditSetExerciseId(exerciseId);
    setEditSetIndex(setIdx);
    setEditFormValues(setConfig);
    setCurrentFormValues(setConfig);
    setEditSheetOpen(true);
  };

  const handleEditFormSave = (values) => {
    if (editSetExerciseId === null || editSetIndex === null) return;
    // Build updated configs for this exercise
    const exerciseSets = sets.filter((s) => s.exercise_id === editSetExerciseId);
    const updatedConfigs = exerciseSets.map((cfg, idx) =>
      idx === editSetIndex ? { ...cfg, ...values } : cfg
    );
    handleSetConfigsChange(editSetExerciseId)(updatedConfigs);
    setEditSheetOpen(false);
  };

  const handleSetDelete = () => {
    if (editSetExerciseId === null || editSetIndex === null) return;
    const exerciseSets = sets.filter((s) => s.exercise_id === editSetExerciseId);
    const updatedConfigs = exerciseSets.filter((_, idx) => idx !== editSetIndex);
    handleSetConfigsChange(editSetExerciseId)(updatedConfigs);
    setEditSheetOpen(false);
  };

  const handleShare = async () => {
    if (!workout) return;
    const shareUrl = `${window.location.origin}/history/${workoutId}`;
    try {
      if (!workout.is_public) {
        const { error } = await supabase
          .from('workouts')
          .update({ is_public: true })
          .eq('id', workoutId)
          .eq('user_id', user.id);
        if (error) throw error;
        setWorkout((prev) => ({ ...prev, is_public: true }));
      }
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard');
    } catch (err) {
      alert('Failed to share: ' + err.message);
    }
  };

  return (
    <>
      <AppLayout
        showSidebar={!readOnly}
        appHeaderTitle={workout?.workout_name}
        pageNameEditable={!readOnly && true}
        showBackButton={true}
        showAddButton={!readOnly}
        addButtonText="Share"
        onAction={handleShare}
        showEditOption={!readOnly}
        onEdit={() => setEditWorkoutOpen(true)}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
      >
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          (!readOnly ? (
            <CompletedWorkoutTable data={tableRows} onEditSet={openSetEdit} />
          ) : (
            <CompletedWorkoutTable data={tableRows} />
          ))
        )}
      </AppLayout>
      <DrawerManager
        open={isEditWorkoutOpen}
        onOpenChange={setEditWorkoutOpen}
        title="Edit Workout"
        rightAction={handleSaveWorkoutName}
        rightText="Save"
        leftAction={() => setEditWorkoutOpen(false)}
        leftText="Cancel"
      >
        <FormSectionWrapper className="p-4">
          <TextInput
            label="Workout Name"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
        </FormSectionWrapper>
        <div className="p-4 border-t border-neutral-300">
          <SwiperButton
            onClick={handleDeleteWorkout}
            variant="destructive"
            className="w-full"
          >
            Delete Workout
          </SwiperButton>
        </div>
      </DrawerManager>
      <SwiperAlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete workout?"
        description="This workout and its sets will be deleted permanently."
        confirmText="Delete"
        cancelText="Cancel"
      />
      {/* Drawer for editing a set */}
      <DrawerManager
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        title="Edit set"
        leftAction={() => setEditSheetOpen(false)}
        rightAction={() => handleEditFormSave(currentFormValues)}
        rightEnabled={formDirty}
        rightText="Save"
        leftText="Cancel"
        padding={0}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <SetEditForm
              hideInternalHeader
              hideActionButtons
              onDirtyChange={setFormDirty}
              onValuesChange={setCurrentFormValues}
              onSave={handleEditFormSave}
              initialValues={editFormValues}
            />
          </div>
          <div className="border-t border-neutral-300">
            <div className="p-4">
              <SwiperButton
                onClick={handleSetDelete}
                variant="destructive"
                className="w-full"
              >
                Delete Set
              </SwiperButton>
            </div>
          </div>
        </div>
      </DrawerManager>
    </>
  );
};

export default CompletedWorkout;
