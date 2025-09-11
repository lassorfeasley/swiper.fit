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
      .select(`
        *,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return res.status(404).send('Workout not found');
    }

    // If workout has an OG image URL, redirect to it
    if (workout.og_image_url) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.redirect(302, workout.og_image_url);
    }

    // If no OG image exists, generate one server-side
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.redirect(302, `/api/generate-og-image?workoutId=${workoutId}`);

  } catch (error) {
    console.error('Error in OG image handler:', error);
    return res.status(500).send('Error generating image');
  }
}