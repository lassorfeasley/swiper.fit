import React, { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import SwiperForm from "@/components/molecules/swiper-form";

const AddExercise = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { activeWorkout, updateWorkoutExercises, loading } = useActiveWorkout();
  
  const [canAddExercise, setCanAddExercise] = useState(false);
  const formRef = useRef();
  
  // Get section from URL params (warmup, training, cooldown)
  const section = searchParams.get('section') || 'training';

  // Redirect if no active workout after loading completes
  React.useEffect(() => {
    if (!loading && !activeWorkout) {
      const timer = setTimeout(() => {
        navigate('/routines');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, activeWorkout, navigate]);

  const handleAddExerciseToday = async (data) => {
    try {
      // Ensure an exercise row exists (re-use by name if already present)
      let exerciseId;
      const { data: existing, error: findErr } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", data.name.trim())
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        exerciseId = existing.id;
        // Update the section if we're reusing an existing exercise
        const { error: updateErr } = await supabase
          .from("exercises")
          .update({ section: data.section })
          .eq("id", existing.id);
        if (updateErr) console.error("Error updating exercise section:", updateErr);
      } else {
        const { data: newEx, error: insertErr } = await supabase
          .from("exercises")
          .insert({ name: data.name.trim(), section: data.section })
          .select()
          .single();
        if (insertErr) throw insertErr;
        exerciseId = newEx.id;
      }

      // Create a workout_exercises row for persistence
      const { data: snapEx, error: snapErr } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          exercise_order: 1000, // Will be updated by real-time sync
          snapshot_name: data.name.trim(),
        })
        .select()
        .single();
      if (snapErr) throw snapErr;

      // Create the sets in the database so they persist
      if (data.setConfigs.length > 0) {
        const setsToCreate = data.setConfigs.map((cfg, index) => ({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          routine_set_id: null, // These are "today only" sets
          reps: cfg.reps,
          weight: cfg.weight,
          weight_unit: cfg.unit,
          set_variant: cfg.set_variant || `Set ${index + 1}`,
          set_type: cfg.set_type || 'reps',
          timed_set_duration: cfg.timed_set_duration,
          status: 'pending'
        }));

        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToCreate);
        
        if (setsError) {
          console.error('Error creating sets for new exercise:', setsError);
        }
      }

      // Append to local list with real database ID
      const newCard = {
        id: snapEx.id,
        exercise_id: exerciseId,
        section: data.section,
        name: data.name.trim(),
        setConfigs: data.setConfigs.map(cfg => ({ ...cfg, status: 'pending' })),
      };
      updateWorkoutExercises((prev) => [...prev, newCard]);
      
      // Navigate back to active workout
      navigate('/workout/active');
    } catch (err) {
      console.error("Error adding exercise for today:", err);
      alert(err.message || "Failed to add exercise.");
    }
  };

  const handleAddExerciseFuture = async (data) => {
    try {
      if (!activeWorkout?.programId) {
        alert("No routine associated with this workout – cannot add permanently.");
        return;
      }
      
      // Step 1: ensure exercise exists
      let exerciseRow;
      const { data: existing, error: findErr } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", data.name.trim())
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        exerciseRow = existing;
      } else {
        const { data: newEx, error: insertErr } = await supabase
          .from("exercises")
          .insert({ name: data.name.trim(), section: data.section })
          .select()
          .single();
        if (insertErr) throw insertErr;
        exerciseRow = newEx;
      }

      // Insert into program's routine_exercises
      const { count: existingCount, error: countErr } = await supabase
        .from("routine_exercises")
        .select("*", { count: "exact", head: true })
        .eq("routine_id", activeWorkout.programId);
      if (countErr) throw countErr;
      const exerciseOrder = (existingCount || 0) + 1;
      const { data: progEx, error: progExErr } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: activeWorkout.programId,
          exercise_id: exerciseRow.id,
          exercise_order: exerciseOrder,
        })
        .select("id")
        .single();
      if (progExErr) throw progExErr;
      
      // Insert default sets into program (routine_sets)
      const setRows = data.setConfigs.map((cfg, idx) => ({
        routine_exercise_id: progEx.id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setErr } = await supabase
          .from("routine_sets")
          .insert(setRows);
        if (setErr) throw setErr;
      }

      // Step 2: insert snapshot workout_exercises row
      const { data: snapEx, error: snapErr } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: activeWorkout.id,
          exercise_id: exerciseRow.id,
          exercise_order: 1000, // Will be updated by real-time sync
          snapshot_name: data.name.trim(),
        })
        .select()
        .single();
      if (snapErr) throw snapErr;

      // Step 3: update local state (so card appears immediately)
      const newCard = {
        id: snapEx.id,
        exercise_id: exerciseRow.id,
        section: data.section,
        name: data.name.trim(),
        setConfigs: data.setConfigs.map(cfg => ({ ...cfg, status: 'default' })),
      };
      updateWorkoutExercises((prev) => [...prev, newCard]);
      
      // Navigate back to active workout
      navigate('/workout/active');
    } catch (err) {
      console.error("Error adding exercise permanently:", err);
      alert(err.message || "Failed to add exercise to routine.");
    }
  };

  const handleFormSubmit = () => {
    if (formRef.current?.requestSubmit) {
      formRef.current.requestSubmit();
    }
  };

  const handleCancel = () => {
    navigate('/workout/active');
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (!activeWorkout) {
    return (
      <div className="text-center py-10">
        <p>No active workout found. Redirecting...</p>
      </div>
    );
  }

  return (
    <SwiperForm
      open={true}
      onOpenChange={handleCancel}
      title="Exercise"
      leftAction={handleCancel}
      rightAction={handleFormSubmit}
      rightEnabled={canAddExercise}
      rightText="Add"
      leftText="Cancel"
      padding={0}
      className="add-exercise-drawer"
    >
      <div className="flex-1 overflow-y-auto">
        <AddNewExerciseForm
          ref={formRef}
          key="add-exercise"
          formPrompt="Add a new exercise"
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
          onDirtyChange={(ready) => setCanAddExercise(ready)}
        />
      </div>
    </SwiperForm>
  );
};

export default AddExercise; 