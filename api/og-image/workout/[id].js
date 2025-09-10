import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  const workoutId = req.query.id || '6385499d-a9f2-4161-b6bb-1b90256d605c';
  
  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        *,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .eq('is_public', true)
      .single();

    if (workoutError || !workout) {
      return res.status(404).send('Workout not found');
    }

    // Fetch completed sets
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('exercise_id, reps, weight, weight_unit, set_type, timed_set_duration')
      .eq('workout_id', workoutId)
      .eq('status', 'complete');

    if (setsError) {
      console.error('Error fetching sets:', setsError);
    }

    // Fetch owner profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', workout.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    // Calculate metrics
    const validSets = (sets || []).filter(set => {
      if (set.set_type === 'timed') {
        return typeof set.timed_set_duration === 'number' && set.timed_set_duration > 0;
      }
      return typeof set.reps === 'number' && set.reps > 0;
    });

    const exerciseCount = new Set(validSets.map(s => s.exercise_id)).size;
    const setCount = validSets.length;
    const ownerName = profile ? 
      `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User' : 
      'User';

    // Format date
    const date = new Date(workout.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });

    // Format duration
    const formatDuration = (seconds) => {
      if (!seconds) return '';
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (minutes > 0) {
        return `${minutes}m`;
      }
      return '';
    };

    const duration = workout.duration_seconds ? formatDuration(workout.duration_seconds) : '';

    // Generate SVG
    const svg = generateSVG({
      routineName: workout.routines?.routine_name || 'Workout',
      workoutName: workout.workout_name,
      ownerName,
      date,
      duration,
      exerciseCount,
      setCount
    });

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(svg);

  } catch (error) {
    console.error('Error generating SVG:', error);
    return res.status(500).send('Error generating image');
  }
}

function generateSVG({ routineName, workoutName, ownerName, date, duration, exerciseCount, setCount }) {
  // Escape text for SVG
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
<defs>
<font-face font-family="Be Vietnam Pro" font-weight="300" font-style="normal"/>
<font-face font-family="Be Vietnam Pro" font-weight="700" font-style="normal"/>
</defs>

<!-- White background -->
<rect width="1200" height="630" fill="white"/>

<!-- Main content container -->
<g transform="translate(60, 60)">
  
  <!-- Top bar -->
  <g transform="translate(0, 0)">
    <!-- Routine name -->
    <text x="0" y="30" fill="#737373" font-family="Be Vietnam Pro" font-size="30" font-weight="700" text-transform="uppercase" letter-spacing="1.2px">${escape(routineName.toUpperCase())}</text>
    
    <!-- Date -->
    <text x="1080" y="30" text-anchor="end" fill="#737373" font-family="Be Vietnam Pro" font-size="30" font-weight="700" text-transform="uppercase" letter-spacing="1.2px">${escape(date.toUpperCase())}</text>
  </g>
  
  <!-- Workout name (centered) -->
  <text x="540" y="300" text-anchor="middle" fill="#171717" font-family="Be Vietnam Pro" font-size="80" font-weight="700" line-height="90px">${escape(workoutName)}</text>
  
  <!-- Bottom bar -->
  <g transform="translate(0, 442)">
    
    <!-- Metrics container -->
    <g transform="translate(0, 0)">
      
      ${duration ? `<!-- Duration box -->
      <rect x="0" y="0" width="140" height="68" rx="10" fill="#FAFAFA" stroke="#D4D4D4" stroke-width="2"/>
      <text x="70" y="44" text-anchor="middle" fill="#404040" font-family="Be Vietnam Pro" font-size="30" font-weight="300" text-transform="uppercase" letter-spacing="1.2px">${escape(duration)}</text>` : ''}
      
      <!-- Total exercises box -->
      <rect x="${duration ? '160' : '0'}" y="0" width="200" height="68" rx="10" fill="#FAFAFA" stroke="#D4D4D4" stroke-width="2"/>
      <text x="${duration ? '260' : '100'}" y="44" text-anchor="middle" fill="#404040" font-family="Be Vietnam Pro" font-size="30" font-weight="300" text-transform="uppercase" letter-spacing="1.2px">${exerciseCount} EXERCISES</text>
      
      <!-- Total sets box -->
      <rect x="${duration ? '380' : '220'}" y="0" width="140" height="68" rx="10" fill="#FAFAFA" stroke="#D4D4D4" stroke-width="2"/>
      <text x="${duration ? '450' : '290'}" y="44" text-anchor="middle" fill="#404040" font-family="Be Vietnam Pro" font-size="30" font-weight="300" text-transform="uppercase" letter-spacing="1.2px">${setCount} SETS</text>
      
    </g>
    
    <!-- Large green checkmark -->
    <rect x="760" y="-182.38" width="320" height="250.38" fill="#22C55E"/>
    
  </g>
  
</g>
</svg>`;
}