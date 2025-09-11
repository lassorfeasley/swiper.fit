import { TEMPLATE_VERSION, createSupabaseServerClient } from './og-config.js';

const supabase = createSupabaseServerClient();

export default async function handler(req, res) {
  // CORS headers for local debugging
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const { workoutId } = req.query;
  
  if (!workoutId) {
    return res.status(400).json({ error: 'Workout ID is required' });
  }

  // Set caching headers for better performance (on redirect target)
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');

  try {
    // If a current-version file already exists in Storage, redirect to it
    const fileName = `${workoutId}-v${TEMPLATE_VERSION}.png`;
    const { data: { publicUrl } } = supabase.storage
      .from('og-images')
      .getPublicUrl(fileName);
    try {
      const head = await fetch(publicUrl, { method: 'HEAD' });
      if (head.ok) {
        return res.redirect(302, publicUrl);
      }
    } catch (_) {}

    // Otherwise, ask the server JSON endpoint to generate and store, then redirect
    try {
      const origin = req.headers.origin || 'https://www.swiper.fit';
      const genResp = await fetch(`${origin}/api/generate-and-store-og-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId })
      });
      const payload = await genResp.json();
      if (genResp.ok && payload?.imageUrl) {
        return res.redirect(302, payload.imageUrl);
      }
    } catch (e) {
      console.error('Proxy generate error:', e);
    }

    return res.status(500).json({ error: 'Failed to generate image' });
  } catch (error) {
    console.error('Error generating OG image:', error);
    console.error('Error stack:', error.stack);
    console.error('Workout ID:', workoutId);
    
    // Return a fallback error response
    return res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.message,
      workoutId: workoutId,
      timestamp: new Date().toISOString()
    });
  }
}
