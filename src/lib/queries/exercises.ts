import { supabase } from '@/supabaseClient';

export interface Exercise {
  id: string;
  name: string;
  section: string;
}

/**
 * Search for exercises that the user has previously used.
 * Searches exercises that appear in the user's routine_exercises or workout_exercises.
 */
export async function searchUserExercises(userId: string, query: string): Promise<Exercise[]> {
  if (!userId) {
    return [];
  }

  // Get distinct exercise IDs from routine_exercises
  const { data: routineExercises, error: routineError } = await supabase
    .from('routine_exercises')
    .select('exercise_id')
    .eq('user_id', userId);

  if (routineError) {
    console.error('[searchUserExercises] Error fetching routine exercises:', routineError);
  }

  // Get distinct exercise IDs from workout_exercises
  const { data: workoutExercises, error: workoutError } = await supabase
    .from('workout_exercises')
    .select('exercise_id')
    .eq('user_id', userId);

  if (workoutError) {
    console.error('[searchUserExercises] Error fetching workout exercises:', workoutError);
  }

  // Combine and deduplicate exercise IDs
  const exerciseIds = new Set<string>();
  (routineExercises || []).forEach((re) => {
    if (re.exercise_id) exerciseIds.add(re.exercise_id);
  });
  (workoutExercises || []).forEach((we) => {
    if (we.exercise_id) exerciseIds.add(we.exercise_id);
  });

  if (exerciseIds.size === 0) {
    return [];
  }

  // Query exercises with name filter (limit to 3 for combobox)
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, section')
    .in('id', Array.from(exerciseIds))
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(3);

  if (error) {
    console.error('[searchUserExercises] Error searching exercises:', error);
    return [];
  }

  return (data || []) as Exercise[];
}
