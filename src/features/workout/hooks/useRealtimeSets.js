import { useCallback, useEffect, useRef } from "react";
import { useWorkoutRealtimeChannel } from "./useWorkoutRealtimeChannel";

/**
 * Subscribes to Postgres changes for sets/workout_exercises via shared channel.
*/
export function useRealtimeSets({
  workoutId,
  section,
  getCurrentExerciseIds, // () => number[]
  fetchExercises,        // () => Promise<void>
  getUserId,             // () => Promise<string|null>
  isDelegated,
  isSetToasted,
  markSetToasted,
}) {
  const queueRef = useRef(() => {});

  const handleEvent = useCallback(
    async (payload) => {
      if (!workoutId) return;
      const exerciseIds = getCurrentExerciseIds();

      if (payload.table === "sets") {
        const row = payload.new || payload.old;
        if (!row) return;
        if (!exerciseIds.includes(row.exercise_id)) return;

        if (payload.eventType === "DELETE") {
          queueFetch();
          return;
        }

        if (
          (payload.eventType === "UPDATE" &&
            row.status === "complete" &&
            payload.old?.status !== "complete") ||
          (payload.eventType === "INSERT" && row.status === "complete")
        ) {
          if (!isSetToasted(row.id)) {
            await getUserId();
            markSetToasted(row.id);
          }
        }

        queueRef.current();
      } else if (payload.table === "workout_exercises") {
        queueRef.current();
      }
    },
    [
      workoutId,
      getCurrentExerciseIds,
      isSetToasted,
      markSetToasted,
      getUserId,
      isDelegated
    ]
  );

  const { queueFetch } = useWorkoutRealtimeChannel({
    workoutId,
    onEvent: handleEvent,
    onFetchRequest: fetchExercises,
  });

  useEffect(() => {
    queueRef.current = queueFetch;
  }, [queueFetch]);
}


