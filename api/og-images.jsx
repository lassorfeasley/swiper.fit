import { getSupabaseServerClient } from '../server/supabase.js';
import { ImageResponse } from '@vercel/og';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const { type, workoutId, routineId, userId } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    switch (type) {
      case 'workout':
        return await handleWorkoutOG(req, res, workoutId);
      case 'routine':
        return await handleRoutineOG(req, res, routineId, userAgent);
      case 'static-workout':
        return await handleStaticWorkoutOG(req, res);
      case 'user-history':
        return await handleUserHistoryOG(req, res, userId);
      default:
        // Default to workout OG for backward compatibility
        return await handleWorkoutOG(req, res, workoutId);
    }
  } catch (error) {
    console.error('Error in consolidated OG handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// WORKOUT OG IMAGE HANDLER
// ============================================================================
async function handleWorkoutOG(req, res, workoutId) {
  const defaultWorkoutId = '6385499d-a9f2-4161-b6bb-1b90256d605c';
  const targetWorkoutId = workoutId || defaultWorkoutId;
  
  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`og_image_url`)
      .eq('id', targetWorkoutId)
      .single();

    if (workoutError || !workout) {
      return res.status(404).send('Workout not found');
    }

    // If workout has an OG image URL, redirect to it (client-generated)
    if (workout.og_image_url) {
      // Short cache to mitigate CDN sticky caches while we roll out new images
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
      return res.redirect(302, workout.og_image_url);
    }

    // Fallback to a static default site-wide image
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    const host = `https://${req.headers.host}`;
    return res.redirect(302, `${host}/images/default-open-graph.png`);

  } catch (error) {
    console.error('Error in workout OG handler:', error);
    return res.status(500).send('Error generating image');
  }
}

// ============================================================================
// ROUTINE OG IMAGE HANDLER
// ============================================================================
async function handleRoutineOG(req, res, routineId, userAgent) {
  if (!routineId) {
    return res.status(400).send('Missing required routineId');
  }

  // Set caching headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', 'image/png');

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

    // Owner name - only show "SHARED BY" if shared_by is different from created_by
    let ownerName = '';
    if (routine.shared_by && routine.shared_by !== routine.created_by) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', routine.shared_by)
        .single();
      if (owner) {
        ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
      }
    }

    const exerciseCount = (routineExercises || []).length;
    const setCount = (routineSets || []).length;

    // Generate OG image using Vercel's ImageResponse
    console.log('Generating routine OG image for:', routineId, routine.routine_name);
    
    // Test with a simple response first - updated
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(`Routine: ${routine.routine_name}, Exercises: ${exerciseCount}, Sets: ${setCount} - Updated`);
  } catch (error) {
    console.error('Error generating routine OG image:', error);
    console.error('Error details:', {
      routineId,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}

// ============================================================================
// STATIC WORKOUT OG HANDLER
// ============================================================================
async function handleStaticWorkoutOG(req, res) {
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
    const url = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/history/public/workout/${workoutId}`;
    const ogImage = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/api/og-images?type=workout&workoutId=${workoutId}`;

    // Generate HTML
    const html = generateStaticWorkoutHTML({
      title,
      description,
      url,
      workoutName: workout.workout_name,
      ownerName,
      exerciseCount,
      setCount,
      date,
      duration,
      ogImage
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

// ============================================================================
// USER HISTORY OG HANDLER
// ============================================================================
async function handleUserHistoryOG(req, res, userId) {
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Set caching headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', 'image/png');

  try {
    // Fetch public profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, share_all_workouts')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respect privacy
    if (!profile.share_all_workouts) {
      return res.status(403).json({ error: 'User history is not public' });
    }

    const ownerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

    // Generate OG image using Vercel's ImageResponse
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
            {/* Workout history label */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              WORKOUT HISTORY
            </div>
            
            {/* User name */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              {ownerName.toUpperCase()}
            </div>
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: '700',
              color: '#171717',
              letterSpacing: '0px',
              textAlign: 'center',
              marginTop: '60px',
              marginBottom: '60px',
            }}
          >
            Fitness Journey
          </div>

          {/* Stats boxes */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {/* Workouts completed box */}
            <div
              style={{
                width: '200px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              WORKOUTS
            </div>
            
            {/* Progress box */}
            <div
              style={{
                width: '200px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              PROGRESS
            </div>
          </div>

          {/* Purple chart icon */}
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              height: '250px',
              backgroundColor: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Chart icon SVG */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 100L40 80L60 60L80 40L100 20"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="20" cy="100" r="6" fill="white" />
              <circle cx="40" cy="80" r="6" fill="white" />
              <circle cx="60" cy="60" r="6" fill="white" />
              <circle cx="80" cy="40" r="6" fill="white" />
              <circle cx="100" cy="20" r="6" fill="white" />
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
    console.error('Error generating user history OG image:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}

// ============================================================================
// HTML GENERATORS
// ============================================================================

function generateRoutineHTML({ title, description, url, routineName, ownerName, exerciseCount, setCount, routineId }) {
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
    <meta property="og:site_name" content="SwiperFit" />
    <meta property="og:image" content="https://www.swiper.fit/api/og-images?type=routine&routineId=${routineId}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://www.swiper.fit/api/og-images?type=routine&routineId=${routineId}" />
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/images/swiper-fav-icon.png" />
    <link rel="shortcut icon" type="image/png" href="/images/swiper-fav-icon.png" />
    <link rel="apple-touch-icon" href="/images/swiper-fav-icon.png" />
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    
    <style>
      body { font-family: 'Be Vietnam Pro', sans-serif; margin: 0; padding: 40px 20px; background: #f8fafc; color: #374151; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .header { text-align: center; margin-bottom: 32px; }
      .title { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 8px; }
      .subtitle { font-size: 18px; color: #6b7280; margin-bottom: 24px; }
      .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 32px; }
      .stat { text-align: center; padding: 16px; background: #f9fafb; border-radius: 8px; }
      .stat-number { font-size: 24px; font-weight: 600; color: #059669; display: block; }
      .stat-label { font-size: 14px; color: #6b7280; margin-top: 4px; }
      .cta { text-align: center; margin-top: 32px; }
      .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; transition: background 0.2s; }
      .button:hover { background: #047857; }
      .branding { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="title">${title}</h1>
        <p class="subtitle">${description}</p>
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
      </div>
      <div class="cta">
        <a href="/app/routines/public/${routineId}" class="button">Open in App</a>
      </div>
      <div class="branding">
        <p>Powered by SwiperFit</p>
      </div>
    </div>
  </body>
</html>`;
}

function generateStaticWorkoutHTML({ title, description, url, workoutName, ownerName, exerciseCount, setCount, date, duration, ogImage }) {
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
    <meta property="og:site_name" content="SwiperFit" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${ogImage}" />
    
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
        window.location.href = '/history/public/workout/${workoutName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}?redirect=' + encodeURIComponent(window.location.pathname);
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
