import { getSupabaseServerClient } from '../server/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';

// Consolidated public page handler for routines and workouts
export default async function handler(req, res) {
  try {
    const supabase = getSupabaseServerClient();
    const { type, id } = req.query;
    const userAgent = req.headers['user-agent'] || '';

    // Check if this is a crawler/bot
    const isBot = /bot|crawl|slurp|spider|facebook|whatsapp|twitter|telegram|skype|slack|discord|imessage|linkedin|postinspector|linkedinbot|orcascan|opengraph|og|meta|validator/i.test(userAgent);

    // Log for debugging
    console.log('[public-page]', {
      type,
      id,
      isBot,
      userAgent: userAgent.substring(0, 100) // Truncate for readability
    });

    // Route to appropriate handler
    if (type === 'routine') {
      return await handleRoutinePage(req, res, id, isBot, userAgent, supabase);
    } else if (type === 'workout') {
      return await handleWorkoutPage(req, res, id, isBot, userAgent, supabase);
    } else {
      return res.status(400).send('Invalid type parameter. Use type=routine or type=workout');
    }
  } catch (error) {
    console.error('Error in public-page handler:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
}

// ============================================================================
// ROUTINE PUBLIC PAGE HANDLER
// ============================================================================
async function handleRoutinePage(req, res, routineId, isBot, userAgent, supabase) {
  if (!routineId) {
    return res.status(400).send('Missing required routineId');
  }

  if (!isBot) {
    // Real user - serve the built SPA HTML
    try {
      const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
      const indexHtml = await fs.readFile(distIndexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(indexHtml);
    } catch (err) {
      console.error('Error reading built index.html:', err);
      return res.redirect(302, '/');
    }
  }

  // Bot/crawler - serve static HTML with OG tags
  try {
    // Fetch routine and visibility including OG image URL
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`id, routine_name, user_id, created_by, shared_by, og_image_url`)
      .eq('id', routineId)
      .single();

    if (routineError || !routine) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Routine Not Found - SwiperFit</title>
            <meta name="description" content="This routine was not found." />
          </head>
          <body>
            <h1>Routine Not Found</h1>
            <p>This routine was not found.</p>
          </body>
        </html>
      `);
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

    // Owner name
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

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
    const pageUrl = `${baseUrl}/routines/public/${routineId}`;
    
    const title = ownerName ? `${ownerName} shared a ${routine.routine_name} on Swiper` : `${routine.routine_name} on Swiper`;
    const description = `Swiper is the effortless way to log workouts`;
    
    // Use pre-generated OG image if available, otherwise use API endpoint
    const ogImageUrl = routine.og_image_url || `${baseUrl}/api/og-images?type=routine&routineId=${routineId}`;
    
    console.log('[public-page] Routine OG image:', {
      routineId,
      hasCustomImage: !!routine.og_image_url,
      ogImageUrl
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${pageUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImageUrl}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #1a1a1a;
      margin: 0 0 10px;
      font-size: 28px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .owner {
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${routine.routine_name}</h1>
    ${ownerName ? `<div class="owner">Shared by ${ownerName}</div>` : ''}
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
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error generating routine page:', error);
    return res.status(500).send('Internal server error');
  }
}

// ============================================================================
// WORKOUT PUBLIC PAGE HANDLER
// ============================================================================
async function handleWorkoutPage(req, res, workoutId, isBot, userAgent, supabase) {
  if (!workoutId) {
    return res.status(400).send('Missing required workoutId');
  }

  if (!isBot) {
    // Real user - serve the built SPA HTML so React Router can handle the route
    try {
      const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
      const indexHtml = await fs.readFile(distIndexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(indexHtml);
    } catch (err) {
      console.error('Error reading built index.html:', err);
      return res.redirect(302, '/');
    }
  }

  // Bot/crawler - serve static HTML with OG tags
  try {
    if (!workoutId) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Workout Not Found - SwiperFit</title>
            <meta name="description" content="Workout not found." />
          </head>
          <body>
            <h1>Workout Not Found</h1>
            <p>The requested workout could not be found.</p>
          </body>
        </html>
      `);
    }

    // Fetch workout data including OG image URL
    // Explicitly select fields to match routine query pattern (routines work, so match that style)
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        user_id,
        completed_at,
        is_active,
        og_image_url,
        duration_seconds,
        created_at,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .single();
    
    // Log OG image status for debugging
    if (workout) {
      console.log('[public-page] Workout OG image status:', {
        workoutId,
        hasOgImageUrl: !!workout.og_image_url,
        ogImageUrl: workout.og_image_url,
        workoutName: workout.workout_name,
        completedAt: workout.completed_at
      });
    }

    console.log('[public-page] Workout query result:', {
      workoutId,
      hasWorkout: !!workout,
      error: workoutError?.message,
      errorCode: workoutError?.code,
      errorDetails: workoutError?.details,
      errorHint: workoutError?.hint
    });

    if (workoutError || !workout) {
      console.error('[public-page] Workout not found:', {
        workoutId,
        error: workoutError
      });
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Workout Not Found - SwiperFit</title>
            <meta name="description" content="Workout not found." />
          </head>
          <body>
            <h1>Workout Not Found</h1>
            <p>The requested workout could not be found.</p>
          </body>
        </html>
      `);
    }

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
    const pageUrl = `${baseUrl}/history/public/workout/${workoutId}`;
    
    // Fetch owner name from profiles
    let ownerName = 'A user';
    if (workout.user_id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workout.user_id)
          .maybeSingle();
        if (profile) {
          const first = profile.first_name || '';
          const last = profile.last_name || '';
          ownerName = `${first} ${last}`.trim() || 'A user';
        }
      } catch (err) {
        console.warn('[public-page] Error fetching profile:', err);
      }
    }
    
    const routineName = workout.routines?.routine_name || 'Workout';

    const title = `${ownerName} completed a ${workout.workout_name || routineName} on Swiper`;
    const description = `Swiper is the effortless way to log workouts`;
    
    // Use pre-generated OG image if available, otherwise use API endpoint
    // IMPORTANT: Always use the direct image URL when available (not the API endpoint)
    // This ensures better caching and avoids redirect chains
    const ogImage = workout.og_image_url 
      ? workout.og_image_url  // Direct URL to the image
      : `${baseUrl}/api/og-images?type=workout&workoutId=${workoutId}`;  // API endpoint that will redirect
    
    console.log('[public-page] Workout OG image:', {
      workoutId,
      hasCustomImage: !!workout.og_image_url,
      ogImageUrl: workout.og_image_url,
      ogImage,
      usingDirectUrl: !!workout.og_image_url,
      usingApiEndpoint: !workout.og_image_url,
      needsGeneration: !workout.og_image_url && workout.completed_at && workout.is_active === false
    });

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${pageUrl}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${ogImage}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #1a1a1a;
      margin: 0 0 10px;
      font-size: 28px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin: 20px 0;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
    }
    .owner {
      color: #666;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${workout.workout_name || routineName}</h1>
    <div class="owner">Completed by ${ownerName}</div>
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
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error generating workout page:', error);
    return res.status(500).send('Internal server error');
  }
}
