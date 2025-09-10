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
      
      // Routine name (left) - with letter spacing
      const routineName = (workoutData.routineName || 'Workout').toUpperCase();
      drawTextWithLetterSpacing(ctx, routineName, 60, 60, 1.2);
      
      // Date (right) - with letter spacing
      const date = workoutData.date.toUpperCase();
      ctx.textAlign = 'right';
      drawTextWithLetterSpacing(ctx, date, 1140, 60, 1.2);
      
      // Reset text alignment
      ctx.textAlign = 'left';
      
      // Draw workout name (centered) - with letter spacing
      ctx.fillStyle = '#171717';
      ctx.font = '700 80px "Be Vietnam Pro", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      drawTextWithLetterSpacing(ctx, workoutData.workoutName, 600, 300, 0);
      
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
      
      // Draw white checkmark using a custom path
      ctx.fillStyle = 'white';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      const centerX = 760 + 160; // Center of green square
      const centerY = 319.62 + 125; // Center of green square
      
      // Create a clean checkmark path
      ctx.beginPath();
      // Start at bottom left of checkmark
      ctx.moveTo(centerX - 60, centerY + 20);
      // Draw first line up and right
      ctx.lineTo(centerX - 10, centerY - 10);
      // Draw second line up and right
      ctx.lineTo(centerX + 60, centerY - 50);
      ctx.stroke();
      
      // Add a subtle shadow for depth
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX - 60, centerY + 22);
      ctx.lineTo(centerX - 10, centerY - 8);
      ctx.lineTo(centerX + 60, centerY - 48);
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
 * Draw text with letter spacing
 */
function drawTextWithLetterSpacing(ctx, text, x, y, letterSpacing) {
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }
  
  const chars = text.split('');
  let currentX = x;
  
  // Calculate total width with letter spacing for centering
  let totalWidth = 0;
  for (let i = 0; i < chars.length; i++) {
    totalWidth += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) {
      totalWidth += letterSpacing;
    }
  }
  
  // Adjust starting position for centering
  if (ctx.textAlign === 'center') {
    currentX = x - totalWidth / 2;
  } else if (ctx.textAlign === 'right') {
    currentX = x - totalWidth;
  }
  
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], currentX, y);
    const charWidth = ctx.measureText(chars[i]).width;
    currentX += charWidth + letterSpacing;
  }
}

/**
 * Draw a metric box with text - exact specifications
 */
function drawMetricBox(ctx, x, y, width, height, text) {
  // Draw box background
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(x, y, width, height);
  
  // Draw inset border (outline with -2px offset)
  ctx.strokeStyle = '#D4D4D4';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
  
  // Draw text with letter spacing
  ctx.fillStyle = '#404040';
  ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Draw text with letter spacing
  drawTextWithLetterSpacing(ctx, text, centerX, centerY, 1.2);
}

/**
 * Generate and upload OG image for a workout using server-side generation
 * @param {string} workoutId - The workout ID
 * @param {Object} workoutData - The workout data
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function generateAndUploadOGImage(workoutId, workoutData) {
  try {
    // Generate server-side OG image
    const response = await fetch(`/api/generate-og-image?workoutId=${workoutId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to generate OG image: ${response.statusText}`);
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
    const { uploadOGImage, updateWorkoutOGImage } = await import('./ogImageStorage.js');
    const imageUrl = await uploadOGImage(workoutId, dataUrl);
    
    // Update workout record
    await updateWorkoutOGImage(workoutId, imageUrl);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating and uploading OG image:', error);
    throw error;
  }
}
