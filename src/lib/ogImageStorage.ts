import { supabase } from '@/supabaseClient';

// Bump this when the OG template changes to force new filenames
const TEMPLATE_VERSION = '2';

/**
 * Upload a PNG image to Supabase Storage
 */
export async function uploadOGImage(workoutId: string, pngDataUrl: string): Promise<string> {
  try {
    // Convert data URL to blob
    const response = await fetch(pngDataUrl);
    const blob = await response.blob();
    
    // Create versioned filename to avoid CDN cache collisions
    const fileName = `${workoutId}-v${TEMPLATE_VERSION}-${Date.now()}.png`;
    
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
    
    return publicData?.publicUrl || '';
  } catch (error) {
    console.error('Error in uploadOGImage:', error);
    throw error;
  }
}

/**
 * Update workout with OG image URL
 */
export async function updateWorkoutOGImage(workoutId: string, imageUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('workouts')
      .update({ og_image_url: imageUrl })
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

/**
 * Upload a routine OG image to Supabase Storage
 */
export async function uploadRoutineOGImage(routineId: string, pngDataUrl: string): Promise<string> {
  try {
    const response = await fetch(pngDataUrl);
    const blob = await response.blob();
    const fileName = `routine-${routineId}-v${TEMPLATE_VERSION}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('og-images')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true
      });
    if (uploadError) {
      console.error('Error uploading Routine OG image:', uploadError);
      throw uploadError;
    }
    const { data: publicData } = await supabase.storage
      .from('og-images')
      .getPublicUrl(fileName);
    return publicData?.publicUrl || '';
  } catch (error) {
    console.error('Error in uploadRoutineOGImage:', error);
    throw error;
  }
}

/**
 * Update routine with OG image URL
 */
export async function updateRoutineOGImage(routineId: string, imageUrl: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('routines')
      .update({ og_image_url: imageUrl })
      .eq('id', routineId);
    if (error) {
      console.error('Error updating routine OG image URL:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateRoutineOGImage:', error);
    throw error;
  }
}
