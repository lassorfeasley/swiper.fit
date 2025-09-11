import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  // CORS headers for local debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { workoutId } = req.query;
  
  if (!workoutId) {
    return res.status(400).json({ error: 'Workout ID is required' });
  }

  // Set caching headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', 'image/png');

  try {
    console.log('Generating OG image for workout:', workoutId);
    // Fetch workout data (public only here). Avoid deep joins to reduce RLS issues.
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        duration_seconds,
        completed_at,
        is_public,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .eq('is_public', true)
      .single();

    if (workoutError || !workout) {
      return res.status(404).json({ error: 'Workout not found or not public' });
    }

    // Exact counts using head:true to avoid selecting row data
    const { count: exerciseCount = 0, error: exErr } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    if (exErr) {
      console.warn('Exercise count error:', exErr);
    }

    const { count: setCount = 0, error: setErr } = await supabase
      .from('sets')
      .select('id', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    if (setErr) {
      console.warn('Set count error:', setErr);
    }
    
    // Format duration
    const durationSeconds = workout.duration_seconds || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : (minutes > 0 ? `${minutes}m` : '');

    // Format date
    const completedDate = new Date(workout.completed_at || new Date());
    const date = completedDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Owner possessive + workout title
    let ownerFirst = '';
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', workout.user_id)
        .single();
      const full = `${prof?.first_name || ''} ${prof?.last_name || ''}`.trim();
      ownerFirst = (full.split(' ')[0] || '').trim();
    } catch (_) {}
    const possessive = ownerFirst ? ownerFirst + (ownerFirst.toLowerCase().endsWith('s') ? "'" : "'s") + ' ' : '';
    const displayWorkoutName = `${possessive}${workout.workout_name || 'Completed Workout'}`;

    // Generate OG image using Vercel's ImageResponse (match client preview)
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 60px',
              backgroundColor: 'white',
            }}
          >
            {/* Routine name */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              {workout.routines?.routine_name || 'Workout'}
            </div>
            
            {/* Date */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              {date}
            </div>
          </div>

          {/* Main workout name left-aligned and wrapping */}
          <div
            style={{
              position: 'absolute',
              left: '60px',
              right: '60px',
              top: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '6px',
            }}
          >
            <div
              style={{
                fontSize: '68px',
                fontWeight: '700',
                color: '#171717',
                lineHeight: '75px',
                wordBreak: 'break-word',
              }}
            >
              {displayWorkoutName}
            </div>
          </div>

          {/* Metrics boxes */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {/* Duration box */}
            {duration && (
              <div
                style={{
                  minWidth: '140px',
                  height: '68px',
                  backgroundColor: '#FAFAFA',
                  border: '2px solid #D4D4D4',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 28px',
                  fontSize: '30px',
                  fontWeight: '300',
                  color: '#404040',
                  textTransform: 'uppercase',
                }}
              >
                {duration}
              </div>
            )}
            
            {/* Exercises box */}
            <div
              style={{
                minWidth: '200px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 28px',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                textTransform: 'uppercase',
              }}
            >
              {exerciseCount} EXERCISES
            </div>
            
            {/* Sets box */}
            <div
              style={{
                minWidth: '140px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 28px',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                textTransform: 'uppercase',
              }}
            >
              {setCount} SETS
            </div>
          </div>

          {/* Green checkmark SVG aligned with date */}
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              height: '251px',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="320" height="251" viewBox="0 0 320 251" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M320 39.8487L110.663 251L0 148.673L36.1637 107.801L109.058 175.204L282.151 0.6185L320 39.8487Z" fill="#22C55E" />
            </svg>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    console.error('Error stack:', error.stack);
    console.error('Workout ID:', workoutId);
    
    // Return a fallback error response
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      workoutId: workoutId,
      timestamp: new Date().toISOString()
    });
  }
}
