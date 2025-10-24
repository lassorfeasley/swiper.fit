import { getSupabaseServerClient } from '../server/supabase.js';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const { type, routineId } = req.query;
  
  if (type !== 'routine' || !routineId) {
    return res.status(400).send('Missing required parameters');
  }

  try {
    // Fetch routine and visibility
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`id, routine_name, is_public, user_id, created_by, shared_by`)
      .eq('id', routineId)
      .single();

    if (routineError || !routine || !routine.is_public) {
      return res.status(404).json({ error: 'Routine not found or not public' });
    }

    // Fetch minimal exercise/set counts
    const { data: routineExercises, error: rxErr } = await supabase
      .from('routine_exercises')
      .select('id')
      .eq('routine_id', routineId);
    if (rxErr) {
      throw rxErr;
    }

    let routineSets = [];
    const routineExerciseIds = (routineExercises || []).map(r => r.id);
    if (routineExerciseIds.length > 0) {
      const rsResp = await supabase
        .from('routine_sets')
        .select('id')
        .in('routine_exercise_id', routineExerciseIds);
      if (rsResp.error) {
        throw rsResp.error;
      }
      routineSets = rsResp.data || [];
    }

    const exerciseCount = (routineExercises || []).length;
    const setCount = (routineSets || []).length;

    // Return simple text response for now
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(`Routine: ${routine.routine_name}, Exercises: ${exerciseCount}, Sets: ${setCount}`);
    
  } catch (error) {
    console.error('Error generating routine OG:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
