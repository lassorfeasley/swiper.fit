import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workoutId } = req.body;

  if (!workoutId) {
    return res.status(400).json({ error: 'workoutId is required' });
  }

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
      return res.status(404).json({ error: 'Workout not found or not public' });
    }

    // Fetch completed sets
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('exercise_id, reps, weight, weight_unit, set_type, timed_set_duration')
      .eq('workout_id', workoutId)
      .eq('status', 'complete');

    if (setsError) {
      console.error('Error fetching sets:', setsError);
      return res.status(500).json({ error: 'Error fetching sets' });
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
        return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return 'a few minutes';
    };

    const duration = workout.duration_seconds ? formatDuration(workout.duration_seconds) : '';

    // Generate meta data
    const title = `${ownerName}'s ${workout.workout_name}`;
    const description = `${ownerName} completed ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} with ${setCount} set${setCount !== 1 ? 's' : ''}${duration ? ` over ${duration}` : ''} on ${date}.`;
    const url = `${process.env.VERCEL_URL || 'https://swiperfit.com'}/history/public/workout/${workoutId}`;

    // Generate HTML
    const html = generateHTML({
      title,
      description,
      url,
      workoutName: workout.workout_name,
      ownerName,
      exerciseCount,
      setCount,
      date,
      duration
    });

    // In a real implementation, you'd save this to a file system or CDN
    // For now, we'll return it and handle file writing in the trigger
    return res.status(200).json({
      success: true,
      html,
      metadata: {
        title,
        description,
        url,
        workoutId
      }
    });

  } catch (error) {
    console.error('Error generating static workout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function generateHTML({ title, description, url, workoutName, ownerName, exerciseCount, setCount, date, duration }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="https://swiper.fit/api/og-image/workout/${workoutId}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="SwiperFit" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://swiper.fit/api/og-image/workout/${workoutId}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    
    <style>
      body {
        font-family: 'Be Vietnam Pro', sans-serif;
        margin: 0;
        padding: 40px 20px;
        background: #f8fafc;
        color: #374151;
        line-height: 1.6;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 32px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 32px;
      }
      .title {
        font-size: 28px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
      }
      .subtitle {
        font-size: 18px;
        color: #6b7280;
        margin-bottom: 24px;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      }
      .stat {
        text-align: center;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      .stat-number {
        font-size: 24px;
        font-weight: 600;
        color: #059669;
        display: block;
      }
      .stat-label {
        font-size: 14px;
        color: #6b7280;
        margin-top: 4px;
      }
      .cta {
        text-align: center;
        margin-top: 32px;
      }
      .button {
        display: inline-block;
        background: #059669;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: background 0.2s;
      }
      .button:hover {
        background: #047857;
      }
      .redirect-note {
        margin-top: 16px;
        font-size: 14px;
        color: #6b7280;
      }
    </style>
    
    <!-- Auto-redirect to SPA for actual users -->
    <script>
      // Only redirect if this is a real user (not a crawler)
      if (navigator.userAgent && !navigator.userAgent.includes('bot') && !navigator.userAgent.includes('Bot')) {
        window.location.href = '/history/public/workout/${workoutName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}?redirect=${encodeURIComponent(window.location.pathname)}';
      }
    </script>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="title">${workoutName}</h1>
        <p class="subtitle">by ${ownerName} • ${date}</p>
      </div>
      
      <div class="stats">
        <div class="stat">
          <span class="stat-number">${exerciseCount}</span>
          <div class="stat-label">Exercise${exerciseCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat">
          <span class="stat-number">${setCount}</span>
          <div class="stat-label">Set${setCount !== 1 ? 's' : ''}</div>
        </div>
        ${duration ? `<div class="stat">
          <span class="stat-number">${duration.split(' ')[0]}</span>
          <div class="stat-label">${duration.includes('hour') ? 'Hours' : 'Minutes'}</div>
        </div>` : ''}
      </div>
      
      <div class="cta">
        <a href="/history/public/workout/${workoutName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}" class="button">
          View Full Workout
        </a>
        <p class="redirect-note">
          You'll be redirected to the interactive workout view
        </p>
      </div>
    </div>
  </body>
</html>`;
} 