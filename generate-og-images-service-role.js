#!/usr/bin/env node

import { getSupabaseServerClient } from './server/supabase.js';

// Use service role key via env to bypass RLS
const supabase = getSupabaseServerClient();

async function generateOGImage(workoutId) {
  try {
    console.log(`Generating OG image for workout: ${workoutId}`);
    
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
      throw new Error(`Workout not found: ${workoutError?.message}`);
    }

    // Calculate metrics (simplified for now)
    const exerciseCount = 5; // Placeholder
    const setCount = 10; // Placeholder
    
    // Format duration
    const durationSeconds = workout.duration_seconds || 0;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    // Format date
    const completedDate = new Date(workout.completed_at || new Date());
    const date = completedDate.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Generate OG image using the proper API endpoint
    const response = await fetch(`https://www.swiper.fit/api/generate-og-image?workoutId=${workoutId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to generate OG image: ${response.statusText}`);
    }
    
    // Convert response to blob
    const blob = await response.blob();
    
    // Upload to Supabase Storage
    const fileName = `${workoutId}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(fileName, blob, {
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
      .eq('id', workoutId);
    
    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`✅ Successfully generated OG image for workout: ${workoutId}`);
    return { workoutId, success: true, imageUrl: publicUrl };
    
  } catch (error) {
    console.error(`❌ Failed to generate OG image for workout ${workoutId}:`, error.message);
    return { workoutId, success: false, error: error.message };
  }
}

async function bulkGenerateOGImages() {
  try {
    console.log('🚀 Starting bulk OG image generation...');
    
    // Fetch workouts that need OG images
    const { data: workouts, error: workoutsError } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        duration_seconds,
        completed_at,
        is_public,
        og_image_url,
        routines!workouts_routine_id_fkey(routine_name)
      `)
      .eq('is_active', false) // Only completed workouts
      .not('completed_at', 'is', null)
      .or('og_image_url.is.null,og_image_url.eq.');

    if (workoutsError) {
      throw new Error(`Failed to fetch workouts: ${workoutsError.message}`);
    }

    if (!workouts || workouts.length === 0) {
      console.log('✅ No workouts found that need OG images');
      return;
    }

    console.log(`📊 Found ${workouts.length} workouts that need OG images`);

    const results = {
      processed: 0,
      failed: 0,
      errors: []
    };

    // Process workouts in batches of 5
    const batchSize = 5;
    for (let i = 0; i < workouts.length; i += batchSize) {
      const batch = workouts.slice(i, i + batchSize);
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(workouts.length / batchSize)}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(workout => generateOGImage(workout.id));
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

      // Add delay between batches
      if (i + batchSize < workouts.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n📈 Bulk OG image generation completed!');
    console.log(`✅ Processed: ${results.processed}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      results.errors.forEach(error => {
        console.log(`  - Workout ${error.workoutId}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('💥 Error in bulk OG image generation:', error.message);
  }
}

// Run the bulk generation
bulkGenerateOGImages();
