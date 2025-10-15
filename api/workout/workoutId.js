import { getSupabaseServerClient } from '../../server/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const workoutId = req.query.id || '3de533f8-7d05-47a9-ac1d-159268b509a4'; // fallback for testing
  const userAgent = req.headers['user-agent'] || '';
  const forceOG = req.query.og === 'true'; // Allow forcing OG mode for testing

  // Check if this is a crawler/bot or if OG mode is forced
  const isBot = /bot|crawl|slurp|spider|facebook|whatsapp|twitter|telegram|skype|slack|discord|imessage|linkedin|postinspector|linkedinbot|orcascan|opengraph|og|meta|validator/i.test(userAgent);

  if (!isBot && !forceOG) {
    // Real user - serve the built SPA HTML dynamically to always reference the correct hashed asset names
    try {
      const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
      const indexHtml = await fs.readFile(distIndexPath, 'utf8');
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(indexHtml);
    } catch (err) {
      console.error('Error reading built index.html:', err);
      // Fallback: redirect to root so Vercel will serve the SPA index.html via static routing
      return res.redirect(302, '/');
    }
  }

  // Bot/crawler - serve static HTML
  try {
    // Fetch workout data (same as generate-static-workout.js)
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
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Workout Not Found - SwiperFit</title>
            <meta name="description" content="This workout was not found or is not public." />
          </head>
          <body>
            <h1>Workout Not Found</h1>
            <p>This workout was not found or is not public.</p>
          </body>
        </html>
      `);
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

    // Format dates
    const publishedAt = new Date(workout.completed_at || workout.created_at || Date.now());
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
    const routinePhrase = workout?.routines?.routine_name || 'workout';
    const title = `${ownerName} completed a ${routinePhrase} workout on Swiper.fit`;
    const description = `${ownerName} completed ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} with ${setCount} set${setCount !== 1 ? 's' : ''}${duration ? ` over ${duration}` : ''} on ${date}.`;
    const url = `${req.headers.host}/history/public/workout/${workoutId}`;
    const host = `https://${req.headers.host}`;
    const ogImage = `${host}/api/og-image?workoutId=${workoutId}`;

    // Generate and serve HTML
    const html = generateHTML({
      title,
      description,
      url: `https://${url}`,
      workoutName: workout.workout_name,
      ownerName,
      exerciseCount,
      setCount,
      date,
      duration,
      workoutId,
      ogImage,
      publishedAt: publishedAt.toISOString()
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error serving static workout:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - SwiperFit</title>
        </head>
        <body>
          <h1>Error Loading Workout</h1>
          <p>There was an error loading this workout.</p>
        </body>
      </html>
    `);
  }
}

function generateHTML({ title, description, url, workoutName, ownerName, exerciseCount, setCount, date, duration, workoutId, ogImage, publishedAt }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Primary Meta Tags -->
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    <meta name="author" content="${ownerName}" />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:site_name" content="SwiperFit" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="article:author" content="${ownerName}" />
    <meta property="article:published_time" content="${publishedAt}" />
    <meta property="og:updated_time" content="${publishedAt}" />
    
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
      .branding {
        text-align: center;
        margin-top: 40px;
        padding-top: 24px;
        border-top: 1px solid #e5e7eb;
        color: #9ca3af;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="title">${title}</h1>
        <p class="subtitle">Log workouts effortlessly with Swiper.Fit</p>
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
          <div class="stat-label">${duration.includes('hour') ? (duration.includes('and') ? 'Hours+' : 'Hours') : 'Minutes'}</div>
        </div>` : ''}
      </div>
      
      <div class="cta">
        <a href="/app/history/public/workout/${workoutId}" class="button">
          Open in App
        </a>
        <p class="redirect-note">
          Click to see the complete interactive workout details
        </p>
      </div>
      
      <div class="branding">
        <p>Powered by SwiperFit</p>
      </div>
    </div>
  </body>
</html>`;
} 