import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { supabase } from "@/supabaseClient";
import { useAuth } from "./auth-context";

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const { user } = useAuth();
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutProgress, setWorkoutProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // Effect to check for an active workout on load
  useEffect(() => {
    const checkForActiveWorkout = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("workouts")
          .select("*, sets(*), programs(program_name)")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (data && !error) {
          // Found an active workout, let's resume it
          const progress = {};
          if (data.sets) {
            data.sets.forEach((s) => {
              if (!progress[s.exercise_id]) progress[s.exercise_id] = [];
              progress[s.exercise_id].push({
                id: s.id,
                reps: s.reps,
                weight: s.weight,
                unit: s.weight_unit,
                status: "complete", // Assume sets in DB are complete
              });
            });
          }

          const workoutData = {
            id: data.id,
            programId: data.program_id,
            name: data.programs?.program_name || data.workout_name || "Workout",
            startTime: data.created_at,
          };

          setActiveWorkout(workoutData);
          setWorkoutProgress(progress);
          const elapsed = data.created_at
            ? Math.floor((new Date() - new Date(data.created_at)) / 1000)
            : 0;
          setElapsedTime(elapsed);
          setIsWorkoutActive(true);
        }
      } catch (err) {
        console.error("Error checking for active workout:", err);
      } finally {
        setLoading(false);
      }
    };
    checkForActiveWorkout();
  }, [user]);

  useEffect(() => {
    let timer;
    if (isWorkoutActive && !isPaused) {
      timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isWorkoutActive, isPaused]);

  const startWorkout = useCallback(
    async (program) => {
      if (!user) throw new Error("User not authenticated.");

      const { data: workout, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          program_id: program.id,
          workout_name: program.program_name,
          is_active: true,
        })
        .select()
        .single();

      if (error || !workout) {
        console.error("Error creating workout:", error);
        throw new Error("Could not start workout. Please try again.");
      }

      const workoutData = {
        id: workout.id,
        programId: program.id,
        name: program.program_name,
        startTime: workout.created_at,
      };

      setActiveWorkout(workoutData);
      setIsWorkoutActive(true);
      setElapsedTime(0);
      setIsPaused(false);
      setWorkoutProgress({});

      return workoutData;
    },
    [user]
  );

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const endWorkout = useCallback(async () => {
    if (!activeWorkout?.id) return;

    const { error } = await supabase
      .from("workouts")
      .update({
        is_active: false,
        duration_seconds: elapsedTime,
        completed_at: new Date().toISOString(),
      })
      .eq("id", activeWorkout.id);

    if (error) {
      console.error("Error ending workout:", error);
      // Optionally, notify user
    }

    setIsWorkoutActive(false);
    setActiveWorkout(null);
    setElapsedTime(0);
    setIsPaused(false);
    setWorkoutProgress({});
  }, [activeWorkout, elapsedTime]);

  const updateWorkoutProgress = useCallback(
    async (exerciseId, setId, field, value) => {
      // Optimistic UI update
      // Coerce setId to a string (or number if possible)
      let validSetId = setId;
      if (typeof setId !== "string" && typeof setId !== "number") {
        if (
          typeof setId === "object" &&
          setId !== null &&
          "toString" in setId
        ) {
          validSetId = setId.toString();
        } else {
          validSetId = String(setId);
        }
      }
      setWorkoutProgress((prev) => {
        const prevSets = prev[exerciseId] || [];
        const setIdx = prevSets.findIndex((s) => s.id === validSetId);
        let newSets;
        if (setIdx === -1) {
          newSets = [...prevSets, { id: validSetId, [field]: value }];
        } else {
          newSets = prevSets.map((s, i) =>
            i === setIdx ? { ...s, [field]: value } : s
          );
        }
        return { ...prev, [exerciseId]: newSets };
      });
    },
    []
  );

  const saveSet = useCallback(
    async (exerciseId, setConfig) => {
      if (!activeWorkout?.id || !user?.id) {
        console.error("Cannot save set: no active workout or user.");
        return;
      }

      const { reps, weight, unit } = setConfig;

      const { data, error } = await supabase
        .from("sets")
        .insert({
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          reps: Number(reps),
          weight: Number(weight),
          weight_unit: unit,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving set:", error);
        // Here you might want to handle the error, e.g., by reverting the optimistic update
      } else {
        // Update local state with the actual ID from the database
        setWorkoutProgress((prev) => {
          const newSets = (prev[exerciseId] || []).map((s) =>
            s.id === setConfig.id ? { ...s, ...data } : s
          );
          return { ...prev, [exerciseId]: newSets };
        });
      }
    },
    [activeWorkout, user]
  );

  return (
    <ActiveWorkoutContext.Provider
      value={{
        activeWorkout,
        isWorkoutActive,
        startWorkout,
        elapsedTime,
        isPaused,
        togglePause,
        endWorkout,
        workoutProgress,
        updateWorkoutProgress,
        saveSet,
        loading,
      }}
    >
      {!loading && children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error(
      "useActiveWorkout must be used within an ActiveWorkoutProvider"
    );
  }
  return context;
}
