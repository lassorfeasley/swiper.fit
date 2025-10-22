import { getSupabaseServerClient } from '../server/supabase.js';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  try {
    // Test 1: Try to access routines table with service role
    console.log('Testing routines table access...');
    
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('id, routine_name, is_public')
      .limit(1);

    if (routinesError) {
      console.error('Routines table error:', routinesError);
      return res.status(500).json({ 
        error: 'Routines table access failed',
        details: routinesError.message,
        code: routinesError.code,
        hint: routinesError.hint
      });
    }

    // Test 2: Try to access a specific routine
    const testRoutineId = '3052b593-6dc6-49d8-a512-5ba50a3b42e0';
    console.log('Testing specific routine access...');
    
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id, routine_name, is_public, user_id')
      .eq('id', testRoutineId)
      .single();

    if (routineError) {
      console.error('Specific routine error:', routineError);
      return res.status(500).json({ 
        error: 'Specific routine access failed',
        details: routineError.message,
        code: routineError.code,
        hint: routineError.hint,
        routinesTableWorking: !!routines
      });
    }

    return res.status(200).json({
      success: true,
      message: 'All tests passed',
      routinesTableWorking: !!routines,
      specificRoutineFound: !!routine,
      routine: routine ? {
        id: routine.id,
        name: routine.routine_name,
        isPublic: routine.is_public,
        userId: routine.user_id
      } : null
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ 
      error: 'Server error', 
      details: err.message 
    });
  }
}
