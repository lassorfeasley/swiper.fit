import { supabase } from '@/supabaseClient';

/**
 * Upload a PNG image to Supabase Storage
 * @param {string} workoutId - The workout ID
 * @param {string} pngDataUrl - Base64 PNG data URL
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function uploadOGImage(workoutId, pngDataUrl) {
  try {
    // Convert data URL to blob
    const response = await fetch(pngDataUrl);
    const blob = await response.blob();
    
    // Create filename
    const fileName = `${workoutId}.png`;
    
    // Upload to Supabase Storage using authenticated client
    const { error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading OG image:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: publicData } = supabase.storage
      .from('og-images')
      .getPublicUrl(fileName);
    
    return publicData?.publicUrl;
  } catch (error) {
    console.error('Error in uploadOGImage:', error);
    throw error;
  }
}

/**
 * Update workout with OG image URL
 * @param {string} workoutId - The workout ID
 * @param {string} imageUrl - The URL of the uploaded image
 */
export async function updateWorkoutOGImage(workoutId, imageUrl) {
  try {
    // Append cache-busting param so clients and crawlers fetch the latest image
    const cacheBustedUrl = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
    const { error } = await supabase
      .from('workouts')
      .update({ og_image_url: cacheBustedUrl })
      .eq('id', workoutId);
    
    if (error) {
      console.error('Error updating workout OG image URL:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateWorkoutOGImage:', error);
    throw error;
  }
}
