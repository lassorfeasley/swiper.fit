import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  const userId = req.query.id;
  const userAgent = req.headers['user-agent'] || '';

  if (!userId) {
    return res.status(400).send('Missing required id');
  }

  // Detect bots
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
    // Fetch owner profile and share preference
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, share_all_workouts')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const ownerName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User' : 'User';

    // Respect privacy: only show OG if share_all_workouts is true
    if (!profile || !profile.share_all_workouts) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>History Not Public - SwiperFit</title>
            <meta name="description" content="This user's workout history is not public." />
          </head>
          <body>
            <h1>History Not Public</h1>
            <p>This user's workout history is not public.</p>
          </body>
        </html>
      `);
    }

    // Build OG metadata
    const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit';
    const pageUrl = `${baseUrl}/history/public/${userId}`;
    const title = `${ownerName}'s Workout History`;
    const description = `${ownerName} is sharing their workout history on SwiperFit. View recent workouts and stats.`;

    const html = generateHTML({
      title,
      description,
      url: pageUrl,
      ownerName,
      userId
    });

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('Error serving history OG:', error);
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

function generateHTML({ title, description, url, ownerName, userId }) {
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
    <meta property="og:image" content="https://www.swiper.fit/api/generate-user-history-og-image?userId=${userId}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${url}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="https://www.swiper.fit/api/generate-user-history-og-image?userId=${userId}" />
    
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
      .header { text-align: center; margin-bottom: 32px; }
      .title { font-size: 28px; font-weight: 600; color: #111827; margin-bottom: 8px; }
      .subtitle { font-size: 18px; color: #6b7280; margin-bottom: 24px; }
      .cta { text-align: center; margin-top: 32px; }
      .button {
        display: inline-block; background: #059669; color: white; padding: 12px 24px; border-radius: 8px;
        text-decoration: none; font-weight: 500; transition: background 0.2s;
      }
      .button:hover { background: #047857; }
      .branding { text-align: center; margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1 class="title">${ownerName}'s Workout History</h1>
        <p class="subtitle">Public history on SwiperFit</p>
      </div>
      <div class="cta">
        <a href="/app/history/public/${userId}" class="button">Open in App</a>
        <p class="redirect-note">Click to view full workout history</p>
      </div>
      <div class="branding">
        <p>Powered by SwiperFit</p>
      </div>
    </div>
  </body>
</html>`;
}


