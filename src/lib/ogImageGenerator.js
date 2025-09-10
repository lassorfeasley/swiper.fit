/**
 * Generate a PNG image for Open Graph sharing using Canvas API
 * @param {Object} workoutData - The workout data
 * @returns {Promise<string>} - Base64 PNG data URL
 */
export function generateOGImagePNG(workoutData) {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      
      // Set background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1200, 630);
      
      // Set up fonts
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Draw top bar
      ctx.fillStyle = '#737373';
      ctx.font = '700 30px "Be Vietnam Pro", Arial, sans-serif';
      ctx.textTransform = 'uppercase';
      
      // Routine name (left)
      const routineName = (workoutData.routineName || 'Workout').toUpperCase();
      ctx.fillText(routineName, 60, 60);
      
      // Date (right)
      const date = workoutData.date.toUpperCase();
      ctx.textAlign = 'right';
      ctx.fillText(date, 1140, 60);
      
      // Reset text alignment
      ctx.textAlign = 'left';
      
      // Draw workout name (centered)
      ctx.fillStyle = '#171717';
      ctx.font = '700 80px "Be Vietnam Pro", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(workoutData.workoutName, 600, 300);
      
      // Draw metrics boxes
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
      
      let xOffset = 60;
      
      // Duration box (if exists)
      if (workoutData.duration) {
        drawMetricBox(ctx, xOffset, 502, 140, 68, workoutData.duration.toUpperCase());
        xOffset += 160;
      }
      
      // Exercises box
      drawMetricBox(ctx, xOffset, 502, 200, 68, `${workoutData.exerciseCount} EXERCISES`);
      xOffset += 220;
      
      // Sets box
      drawMetricBox(ctx, xOffset, 502, 140, 68, `${workoutData.setCount} SETS`);
      
      // Draw green checkmark background
      ctx.fillStyle = '#22C55E';
      ctx.fillRect(760, 319.62, 320, 250.38);
      
      // Draw white checkmark inside the green square
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Checkmark path - centered in the green area
      const centerX = 760 + 160; // Center of green square (760 + 320/2)
      const centerY = 319.62 + 125; // Center of green square (319.62 + 250.38/2)
      
      ctx.beginPath();
      // Start of checkmark (left side)
      ctx.moveTo(centerX - 60, centerY);
      // First diagonal line (down and right)
      ctx.lineTo(centerX - 20, centerY + 40);
      // Second diagonal line (up and right)
      ctx.lineTo(centerX + 60, centerY - 40);
      ctx.stroke();
      
      // Convert to PNG
      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
      
    } catch (error) {
      console.error('Error generating OG image:', error);
      reject(error);
    }
  });
}

/**
 * Draw a metric box with text
 */
function drawMetricBox(ctx, x, y, width, height, text) {
  // Draw box background
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(x, y, width, height);
  
  // Draw border
  ctx.strokeStyle = '#D4D4D4';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // Draw text
  ctx.fillStyle = '#404040';
  ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + width / 2, y + height / 2);
}

/**
 * Generate and upload OG image for a workout
 * @param {string} workoutId - The workout ID
 * @param {Object} workoutData - The workout data
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function generateAndUploadOGImage(workoutId, workoutData) {
  try {
    // Generate PNG
    const pngDataUrl = await generateOGImagePNG(workoutData);
    
    // Upload to Supabase Storage
    const { uploadOGImage, updateWorkoutOGImage } = await import('./ogImageStorage.js');
    const imageUrl = await uploadOGImage(workoutId, pngDataUrl);
    
    // Update workout record
    await updateWorkoutOGImage(workoutId, imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating and uploading OG image:', error);
    throw error;
  }
}
