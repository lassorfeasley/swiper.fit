// src/api/workoutApi.js
import { supabase } from "../supabaseClient";

export const workoutApi = {
  // Fetch all programs
  getPrograms: async () => {
    const { data, error } = await supabase.from("programs").select("*");
    if (error) throw error;
    return data;
  },

  // Fetch exercises for a program
  getProgramExercises: async (programId) => {
    const { data: progExs, error } = await supabase
      .from("program_exercises")
      .select("*")
      .eq("program_id", programId);

    if (error) throw error;
    if (!progExs) return [];

    const exerciseIds = progExs.map((pe) => pe.exercise_id);
    const { data: exercisesData, error: exercisesError } = await supabase
      .from("exercises")
      .select("id, name")
      .in("id", exerciseIds);

    if (exercisesError) throw exercisesError;

    return progExs.map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name:
        (exercisesData.find((e) => e.id === pe.exercise_id) || {}).name ||
        "Unknown",
      default_sets: pe.default_sets,
      default_reps: pe.default_reps,
      default_weight: pe.default_weight,
    }));
  },

  // Save workout and sets
  saveWorkout: async ({ programId, durationSeconds, userId, sets }) => {
    // 1. Insert workout
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert([
        {
          program_id: programId,
          duration_seconds: durationSeconds,
          completed_at: new Date().toISOString(),
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (workoutError) throw workoutError;

    // 2. Insert sets
    const setsToInsert = Object.entries(sets).flatMap(
      ([exerciseId, exerciseSets]) =>
        exerciseSets.map((set, idx) => {
          const { setId, exerciseId: _remove, status, ...rest } = set;
          return {
            ...rest,
            exercise_id: exerciseId,
            workout_id: workout.id,
            order: idx + 1,
          };
        })
    );

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase
        .from("sets")
        .insert(setsToInsert);

      if (setsError) throw setsError;
    }

    return workout;
  },
};
