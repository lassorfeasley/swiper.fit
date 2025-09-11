import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

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

    // Fallback to a static default image bundled with the app
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.redirect(302, '/images/og-workout-default.svg');

  } catch (error) {
    console.error('Error in OG image handler:', error);
    return res.status(500).send('Error generating image');
  }
}