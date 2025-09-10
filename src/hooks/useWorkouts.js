import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Hook to fetch public workouts for OG testing
 */
export function useWorkouts() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('workouts')
          .select(`
            id,
            workout_name,
            created_at,
            duration_seconds,
            is_public,
            accounts!workouts_user_id_fkey(full_name),
            routines!workouts_routine_id_fkey(routine_name)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) {
          throw error;
        }

        setWorkouts(data || []);
      } catch (err) {
        console.error('Error fetching workouts:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  return { workouts, loading, error };
}
