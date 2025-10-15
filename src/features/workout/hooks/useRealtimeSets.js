import { useEffect } from 'react';
import { supabase } from '@/supabaseClient';

/**
 * Subscribes to Postgres changes for sets and workout_exercises for a workout section
 * and invokes the provided callbacks to refresh data and mark toasts.
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
  // Sets channel
  useEffect(() => {
    if (!workoutId) return;

    const setsChan = supabase
      .channel(`sets-section-${section}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sets',
        filter: `workout_id=eq.${workoutId}`,
      }, async ({ eventType, new: row, old }) => {
        const currentExerciseIds = getCurrentExerciseIds();
        if (!currentExerciseIds.includes(row.exercise_id)) return;

        if (eventType === 'DELETE') {
          await fetchExercises();
          return;
        }

        if ((eventType === 'UPDATE' && row.status === 'complete' && old?.status !== 'complete') ||
            (eventType === 'INSERT' && row.status === 'complete')) {
          if (!isSetToasted(row.id)) {
            // Determine who completed the set (for future UX if needed)
            const uid = await getUserId();
            const wasCompletedByCurrentUser = row.account_id === uid;
            // eslint-disable-next-line no-unused-vars
            const completedByUserType = wasCompletedByCurrentUser ? (isDelegated ? 'Manager' : 'Client') : (isDelegated ? 'Client' : 'Manager');
            markSetToasted(row.id);
          }
        }

        await fetchExercises();
      })
      .subscribe();

    return () => { void setsChan.unsubscribe(); };
  }, [workoutId, section, getCurrentExerciseIds, fetchExercises, getUserId, isDelegated, isSetToasted, markSetToasted]);

  // Workout exercises channel
  useEffect(() => {
    if (!workoutId) return;

    const exercisesChan = supabase
      .channel(`workout-exercises-section-${section}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workout_exercises',
        filter: `workout_id=eq.${workoutId}`,
      }, async ({ eventType }) => {
        if (eventType === 'INSERT' || eventType === 'UPDATE' || eventType === 'DELETE') {
          await fetchExercises();
        }
      })
      .subscribe();

    return () => { void exercisesChan.unsubscribe(); };
  }, [workoutId, section, fetchExercises]);
}


