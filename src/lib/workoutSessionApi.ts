import { supabase } from '@/supabaseClient';

type MutationPayload = Record<string, unknown>;

interface WorkoutMutationResponse {
  ok: boolean;
  workout?: any;
  sessionVersion?: number;
  message?: string;
  [key: string]: any;
}

async function callWorkoutMutation(action: string, payload: MutationPayload = {}): Promise<WorkoutMutationResponse> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const token = session?.access_token;
  if (!token) {
    throw new Error('No active session – please sign in again.');
  }

  const response = await fetch('/api/workout/mutation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const errorMessage = details?.error || `Workout mutation failed (${response.status})`;
    const error = new Error(errorMessage);
    (error as any).details = details?.details;
    throw error;
  }

  return response.json();
}

export async function startWorkoutSession(program: any) {
  if (!program) {
    throw new Error('Program is required to start a workout');
  }
  return callWorkoutMutation('start_workout', { program });
}

export async function saveCompletedSet(payload: {
  workoutId: string;
  exerciseId: string;
  setConfig: Record<string, unknown>;
}) {
  return callWorkoutMutation('complete_set', payload);
}

export async function undoCompletedSet(payload: {
  workoutId: string;
  exerciseId: string;
  setConfig: Record<string, unknown>;
}) {
  return callWorkoutMutation('undo_set', payload);
}

export async function addExerciseToWorkoutToday(payload: {
  workoutId: string;
  exercise: {
    name: string;
    section?: string;
    setConfigs?: any[];
  };
}) {
  return callWorkoutMutation('add_exercise_today', payload);
}

export async function addExerciseToWorkoutFuture(payload: {
  workoutId: string;
  routineId: string;
  exercise: {
    name: string;
    section?: string;
    setConfigs?: any[];
  };
}) {
  return callWorkoutMutation('add_exercise_future', payload);
}

export async function updateWorkoutFocus(payload: { workoutId: string; workoutExerciseId: string }) {
  return callWorkoutMutation('update_focus', payload);
}


