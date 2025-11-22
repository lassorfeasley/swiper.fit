import { useCallback, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import type { RealtimeChannel } from "@supabase/supabase-js";

type SupabasePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
  table: "sets" | "workout_exercises";
};

type SetPayload = {
  id: string;
  workout_id: string;
  workout_exercise_id: string;
  exercise_id: string;
  [key: string]: any;
};

type WorkoutExercisePayload = {
  id: string;
  workout_id: string;
  exercise_id: string;
  [key: string]: any;
};

type Listener = (payload: SupabasePayload<any>) => void;

const listenersByWorkout = new Map<string, Set<Listener>>();
const fetchQueueByWorkout = new Map<string, number>();
const inflightFetches = new Set<string>();
const channelsByWorkout = new Map<
  string,
  { channel: RealtimeChannel; refCount: number }
>();

function emitEvent(workoutId: string, payload: SupabasePayload<any>) {
  listenersByWorkout.get(workoutId)?.forEach((listener) => listener(payload));
}

function ensureChannel(workoutId: string) {
  let entry = channelsByWorkout.get(workoutId);
  if (entry) return entry;

  const channel = supabase.channel(`workout-realtime-${workoutId}`);
  const typedChannel = channel as any;

  typedChannel
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "sets",
        filter: `workout_id=eq.${workoutId}`,
      },
      (payload: SupabasePayload<SetPayload>) => {
        emitEvent(workoutId, { ...payload, table: "sets" });
      }
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workout_exercises",
        filter: `workout_id=eq.${workoutId}`,
      },
      (payload: SupabasePayload<WorkoutExercisePayload>) => {
        emitEvent(workoutId, { ...payload, table: "workout_exercises" });
      }
    )
    .subscribe();

  entry = { channel, refCount: 0 };
  channelsByWorkout.set(workoutId, entry);
  return entry;
}

export function useWorkoutRealtimeChannel({
  workoutId,
  onEvent,
  onFetchRequest,
}: {
  workoutId?: string;
  onEvent?: Listener;
  onFetchRequest?: () => Promise<void>;
}) {
  useEffect(() => {
    if (!workoutId) return;
    const entry = ensureChannel(workoutId);
    entry.refCount += 1;

    return () => {
      entry.refCount -= 1;
      if (entry.refCount <= 0) {
        entry.channel.unsubscribe();
        channelsByWorkout.delete(workoutId);
        listenersByWorkout.delete(workoutId);
        const queued = fetchQueueByWorkout.get(workoutId);
        if (queued) {
          clearTimeout(queued);
          fetchQueueByWorkout.delete(workoutId);
        }
        inflightFetches.delete(workoutId);
      }
    };
  }, [workoutId]);

  useEffect(() => {
    if (!workoutId || !onEvent) return;
    if (!listenersByWorkout.has(workoutId)) {
      listenersByWorkout.set(workoutId, new Set());
    }
    listenersByWorkout.get(workoutId)!.add(onEvent);
    return () => {
      listenersByWorkout.get(workoutId)?.delete(onEvent);
    };
  }, [workoutId, onEvent]);

  const queueFetch = useCallback(() => {
    if (!workoutId || !onFetchRequest) return;
    if (inflightFetches.has(workoutId)) return;

    if (fetchQueueByWorkout.has(workoutId)) {
      clearTimeout(fetchQueueByWorkout.get(workoutId));
    }

    const timeout = window.setTimeout(async () => {
      fetchQueueByWorkout.delete(workoutId);
      inflightFetches.add(workoutId);
      try {
        await onFetchRequest();
      } finally {
        inflightFetches.delete(workoutId);
      }
    }, 50);

    fetchQueueByWorkout.set(workoutId, timeout);
  }, [workoutId, onFetchRequest]);

  return { queueFetch };
}

