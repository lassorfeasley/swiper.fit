import { getSupabaseServerClient } from '../../../../server/supabase.js';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const workoutId = req.query.workoutId;
  const userAgent = req.headers['user-agent'] || '';

  // Check if this is a crawler/bot
  const isBot = /bot|crawl|slurp|spider|facebook|whatsapp|twitter|telegram|skype|slack|discord|imessage|linkedin|postinspector|linkedinbot/i.test(userAgent);

  if (!isBot) {
    // Real user - redirect to the main app
    return res.redirect(302, '/');
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

    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        *,
        routines!workouts_routine_id_fkey(routine_name),
        accounts!workouts_user_id_fkey(full_name),
        workout_exercises(
          id,
          exercises(name)
        ),
        sets!sets_workout_id_fkey(id)
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
            <meta name="description" content="This workout is not public or was not found." />
          </head>
          <body>
            <h1>Workout Not Found</h1>
            <p>This workout is not public or was not found.</p>
          </body>
        </html>
      `);
    }

    // Calculate metrics
    const exerciseCount = workout.workout_exercises?.length || 0;
    const setCount = workout.sets?.length || 0;
    const ownerName = workout.accounts?.full_name || 'User';

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
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
    const pageUrl = `${baseUrl}/history/public/workout/${workoutId}`;
    const title = `${ownerName}'s ${workout.workout_name}`;
    const description = `${ownerName} completed ${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''} with ${setCount} set${setCount !== 1 ? 's' : ''}${duration ? ` over ${duration}` : ''} on ${date}.`;
    const ogImage = `${baseUrl}/api/og-image?workoutId=${workoutId}`;

    // Generate and serve HTML
    const html = generateHTML({
      title,
      description,
      url: pageUrl,
      workoutName: workout.workout_name,
      ownerName,
      exerciseCount,
      setCount,
      date,
      duration,
      workoutId,
      ogImage
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error serving workout OG:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error - SwiperFit</title>
        </head>
        <body>
          <h1>Error</h1>
          <p>There was an error loading this page.</p>
        </body>
      </html>
    `);
  }
}

function generateHTML({ title, description, url, workoutName, ownerName, exerciseCount, setCount, date, duration, workoutId, ogImage }) {
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
      .branding {
        text-align: center;
        margin-top: 32px;
        font-size: 14px;
        color: #6b7280;
      }
    </style>
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
        <a href="/" class="button">Open in SwiperFit</a>
      </div>
      
      <div class="branding">
        <p>Powered by SwiperFit</p>
      </div>
    </div>
  </body>
</html>`;
}
