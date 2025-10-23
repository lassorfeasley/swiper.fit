import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

interface Workout {
  id: string;
  workout_name: string;
  user_id: string;
  started_at: string;
  is_active: boolean;
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
            is_active,
            routine_name,
            workout_exercises!workout_exercises_workout_id_fkey(
              id,
              exercise_name,
              order_index,
              sets!sets_workout_exercise_id_fkey(
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

        // Process the data to map workout_exercises to exercises for compatibility
        const processedWorkouts = (data || []).map(workout => ({
          ...workout,
          exercises: workout.workout_exercises || []
        }));

        setWorkouts(processedWorkouts);
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
