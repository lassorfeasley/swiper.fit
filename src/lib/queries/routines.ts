import { supabase } from '@/supabaseClient';

export type RoutineRecord = Record<string, any>;

export interface ProcessedRoutine extends RoutineRecord {
  setCount: number;
  exerciseNames: string[];
  lastCompleted: string | null;
}

export const routineKeys = {
  all: ['routines'] as const,
  list: (userId?: string | null) =>
    [...routineKeys.all, 'list', userId ?? ''] as const,
};

function formatLastCompleted(completedAt?: string | null): string | null {
  if (!completedAt) return null;
  const completedDate = new Date(completedAt);
  const now = new Date();

  const completedDateOnly = new Date(
    completedDate.getFullYear(),
    completedDate.getMonth(),
    completedDate.getDate()
  );
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffTime = Math.abs(nowDateOnly.getTime() - completedDateOnly.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Completed today';
  if (diffDays === 1) return 'Completed yesterday';
  if (diffDays < 7) return `Completed ${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Completed ${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  const months = Math.floor(diffDays / 30);
  return `Completed ${months} month${months > 1 ? 's' : ''} ago`;
}

export async function fetchUserRoutines(userId: string): Promise<ProcessedRoutine[]> {
  const { data, error } = await supabase
    .from('routines')
    .select(
      `id, routine_name, created_at, user_id,
       routine_exercises!fk_routine_exercises__routines(
         id,
         exercise_id,
         exercises!fk_routine_exercises__exercises(name),
         routine_sets!fk_routine_sets__routine_exercises(id)
       ),
       workouts!fk_workouts__routines(
         id,
         completed_at
       )`
    )
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((program: RoutineRecord) => {
    const routineExercises = program.routine_exercises || [];
    const setCount = routineExercises.reduce(
      (total, pe) => total + (pe.routine_sets ? pe.routine_sets.length : 0),
      0
    );

    const exerciseNames = routineExercises
      .map((pe) => pe.exercises?.name)
      .filter((name): name is string => Boolean(name));

    const completedWorkouts = (program.workouts || []).filter((w) => w.completed_at);
    const lastCompletedWorkout =
      completedWorkouts.length > 0
        ? completedWorkouts.sort(
            (a, b) =>
              new Date(b.completed_at || 0).getTime() -
              new Date(a.completed_at || 0).getTime()
          )[0]
        : null;

    return {
      ...program,
      setCount,
      exerciseNames,
      lastCompleted: lastCompletedWorkout
        ? formatLastCompleted(lastCompletedWorkout.completed_at)
        : null,
    };
  });
}

