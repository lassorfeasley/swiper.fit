import { getSupabaseServerClient } from '../../server/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const routineId = req.query.id;
  const userAgent = req.headers['user-agent'] || '';

  if (!routineId) {
    return res.status(400).send('Missing required id');
  }

  const isBot = /bot|crawl|slurp|spider|facebook|whatsapp|twitter|telegram|skype|slack|discord|imessage|linkedin|postinspector|linkedinbot|orcascan|opengraph|og|meta|validator/i.test(userAgent);

  if (!isBot) {
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

  try {
    // Fetch routine and visibility
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`id, routine_name, is_public, user_id`)
      .eq('id', routineId)
      .single();

    if (routineError || !routine || !routine.is_public) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Routine Not Public - SwiperFit</title>
            <meta name="description" content="This routine is not public or was not found." />
          </head>
          <body>
            <h1>Routine Not Public</h1>
            <p>This routine is not public or was not found.</p>
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
    let ownerName = 'User';
    if (routine.user_id) {
      const { data: owner } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', routine.user_id)
        .single();
      if (owner) {
        ownerName = `${owner.first_name || ''} ${owner.last_name || ''}`.trim() || 'User';
      }
    }

    const exerciseCount = (routineExercises || []).length;
    const setCount = (routineSets || []).length;

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
    const pageUrl = `${baseUrl}/routines/public/${routineId}`;
    // Headline and subtitle for OG cards and visible header
    const title = `${ownerName} shared an exercise routine on Swiper.Fit`;
    const description = `Swiper.Fit is the effortless way to log workouts`;

    const html = generateHTML({
      title: title || 'Log workouts effortlessly with Swiper.fit',
      description: description || 'Enter your routine and start a workout. Never miss an exercise and track your progress with AI.',
      url: pageUrl,
      routineName: routine.routine_name,
      ownerName,
      exerciseCount,
      setCount,
      routineId
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error serving routine OG:', error);
    return res.status(500).send('Internal Server Error');
  }
}

function generateHTML({ title, description, url, routineName, ownerName, exerciseCount, setCount, routineId }) {
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
    <meta property="og:image" content="https://www.swiper.fit/api/generate-routine-og-image?routineId=${routineId}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://www.swiper.fit/api/generate-routine-og-image?routineId=${routineId}" />
    
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


