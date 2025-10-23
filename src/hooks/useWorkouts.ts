import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface Workout {
  id: string;
  workout_name: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
  is_paused: boolean;
  routine_name?: string;
  exercises?: any[];
}

interface UseWorkoutsReturn {
  workouts: Workout[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch public workouts for OG testing
 */
export function useWorkouts(): UseWorkoutsReturn {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkouts = async (): Promise<void> => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            workout_name,
            user_id,
            started_at,
            ended_at,
            is_active,
            is_paused,
            routine_name,
            exercises:workout_exercises(
              id,
              exercise_name,
              order_index,
              sets:sets(
                id,
                reps,
                weight,
                set_type,
                timed_set_duration,
                status,
                order_index
              )
            )
          `)
          .eq('is_active', false)
          .order('started_at', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        setWorkouts(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  return {
    workouts,
    loading,
    error
  };
}
