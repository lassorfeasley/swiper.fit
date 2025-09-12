import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tdevpmxmvrgouozsgplu.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  const routineId = req.query.routineId;

  if (!routineId) {
    return res.status(400).send('Missing routineId');
  }

  try {
    const { data: routine, error } = await supabase
      .from('routines')
      .select('og_image_url')
      .eq('id', routineId)
      .single();

    if (error) {
      return res.status(404).send('Routine not found');
    }

    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');

    if (routine?.og_image_url) {
      return res.redirect(302, routine.og_image_url);
    }

    return res.redirect(302, '/images/og-routine-default.svg');
  } catch (e) {
    console.error('Error in routine OG image handler:', e);
    return res.status(500).send('Error generating image');
  }
}
