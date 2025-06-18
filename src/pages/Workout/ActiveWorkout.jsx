import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import ActiveExerciseCard from "@/components/common/Cards/ActiveExerciseCard";
import AddExerciseToProgramForm from "@/components/common/forms/AddExerciseToProgramForm";
import AppLayout from "@/components/layout/AppLayout";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    endWorkout: contextEndWorkout,
    workoutProgress,
    updateWorkoutProgress,
    saveSet,
    updateSet,
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();

  useEffect(() => {
    if (!isWorkoutActive) {
      navigate("/workout", { replace: true });
    }
  }, [isWorkoutActive, navigate]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  useEffect(() => {
    if (activeWorkout) {
      supabase
        .from("program_exercises")
        .select(
          `
          id,
          exercise_id,
          exercises(name),
          program_sets(id, reps, weight, weight_unit, set_order, set_variant)
        `
        )
        .eq("program_id", activeWorkout.programId)
        .then(async ({ data: progExs, error }) => {
          if (error || !progExs) {
            setExercises([]);
            return;
          }
          const exerciseIds = progExs.map((pe) => pe.exercise_id);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from("exercises")
            .select("id, name")
            .in("id", exerciseIds);

          if (exercisesError) {
            setExercises([]);
            return;
          }

          const uniqueProgExs = progExs.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          );

          const cards = uniqueProgExs.map((pe) => ({
            id: pe.id,
            exercise_id: pe.exercise_id,
            name:
              (exercisesData.find((e) => e.id === pe.exercise_id) || {}).name ||
              "Unknown",
            setConfigs: (pe.program_sets || [])
              .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
              .map((set) => ({
                id: set.id,
                reps: set.reps,
                weight: set.weight,
                unit: set.weight_unit || "lbs",
                set_variant: set.set_variant || `Set ${set.set_order}`,
              })),
          }));
          setExercises(cards);
        });
    } else {
      setExercises([]);
    }
  }, [activeWorkout]);

  const handleSetDataChange = (exerciseId, setIdOrUpdates, field, value) => {
    if (Array.isArray(setIdOrUpdates)) {
      // New signature: an array of update objects
      updateWorkoutProgress(exerciseId, setIdOrUpdates);
      // Persist each update to the database if the set has an id
      setIdOrUpdates.forEach((update) => {
        if (
          update.id &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            update.id
          )
        ) {
          updateSet(update.id, update.changes);
        }
      });
    } else {
      // Legacy signature: single field update, convert to new format
      const updates = [
        {
          id: setIdOrUpdates,
          changes: { [field]: value },
        },
      ];
      updateWorkoutProgress(exerciseId, updates);
      if (setIdOrUpdates) {
        updateSet(setIdOrUpdates, { [field]: value });
      }
    }
  };

  const handleSetComplete = (exerciseId, setConfig) => {
    saveSet(exerciseId, setConfig);
  };

  const handleSetProgrammaticUpdate = async (exerciseId, setId, formValues) => {
    if (!activeWorkout || !activeWorkout.programId) return;

    // Ensure setId is a valid UUID
    if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        setId
      )
    ) {
      console.error("Invalid UUID for setId:", setId);
      return;
    }

    try {
      // Update only columns that exist in program_sets
      const { data, error } = await supabase
        .from("program_sets")
        .update({
          reps: formValues.reps,
          weight: formValues.weight,
          weight_unit: formValues.unit, // use weight_unit, not unit
          set_type: formValues.set_type,
          timed_set_duration: formValues.timed_set_duration,
          set_variant: formValues.set_variant, // set name
        })
        .eq("id", setId); // only use id to identify the row

      if (error) throw error;
    } catch (error) {
      console.error("Error updating program set:", error);
      // Optionally, show an error to the user
    }
  };

  const handleEndWorkout = async () => {
    try {
      await contextEndWorkout();
      navigate("/history");
    } catch (error) {
      console.error("Error ending workout:", error);
      alert("There was an error ending your workout. Please try again.");
    }
  };

  const handleTitleChange = async (newTitle) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ workout_name: newTitle })
        .eq("id", activeWorkout.id);

      if (error) throw error;
      // Update the active workout context with new name
      // Note: You might need to add a method to update the workout name in the context
    } catch (err) {
      alert("Failed to update workout name: " + err.message);
    }
  };

  const handleDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // End the workout without saving (this will clear the context)
      await contextEndWorkout();
      navigate("/workout");
    } catch (err) {
      alert("Failed to delete workout: " + err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Filter exercises based on search
  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddExercise = async (exerciseData, updateType = "today") => {
    try {
      let { data: existing } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseData.name)
        .maybeSingle();
      let exercise_id = existing?.id;
      if (!exercise_id) {
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert([{ name: exerciseData.name }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }

      const { data: progEx, error: progExError } = await supabase
        .from("program_exercises")
        .insert({
          program_id: activeWorkout.programId,
          exercise_id,
          exercise_order: exercises.length + 1,
        })
        .select("id")
        .single();
      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: `Set ${idx + 1}`,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("program_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to save set details: " + setError.message);
      }

      setShowAddExercise(false);

      // Refresh exercises to show the new one
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleAddExerciseToday = (exerciseData) => {
    handleAddExercise(exerciseData, "today");
  };

  const handleAddExerciseFuture = (exerciseData) => {
    handleAddExercise(exerciseData, "future");
  };

  const handleCancelAddExercise = () => {
    setShowAddExercise(false);
  };

  const refreshExercises = async () => {
    if (!activeWorkout) return;

    const { data: progExs, error } = await supabase
      .from("program_exercises")
      .select(
        `
        id,
        exercise_id,
        exercises(name),
        program_sets(id, reps, weight, weight_unit, set_order, set_variant)
      `
      )
      .eq("program_id", activeWorkout.programId);

    if (error || !progExs) {
      setExercises([]);
      return;
    }

    const exerciseIds = progExs.map((pe) => pe.exercise_id);
    const { data: exercisesData, error: exercisesError } = await supabase
      .from("exercises")
      .select("id, name")
      .in("id", exerciseIds);

    if (exercisesError) {
      setExercises([]);
      return;
    }

    const uniqueProgExs = progExs.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );

    const cards = uniqueProgExs.map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name:
        (exercisesData.find((e) => e.id === pe.exercise_id) || {}).name ||
        "Unknown",
      setConfigs: (pe.program_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => ({
          id: set.id,
          reps: set.reps,
          weight: set.weight,
          unit: set.weight_unit || "lbs",
          set_variant: set.set_variant || `Set ${set.set_order}`,
        })),
    }));
    setExercises(cards);
  };

  return (
    <>
      <AppLayout
        showAddButton={true}
        addButtonText="Add exercise"
        pageNameEditable={true}
        showBackButton={true}
        appHeaderTitle={activeWorkout?.name || "Active Workout"}
        onBack={handleEndWorkout}
        onAction={() => setShowAddExercise(true)}
        onTitleChange={handleTitleChange}
        onDelete={handleDeleteWorkout}
        showDeleteOption={true}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
      >
        <CardWrapper>
          <div className="w-full flex flex-col gap-4 p-4">
            {filteredExercises.map((ex) => (
              <ActiveExerciseCard
                key={ex.id}
                exerciseId={ex.exercise_id}
                exerciseName={ex.name}
                default_view={true}
                initialSetConfigs={ex.setConfigs}
                onSetComplete={handleSetComplete}
                setData={workoutProgress[ex.exercise_id] || []}
                onSetDataChange={handleSetDataChange}
                onSetProgrammaticUpdate={handleSetProgrammaticUpdate}
                isUnscheduled={false}
              />
            ))}
          </div>
        </CardWrapper>

        {showAddExercise && (
          <SwiperSheet
            open={showAddExercise}
            onOpenChange={() => setShowAddExercise(false)}
          >
            <AddExerciseToProgramForm
              key="add-new"
              formPrompt="Add a new exercise"
              onAddExercise={handleAddExerciseToday}
              onAddExerciseFuture={handleAddExerciseFuture}
              onCancel={handleCancelAddExercise}
              initialSets={3}
              initialSetConfigs={Array.from({ length: 3 }, () => ({
                reps: 10,
                weight: 0,
                unit: "kg",
              }))}
            />
          </SwiperSheet>
        )}
      </AppLayout>
      <SwiperAlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Workout?"
        description="Are you sure you want to delete this workout? This will end the workout without saving any progress."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

ActiveWorkout.propTypes = {
  // PropTypes can be re-added if needed
};

export default ActiveWorkout;
