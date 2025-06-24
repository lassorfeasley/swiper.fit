// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-360

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppLayout from "@/components/layout/AppLayout";
import ExerciseCard from "@/components/common/Cards/ExerciseCard";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { useAuth } from "@/contexts/AuthContext";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import DrawerManager from "@/components/organisms/drawer-manager";
import FormSectionWrapper from "@/components/common/forms/wrappers/FormSectionWrapper";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";

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
        .eq("user_id", user.id)
        .single();
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
          .select("id, name")
          .in("id", exerciseIds);
        (exercisesData || []).forEach((e) => {
          exercisesObj[e.id] = e.name;
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
    const exerciseName = exercises[exId] || "[Exercise name]";
    return exerciseName.toLowerCase().includes(search.toLowerCase());
  });

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
        .eq("workout_id", workoutId);

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

  return (
    <>
      <AppLayout
        appHeaderTitle={workout?.workout_name}
        pageNameEditable={true}
        showBackButton={true}
        showAddButton={false}
        showEditOption={true}
        onEdit={() => setEditWorkoutOpen(true)}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
      >
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <CardWrapper>
            {filteredExercisesWithSets.map(([exId, exerciseSets]) => (
              <div key={exId} className="w-full">
                <ExerciseCard
                  mode="completed"
                  exerciseName={exercises[exId] || "[Exercise name]"}
                  setConfigs={exerciseSets}
                  onSetConfigsChange={handleSetConfigsChange(exId)}
                />
              </div>
            ))}
          </CardWrapper>
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
    </>
  );
};

export default CompletedWorkout;
