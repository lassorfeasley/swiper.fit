import { supabase } from '@/supabaseClient';

export async function fetchWorkoutExercises(workoutId) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      id,
      exercise_id,
      exercise_order,
      snapshot_name,
      name_override,
      section_override,
      exercises(name, section)
    `)
    .eq('workout_id', workoutId)
    .order('exercise_order', { ascending: true });
  if (error) throw error;
  return data || [];
}


