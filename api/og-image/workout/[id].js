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

    // Set headers for HTML response (social media crawlers will render this)
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

// Generate SVG for Open Graph images (better compatibility with social media crawlers)
function generateOGImageHTML({ workoutName, ownerName, exerciseCount, setCount, date, duration }) {
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  
  <!-- Main container -->
  <rect x="100" y="65" width="1000" height="500" rx="20" fill="white" stroke="none"/>
  
  <!-- Logo -->
  <rect x="570" y="120" width="60" height="60" rx="12" fill="#059669"/>
  <text x="600" y="155" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">S</text>
  
  <!-- Title -->
  <text x="600" y="250" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif" font-size="48" font-weight="700">${workoutName}</text>
  
  <!-- Subtitle -->
  <text x="600" y="290" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="24" font-weight="500">by ${ownerName}</text>
  
  <!-- Stats -->
  <g transform="translate(300, 350)">
    <!-- Exercise count -->
    <text x="0" y="0" text-anchor="middle" fill="#059669" font-family="Arial, sans-serif" font-size="36" font-weight="700">${exerciseCount}</text>
    <text x="0" y="30" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="18" font-weight="500">Exercises</text>
    
    <!-- Set count -->
    <text x="300" y="0" text-anchor="middle" fill="#059669" font-family="Arial, sans-serif" font-size="36" font-weight="700">${setCount}</text>
    <text x="300" y="30" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="18" font-weight="500">Sets</text>
    
    ${duration ? `
    <!-- Duration -->
    <text x="600" y="0" text-anchor="middle" fill="#059669" font-family="Arial, sans-serif" font-size="36" font-weight="700">${duration}</text>
    <text x="600" y="30" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="18" font-weight="500">Minutes</text>
    ` : ''}
  </g>
  
  <!-- Footer -->
  <line x1="160" y1="520" x2="1040" y2="520" stroke="#f3f4f6" stroke-width="2"/>
  
  <!-- Date -->
  <text x="160" y="550" fill="#6b7280" font-family="Arial, sans-serif" font-size="20" font-weight="500">${date}</text>
  
  <!-- Brand -->
  <text x="600" y="550" text-anchor="middle" fill="#059669" font-family="Arial, sans-serif" font-size="20" font-weight="600">SwiperFit</text>
  
  ${duration ? `
  <!-- Duration in footer -->
  <text x="1040" y="550" text-anchor="end" fill="#6b7280" font-family="Arial, sans-serif" font-size="20" font-weight="500">${duration} min</text>
  ` : ''}
</svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workout Preview</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 1200px;
      height: 630px;
      overflow: hidden;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  ${svg}
</body>
</html>`;
}
