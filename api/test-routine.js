import { getSupabaseServerClient } from '../../server/supabase.js';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const routineId = req.query.routineId;
  
  if (!routineId) {
    return res.status(400).json({ error: 'Missing required routineId' });
  }

  try {
    // Test if we can access the routines table at all
    const { data: routine, error } = await supabase
      .from('routines')
      .select('id, routine_name, is_public')
      .eq('id', routineId)
      .single();

    if (error) {
      return res.status(500).json({ 
        error: 'Database error', 
        details: error.message,
        code: error.code 
      });
    }

    if (!routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    return res.status(200).json({
      success: true,
      routine: {
        id: routine.id,
        name: routine.routine_name,
        isPublic: routine.is_public
      }
    });
  } catch (err) {
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
}
