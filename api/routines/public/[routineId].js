import { getSupabaseServerClient } from '../../server/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const routineId = req.query.routineId;
  const userAgent = req.headers['user-agent'] || '';

  if (!routineId) {
    return res.status(400).send('Missing required routineId');
  }

  // Check if this is a crawler/bot
  const isBot = /bot|crawl|slurp|spider|facebook|whatsapp|twitter|telegram|skype|slack|discord|imessage|linkedin|postinspector|linkedinbot|orcascan|opengraph|og|meta|validator/i.test(userAgent);

  if (!isBot) {
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

  // Bot/crawler - serve static HTML with OG tags
  try {
    // Fetch routine and visibility
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`id, routine_name, is_public, user_id, created_by, shared_by`)
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

    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swiper.fit';
    const pageUrl = `${baseUrl}/routines/public/${routineId}`;
    
    // Headline and subtitle for OG cards and visible header
    const title = ownerName ? `${ownerName} shared an exercise routine on Swiper.Fit` : 'Exercise routine on Swiper.Fit';
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
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swiper.fit'}/api/og-images?type=routine&routineId=${routineId}">
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${url}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://swiper.fit'}/api/og-images?type=routine&routineId=${routineId}">
  
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
      color: #333;
      margin-bottom: 10px;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin: 20px 0;
    }
    .stat {
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${routineName}</h1>
    ${ownerName ? `<div class="meta">Shared by ${ownerName}</div>` : ''}
    <div class="stats">
      <div class="stat">
        <div class="stat-number">${exerciseCount}</div>
        <div class="stat-label">Exercises</div>
      </div>
      <div class="stat">
        <div class="stat-number">${setCount}</div>
        <div class="stat-label">Sets</div>
      </div>
    </div>
    <p>${description}</p>
    <p><a href="${url}">View routine on Swiper.Fit</a></p>
  </div>
</body>
</html>`;
}
