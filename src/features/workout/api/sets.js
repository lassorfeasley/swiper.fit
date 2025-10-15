import { supabase } from '@/supabaseClient';

export async function fetchRoutineTemplateSets(routineId) {
  const { data, error } = await supabase
    .from('routine_exercises')
    .select(`
      exercise_id,
      routine_sets!fk_routine_sets__routine_exercises(
        id,
        set_order,
        reps,
        weight,
        weight_unit,
        set_variant,
        set_type,
        timed_set_duration
      )
    `)
    .eq('routine_id', routineId)
    .order('set_order', { foreignTable: 'routine_sets', ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchSavedSets(workoutId) {
  const { data, error } = await supabase
    .from('sets')
    .select('*')
    .eq('workout_id', workoutId);
  if (error) throw error;
  return data || [];
}

export async function upsertCompleteSet(payload) {
  if (payload.id && !String(payload.id).startsWith('temp-')) {
    const { data, error } = await supabase
      .from('sets')
      .update({ ...payload, status: 'complete' })
      .eq('id', payload.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from('sets')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}


