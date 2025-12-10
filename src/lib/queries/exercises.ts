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

  // First, get all non-archived routine IDs for this user
  const { data: nonArchivedRoutines, error: routinesError } = await supabase
    .from('routines')
    .select('id')
    .eq('user_id', userId)
    .eq('is_archived', false);

  if (routinesError) {
    console.error('[searchUserExercises] Error fetching non-archived routines:', routinesError);
    return [];
  }

  const nonArchivedRoutineIds = (nonArchivedRoutines || []).map(r => r.id);

  if (nonArchivedRoutineIds.length === 0) {
    // User has no non-archived routines, so no exercises to show
    return [];
  }

  // Get distinct exercise IDs from routine_exercises (only from non-archived routines)
  const { data: routineExercises, error: routineError } = await supabase
    .from('routine_exercises')
    .select('exercise_id')
    .eq('user_id', userId)
    .in('routine_id', nonArchivedRoutineIds)
    .not('exercise_id', 'is', null);

  if (routineError) {
    console.error('[searchUserExercises] Error fetching routine exercises:', routineError);
    return []; // Return empty on error to prevent showing all exercises
  }

  // Get workout IDs from non-archived routines
  const { data: workouts, error: workoutsError } = await supabase
    .from('workouts')
    .select('id')
    .in('routine_id', nonArchivedRoutineIds);

  if (workoutsError) {
    console.error('[searchUserExercises] Error fetching workouts:', workoutsError);
    return [];
  }

  const workoutIds = (workouts || []).map(w => w.id);

  // Get distinct exercise IDs from workout_exercises (only from workouts in non-archived routines)
  let workoutExercises: any[] = [];
  if (workoutIds.length > 0) {
    const { data, error: workoutError } = await supabase
      .from('workout_exercises')
      .select('exercise_id')
      .eq('user_id', userId)
      .in('workout_id', workoutIds)
      .not('exercise_id', 'is', null);

    if (workoutError) {
      console.error('[searchUserExercises] Error fetching workout exercises:', workoutError);
      return []; // Return empty on error to prevent showing all exercises
    }
    workoutExercises = data || [];
  }

  // Combine and deduplicate exercise IDs
  const exerciseIds = new Set<string>();
  (routineExercises || []).forEach((re) => {
    if (re.exercise_id) exerciseIds.add(re.exercise_id);
  });
  workoutExercises.forEach((we) => {
    if (we.exercise_id) exerciseIds.add(we.exercise_id);
  });

  if (exerciseIds.size === 0) {
    return [];
  }

  // Query exercises with name filter (limit to 3 for combobox)
  // Only query exercises that are in the user's exercise IDs set
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

  // Double-check: ensure all returned exercises are in the user's exercise IDs set
  const returnedIds = new Set((data || []).map(ex => ex.id));
  const validResults = (data || []).filter(ex => exerciseIds.has(ex.id));
  
  if (returnedIds.size !== validResults.length) {
    console.warn('[searchUserExercises] Some returned exercises were not in user\'s exercise list');
  }

  return validResults as Exercise[];
}
