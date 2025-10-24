import { getSupabaseServerClient } from '../server/supabase.js';
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

  // Handle legacy og-image endpoint (redirect to og-images)
  if (!type && workoutId) {
    return res.redirect(302, `/api/og-images?type=workout&workoutId=${workoutId}`);
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
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      type,
      workoutId,
      routineId,
      userId
    });
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

    console.log('Generating routine OG image for:', routineId, routine.routine_name);
    
    // For now, redirect to default OG image until we fix the JSX issue
    // TODO: Implement proper routine OG image generation
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    const host = `https://${req.headers.host}`;
    return res.redirect(302, `${host}/images/default-open-graph.png`);
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

    // For now, redirect to default OG image until we fix the JSX issue
    // TODO: Implement proper user history OG image generation
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    const host = `https://${req.headers.host}`;
    return res.redirect(302, `${host}/images/default-open-graph.png`);
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
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/api/og-images?type=routine&routineId=${routineId}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/api/og-images?type=routine&routineId=${routineId}" />
    
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      h1 {
        color: #1a1a1a;
        margin-bottom: 20px;
      }
      .stats {
        display: flex;
        gap: 40px;
        margin: 30px 0;
      }
      .stat {
        text-align: center;
      }
      .stat-number {
        font-size: 2em;
        font-weight: bold;
        color: #2563eb;
      }
      .stat-label {
        color: #666;
        font-size: 0.9em;
      }
      .owner {
        color: #666;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${routineName}</h1>
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${exerciseCount}</div>
          <div class="stat-label">Exercise${exerciseCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat">
          <div class="stat-number">${setCount}</div>
          <div class="stat-label">Set${setCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
      ${ownerName ? `<div class="owner">Shared by ${ownerName}</div>` : ''}
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
    <title>${title}</title>
    <meta name="description" content="${description}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${ogImage}" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${ogImage}" />
    
    <style>
      body {
        font-family: system-ui, -apple-system, sans-serif;
        margin: 0;
        padding: 20px;
        background: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        padding: 40px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      h1 {
        color: #1a1a1a;
        margin-bottom: 20px;
      }
      .stats {
        display: flex;
        gap: 40px;
        margin: 30px 0;
      }
      .stat {
        text-align: center;
      }
      .stat-number {
        font-size: 2em;
        font-weight: bold;
        color: #2563eb;
      }
      .stat-label {
        color: #666;
        font-size: 0.9em;
      }
      .details {
        color: #666;
        margin-top: 20px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${workoutName}</h1>
      <div class="stats">
        <div class="stat">
          <div class="stat-number">${exerciseCount}</div>
          <div class="stat-label">Exercise${exerciseCount !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat">
          <div class="stat-number">${setCount}</div>
          <div class="stat-label">Set${setCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div class="details">
        <div>Completed by ${ownerName}</div>
        <div>Date: ${date}</div>
        ${duration ? `<div>Duration: ${duration}</div>` : ''}
      </div>
    </div>
  </body>
</html>`;
}