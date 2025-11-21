import { supabase } from '@/supabaseClient';

export type HistoryWorkout = Record<string, any>;

export interface ProcessedHistoryWorkout extends HistoryWorkout {
  exerciseCount: number;
}

export const historyKeys = {
  all: ['history'] as const,
  list: (targetUserId?: string | null, viewerId?: string | null) =>
    [...historyKeys.all, 'list', targetUserId ?? '', viewerId ?? ''] as const,
};

export async function fetchHistoryWorkouts(userId: string): Promise<ProcessedHistoryWorkout[]> {
  const { data, error } = await supabase
    .from('workouts')
    .select(
      '*, routines!fk_workouts__routines(routine_name), sets!fk_sets__workouts(id, exercise_id)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map((w) => ({
    ...w,
    exerciseCount: new Set(w.sets?.map((s) => s.exercise_id).filter(Boolean) || []).size,
  }));
}

