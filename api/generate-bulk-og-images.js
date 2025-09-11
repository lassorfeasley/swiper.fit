import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  // CORS for local admin page calls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    workoutIds = null, 
    onlyMissing = true, 
    batchSize = 10,
    isPublicOnly = false 
  } = req.body;

  try {
    console.log('Starting bulk OG image generation...');
    
    // Build query for workouts that need OG images
    let query = supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        duration_seconds,
        completed_at,
        is_public,
        og_image_url,
        routines!workouts_routine_id_fkey(routine_name),
        workout_exercises(
          id,
          exercises(name)
        ),
        sets!sets_workout_id_fkey(id)
      `)
      .eq('is_active', false) // Only completed workouts
      .not('completed_at', 'is', null);

    // Filter by specific workout IDs if provided
    if (workoutIds && Array.isArray(workoutIds)) {
      query = query.in('id', workoutIds);
    }

    // Filter by public workouts if requested
    if (isPublicOnly) {
      query = query.eq('is_public', true);
    }

    // Only get workouts missing OG images if requested
    if (onlyMissing) {
      query = query.or('og_image_url.is.null,og_image_url.eq.');
    }

    const { data: workouts, error: workoutsError } = await query;

    if (workoutsError) {
      console.error('Error fetching workouts:', workoutsError);
      return res.status(500).json({ error: 'Failed to fetch workouts' });
    }

    if (!workouts || workouts.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No workouts found that need OG images',
        processed: 0,
        failed: 0
      });
    }

    console.log(`Found ${workouts.length} workouts that need OG images`);

    // Process workouts in batches
    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < workouts.length; i += batchSize) {
      const batch = workouts.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(workouts.length / batchSize)}`);

      // Process batch in parallel
      const batchPromises = batch.map(async (workout) => {
        try {
          console.log(`Generating OG image for workout: ${workout.id}`);
          
          // Call the OG image generation API
          const response = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/api/generate-og-image?workoutId=${workout.id}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // Convert response to blob
          const blob = await response.blob();
          
          // Convert blob to data URL for upload
          const reader = new FileReader();
          const dataUrl = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
          // Upload to Supabase Storage
          const fileName = `${workout.id}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('og-images')
            .upload(fileName, dataUrl.split(',')[1], {
              contentType: 'image/png',
              upsert: true
            });
          
          if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('og-images')
            .getPublicUrl(fileName);
          
          // Update workout record
          const { error: updateError } = await supabase
            .from('workouts')
            .update({ og_image_url: publicUrl })
            .eq('id', workout.id);
          
          if (updateError) {
            throw new Error(`Database update failed: ${updateError.message}`);
          }

          console.log(`Successfully generated OG image for workout: ${workout.id}`);
          return { workoutId: workout.id, success: true, imageUrl: publicUrl };
          
        } catch (error) {
          console.error(`Failed to generate OG image for workout ${workout.id}:`, error);
          return { 
            workoutId: workout.id, 
            success: false, 
            error: error.message 
          };
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Update results
      batchResults.forEach(result => {
        if (result.success) {
          results.processed++;
        } else {
          results.failed++;
          results.errors.push({
            workoutId: result.workoutId,
            error: result.error
          });
        }
      });

      // Add delay between batches to avoid overwhelming the system
      if (i + batchSize < workouts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`Bulk OG image generation completed. Processed: ${results.processed}, Failed: ${results.failed}`);

    return res.status(200).json({
      success: true,
      message: `Bulk OG image generation completed`,
      total: workouts.length,
      processed: results.processed,
      failed: results.failed,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error in bulk OG image generation:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
