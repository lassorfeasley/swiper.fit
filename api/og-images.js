import { getSupabaseServerClient } from '../server/supabase.js';

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
  if (!workoutId) {
    console.log('[OG] No workoutId provided, using default image');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
    return res.status(302).end();
  }

  console.log('[OG] Handling workout OG image request:', workoutId);

  try {
    const supabase = getSupabaseServerClient();
    const { data: workout, error } = await supabase
      .from('workouts')
      .select('og_image_url, workout_name, completed_at, is_active')
      .eq('id', workoutId)
      .single();

    console.log('[OG] Workout query result:', {
      workoutId,
      hasWorkout: !!workout,
      hasOgImageUrl: !!workout?.og_image_url,
      ogImageUrl: workout?.og_image_url,
      workoutName: workout?.workout_name,
      completedAt: workout?.completed_at,
      isActive: workout?.is_active,
      error: error?.message,
      errorCode: error?.code
    });

    if (!error && workout?.og_image_url) {
      console.log('[OG] ✅ Found custom image for workout:', workoutId, workout.og_image_url);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.setHeader('Location', workout.og_image_url);
      return res.status(302).end();
    } else {
      console.log('[OG] ❌ No custom image for workout:', workoutId, {
        error: error?.message,
        errorCode: error?.code,
        workoutExists: !!workout,
        hasOgImageUrl: !!workout?.og_image_url
      });
    }
  } catch (error) {
    console.error('[OG] Error fetching workout OG image:', error);
  }

  // Fallback to default
  console.log('[OG] ⚠️ Using default image for workout:', workoutId);
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}

// ============================================================================
// ROUTINE OG IMAGE HANDLER
// ============================================================================
async function handleRoutineOG(req, res, routineId, userAgent) {
  if (!routineId) {
    console.log('[OG] No routineId provided, using default image');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
    return res.status(302).end();
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data: routine, error } = await supabase
      .from('routines')
      .select('og_image_url')
      .eq('id', routineId)
      .single();

    if (!error && routine?.og_image_url) {
      console.log('[OG] Found custom image for routine:', routineId, routine.og_image_url);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
      res.setHeader('Location', routine.og_image_url);
      return res.status(302).end();
    } else {
      console.log('[OG] No custom image for routine:', routineId, 'error:', error?.message);
    }
  } catch (error) {
    console.error('[OG] Error fetching routine OG image:', error);
  }

  // Fallback to default
  console.log('[OG] Using default image for routine:', routineId);
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}

// ============================================================================
// STATIC WORKOUT OG HANDLER
// ============================================================================
async function handleStaticWorkoutOG(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

    return res.status(200).json({
      success: true,
    message: 'Static workout OG generation not implemented yet'
  });
}

// ============================================================================
// USER HISTORY OG HANDLER
// ============================================================================
async function handleUserHistoryOG(req, res, userId) {
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // For now, redirect to default OG image
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}