import { supabase } from '@/supabaseClient';

type MutationPayload = Record<string, unknown>;

interface WorkoutMutationResponse {
  ok: boolean;
  workout?: any;
  sessionVersion?: number;
  message?: string;
  [key: string]: any;
}

interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 8000,
};

function isRetryableStatus(status: number): boolean {
  if (status >= 500) return true;
  return status === 408 || status === 425 || status === 429;
}

function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.onLine === false) {
    return true;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message = (error as Error)?.message?.toLowerCase() || '';
  return message.includes('network') || message.includes('failed to fetch');
}

function shouldRetryRequest(response: Response | null, error: unknown): boolean {
  if (response) {
    return isRetryableStatus(response.status);
  }
  return isNetworkError(error);
}

function getBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
  const jitter = Math.random() * 100;
  return delay + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeParseJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

async function callWorkoutMutation(
  action: string,
  payload: MutationPayload = {},
  retryOptions: RetryOptions = DEFAULT_RETRY_OPTIONS
): Promise<WorkoutMutationResponse> {
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

  let lastError: unknown;

  for (let attempt = 0; attempt < retryOptions.maxAttempts; attempt += 1) {
    let response: Response | null = null;
    try {
      response = await fetch('/api/workout/mutation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, payload }),
      });

      if (!response.ok) {
        const shouldRetry = shouldRetryRequest(response, null) && attempt < retryOptions.maxAttempts - 1;
        if (shouldRetry) {
          const delay = getBackoffDelay(attempt, retryOptions.baseDelayMs, retryOptions.maxDelayMs);
          console.warn(`[WorkoutMutation] ${action} failed with ${response.status}, retrying in ${Math.round(delay)}ms`);
          await sleep(delay);
          continue;
        }

        const details = await safeParseJson(response);
        const errorMessage = details?.error || `Workout mutation failed (${response.status})`;
        const error = new Error(errorMessage);
        (error as any).details = details?.details;
        throw error;
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      const shouldRetry = shouldRetryRequest(response, error) && attempt < retryOptions.maxAttempts - 1;
      if (!shouldRetry) {
        throw error;
      }
      const delay = getBackoffDelay(attempt, retryOptions.baseDelayMs, retryOptions.maxDelayMs);
      console.warn(`[WorkoutMutation] ${action} network error, retrying in ${Math.round(delay)}ms`, error);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Workout mutation failed after retries');
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


