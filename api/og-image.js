import { getSupabaseServerClient } from '../server/supabase.js';

const supabase = getSupabaseServerClient();

export default async function handler(req, res) {
  const workoutId = req.query.workoutId || '6385499d-a9f2-4161-b6bb-1b90256d605c';
  
  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`og_image_url`)
      .eq('id', workoutId)
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
    console.error('Error in OG image handler:', error);
    return res.status(500).send('Error generating image');
  }
}