import { TEMPLATE_VERSION, createSupabaseServerClient } from './og-config.js';

const supabase = createSupabaseServerClient();

export default async function handler(req, res) {
  const workoutId = req.query.workoutId || '6385499d-a9f2-4161-b6bb-1b90256d605c';
  
  try {
    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        *,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return res.status(404).send('Workout not found');
    }

    // If we have a stored URL that already matches our versioned filename, prefer it
    if (workout.og_image_url && workout.og_image_url.includes(`-v${TEMPLATE_VERSION}.png`)) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.redirect(302, workout.og_image_url);
    }

    // If no current-version file exists, generate and store, then redirect
    try {
      const genResp = await fetch(`${req.headers.origin || ''}/api/generate-and-store-og-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId })
      });
      const payload = await genResp.json();
      if (genResp.ok && payload?.imageUrl) {
        res.setHeader('Cache-Control', 'public, max-age=3600');
        return res.redirect(302, payload.imageUrl);
      }
    } catch (e) {
      // fall through to on-demand rendering endpoint as a last resort
    }

    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(302, `/api/generate-og-image?workoutId=${workoutId}`);

  } catch (error) {
    console.error('Error in OG image handler:', error);
    return res.status(500).send('Error generating image');
  }
}