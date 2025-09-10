import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const workoutId = req.query.id;
  
  if (!workoutId) {
    return res.status(400).json({ error: 'Workout ID is required' });
  }

  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        created_at,
        duration_seconds,
        user_id,
        users!inner(name)
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      // Return a default image for missing workouts
      const html = generateOGImageHTML({
        workoutName: 'Workout Not Found',
        ownerName: 'SwiperFit',
        exerciseCount: 0,
        setCount: 0,
        date: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        duration: null
      });

      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
      return res.status(200).send(html);
    }

    // Fetch workout exercises and sets
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        exercises!inner(name)
      `)
      .eq('workout_id', workoutId);

    if (exercisesError) {
      console.error('Error fetching workout exercises:', exercisesError);
    }

    // Fetch sets for this workout
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, reps, weight')
      .eq('workout_id', workoutId);

    if (setsError) {
      console.error('Error fetching sets:', setsError);
    }

    // Calculate stats
    const exerciseCount = workoutExercises?.length || 0;
    const setCount = sets?.length || 0;
    const duration = workout.duration_seconds ? Math.round(workout.duration_seconds / 60) : null;
    const date = new Date(workout.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Generate HTML for the image
    const html = generateOGImageHTML({
      workoutName: workout.workout_name || 'Workout',
      ownerName: workout.users?.name || 'User',
      exerciseCount,
      setCount,
      date,
      duration
    });

    // Set headers for HTML response
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a fallback image on error
    const html = generateOGImageHTML({
      workoutName: 'Error Loading Workout',
      ownerName: 'SwiperFit',
      exerciseCount: 0,
      setCount: 0,
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      duration: null
    });

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    return res.status(200).send(html);
  }
}

// Generate HTML for Open Graph images
function generateOGImageHTML({ workoutName, ownerName, exerciseCount, setCount, date, duration }) {
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
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .container {
      width: 1000px;
      height: 500px;
      background: white;
      border-radius: 20px;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    
    .header {
      text-align: center;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: #059669;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
    }
    
    .title {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      line-height: 1.1;
    }
    
    .subtitle {
      font-size: 24px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 40px 0;
    }
    
    .stat {
      text-align: center;
      flex: 1;
    }
    
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #059669;
      display: block;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 18px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .date {
      font-size: 20px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .brand {
      font-size: 20px;
      color: #059669;
      font-weight: 600;
    }
    
    .duration {
      font-size: 20px;
      color: #6b7280;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">S</div>
      <h1 class="title">${workoutName}</h1>
      <p class="subtitle">by ${ownerName}</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <span class="stat-number">${exerciseCount}</span>
        <span class="stat-label">Exercises</span>
      </div>
      <div class="stat">
        <span class="stat-number">${setCount}</span>
        <span class="stat-label">Sets</span>
      </div>
      ${duration ? `
      <div class="stat">
        <span class="stat-number">${duration}</span>
        <span class="stat-label">Minutes</span>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <span class="date">${date}</span>
      <span class="brand">SwiperFit</span>
      ${duration ? `<span class="duration">${duration} min</span>` : ''}
    </div>
  </div>
</body>
</html>`;
}
