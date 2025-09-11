export const config = { runtime: 'edge' };
import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const workoutId = searchParams.get('workoutId');
  if (!workoutId) {
    return new Response(JSON.stringify({ error: 'Workout ID is required' }), { status: 400 });
  }

  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        user_id,
        workout_name,
        duration_seconds,
        completed_at,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return new Response(JSON.stringify({ error: 'Workout not found' }), { status: 404 });
    }

    const { count: exerciseCount = 0 } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('workout_id', workoutId);
    const { count: setCount = 0 } = await supabase
      .from('sets')
      .select('id', { count: 'exact', head: true })
      .eq('workout_id', workoutId);

    const durationSeconds = workout.duration_seconds || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : (minutes > 0 ? `${minutes}m` : '');
    const completedDate = new Date(workout.completed_at || new Date());
    const date = completedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

    const image = new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 60px', backgroundColor: 'white' }}>
            <div style={{ fontSize: '30px', fontWeight: '700', color: '#737373', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{workout.routines?.routine_name || 'Workout'}</div>
            <div style={{ fontSize: '30px', fontWeight: '700', color: '#737373', letterSpacing: '1.2px', textTransform: 'uppercase' }}>{date}</div>
          </div>
          <div style={{ position: 'absolute', left: '60px', right: '60px', top: '180px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
            <div style={{ fontSize: '68px', fontWeight: '700', color: '#171717', lineHeight: '75px', wordBreak: 'break-word' }}>{displayWorkoutName}</div>
          </div>
          <div style={{ position: 'absolute', bottom: '60px', left: '60px', display: 'flex', gap: '20px' }}>
            {duration && (<div style={{ minWidth: '140px', height: '68px', backgroundColor: '#FAFAFA', border: '2px solid #D4D4D4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontSize: '30px', fontWeight: '300', color: '#404040', textTransform: 'uppercase' }}>{duration}</div>)}
            <div style={{ minWidth: '200px', height: '68px', backgroundColor: '#FAFAFA', border: '2px solid #D4D4D4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontSize: '30px', fontWeight: '300', color: '#404040', textTransform: 'uppercase' }}>{exerciseCount} EXERCISES</div>
            <div style={{ minWidth: '140px', height: '68px', backgroundColor: '#FAFAFA', border: '2px solid #D4D4D4', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 28px', fontSize: '30px', fontWeight: '300', color: '#404040', textTransform: 'uppercase' }}>{setCount} SETS</div>
          </div>
          <div style={{ position: 'absolute', right: '60px', top: '50%', transform: 'translateY(-50%)', width: '320px', height: '251px', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="320" height="251" viewBox="0 0 320 251" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M320 39.8487L110.663 251L0 148.673L36.1637 107.801L109.058 175.204L282.151 0.6185L320 39.8487Z" fill="#22C55E" />
            </svg>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
    return image;
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate image', details: error.message }), { status: 500 });
  }
}
