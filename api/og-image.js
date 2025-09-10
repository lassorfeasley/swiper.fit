import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  const workoutId = req.query.workoutId || '6385499d-a9f2-4161-b6bb-1b90256d605c';
  
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

    // For now, redirect to static image to test compatibility
    res.redirect(302, '/images/og-workout-default.svg');

  } catch (error) {
    console.error('Error generating SVG:', error);
    return res.status(500).send('Error generating image');
  }
}

function generateHTMLImage({ routineName, workoutName, ownerName, date, duration, exerciseCount, setCount }) {
  // Escape text for HTML
  const escape = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workout Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1200px;
      height: 630px;
      background: white;
      font-family: Arial, sans-serif;
      overflow: hidden;
    }
    
    .container {
      width: 1080px;
      height: 510px;
      margin: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .routine-name, .date {
      color: #737373;
      font-size: 30px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }
    
    .workout-name {
      text-align: center;
      color: #171717;
      font-size: 80px;
      font-weight: 700;
      line-height: 90px;
    }
    
    .bottom-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 68px;
    }
    
    .metrics {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .metric-box {
      padding: 20px;
      background: #FAFAFA;
      border-radius: 10px;
      border: 2px solid #D4D4D4;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .metric-text {
      color: #404040;
      font-size: 30px;
      font-weight: 300;
      text-transform: uppercase;
      letter-spacing: 1.2px;
    }
    
    .duration-box {
      width: 140px;
      height: 68px;
    }
    
    .exercises-box {
      width: 200px;
      height: 68px;
    }
    
    .sets-box {
      width: 140px;
      height: 68px;
    }
    
    .checkmark {
      width: 320px;
      height: 250.38px;
      background: #22C55E;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="top-bar">
      <div class="routine-name">${escape(routineName.toUpperCase())}</div>
      <div class="date">${escape(date.toUpperCase())}</div>
    </div>
    
    <div class="workout-name">${escape(workoutName)}</div>
    
    <div class="bottom-bar">
      <div class="metrics">
        ${duration ? `<div class="metric-box duration-box">
          <div class="metric-text">${escape(duration)}</div>
        </div>` : ''}
        
        <div class="metric-box exercises-box">
          <div class="metric-text">${exerciseCount} EXERCISES</div>
        </div>
        
        <div class="metric-box sets-box">
          <div class="metric-text">${setCount} SETS</div>
        </div>
      </div>
      
      <div class="checkmark"></div>
    </div>
  </div>
</body>
</html>`;
}