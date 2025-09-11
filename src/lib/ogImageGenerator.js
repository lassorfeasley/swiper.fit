/**
 * Generate a PNG image for Open Graph sharing using Canvas API
 * @param {Object} workoutData - The workout data
 * @returns {Promise<string>} - Base64 PNG data URL
 */
export function generateOGImagePNG(workoutData) {
  return new Promise(async (resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      
      // Ensure fonts are loaded for correct native kerning
      try {
        if (document?.fonts?.ready) {
          await document.fonts.ready;
        }
      } catch (_) {}
      
      // Prefer normal kerning if supported by browser
      try {
        if ('fontKerning' in ctx) {
          // @ts-ignore - fontKerning is experimental
          ctx.fontKerning = 'normal';
        }
      } catch (_) {}
      
      // Set background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1200, 630);
      
      // Set up fonts
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Draw top bar (routine left, date right) with consistent style
      ctx.fillStyle = '#737373';
      ctx.font = '700 30px "Be Vietnam Pro", Arial, sans-serif';
      
      // Routine name (left) - with letter spacing
      const routineName = (workoutData.routineName || 'Workout').toUpperCase();
      // tracking-wide/uppercase in CSS → we keep uppercase but rely on native kerning
      drawTextWithLetterSpacing(ctx, routineName, 60, 60, 0);
      
      // Date (right) - with letter spacing
      const date = workoutData.date.toUpperCase();
      ctx.textAlign = 'right';
      drawTextWithLetterSpacing(ctx, date, 1140, 60, 0);
      
      // Reset text alignment for subsequent elements
      ctx.textAlign = 'left';

      // Draw the green checkmark first so the title can render on top if overlapping
      const dateRightBound = 1140; // matches x used to render date with textAlign='right'
      const checkWidth = 320;
      const checkHeight = 251; // matches SVG viewBox height
      const checkX = dateRightBound - checkWidth;
      drawSvgCheckmark(ctx, checkX, 319, checkWidth, checkHeight, '#22C55E');

      // Draw workout name, wrapped and left-aligned (allow overlap over checkmark)
      ctx.fillStyle = '#171717';
      ctx.font = '700 68px "Be Vietnam Pro", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const leftMargin = 60;
      const rightMargin = 60;
      const titleMaxWidth = 1200 - leftMargin - rightMargin; // full width with equal margins
      drawWrappedLeftText(ctx, workoutData.workoutName, leftMargin, 300, titleMaxWidth, 75);
      
      // Draw metrics boxes
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
      
      let xOffset = 60;
      const metricGap = 20;
      
      // Duration box (if exists)
      if (workoutData.duration) {
        const usedW = drawMetricBox(ctx, xOffset, 502, 140, 68, workoutData.duration.toUpperCase(), 28);
        xOffset += usedW + metricGap;
      }
      
      // Exercises box
      const usedW2 = drawMetricBox(ctx, xOffset, 502, 200, 68, `${workoutData.exerciseCount} EXERCISES`, 28);
      xOffset += usedW2 + metricGap;
      
      // Sets box
      drawMetricBox(ctx, xOffset, 502, 140, 68, `${workoutData.setCount} SETS`, 28);
      
      // Checkmark already drawn earlier
      
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
  // Default canvas kerning without manual spacing
  if (!letterSpacing || letterSpacing === 0) {
    ctx.fillText(text, x, y);
    return;
  }

  const chars = text.split('');
  let currentX = x;

  // Calculate total width with fixed letter spacing
  let totalWidth = 0;
  for (let i = 0; i < chars.length; i++) {
    totalWidth += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) totalWidth += letterSpacing;
  }

  // Adjust starting position for centering/right align
  if (ctx.textAlign === 'center') {
    currentX = x - totalWidth / 2;
  } else if (ctx.textAlign === 'right') {
    currentX = x - totalWidth;
  }

  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], currentX, y);
    currentX += ctx.measureText(chars[i]).width + (i < chars.length - 1 ? letterSpacing : 0);
  }
}

/**
 * Draws centered, wrapped text around a center point.
 * Breaks on spaces to keep lines within maxWidth.
 */
function drawWrappedCenteredText(ctx, text, centerX, centerY, maxWidth, lineHeight) {
  const words = (text || '').split(' ');
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const test = current ? current + ' ' + words[i] : words[i];
    const w = ctx.measureText(test).width;
    if (w <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);

  const totalHeight = (lines.length - 1) * lineHeight;
  let y = centerY - totalHeight / 2;
  for (const line of lines) {
    drawTextWithLetterSpacing(ctx, line, centerX, y, 0);
    y += lineHeight;
  }
}

/**
 * Draws left-aligned, wrapped text given a top-left anchor (x aligned, y centered overall).
 */
function drawWrappedLeftText(ctx, text, leftX, centerY, maxWidth, lineHeight) {
  const words = (text || '').split(' ');
  const lines = [];
  let current = '';
  for (let i = 0; i < words.length; i++) {
    const test = current ? current + ' ' + words[i] : words[i];
    const w = ctx.measureText(test).width;
    if (w <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  if (current) lines.push(current);

  const totalHeight = (lines.length - 1) * lineHeight;
  let y = centerY - totalHeight / 2;
  ctx.textAlign = 'left';
  for (const line of lines) {
    drawTextWithLetterSpacing(ctx, line, leftX, y, 0);
    y += lineHeight;
  }
}

/**
 * Draw a metric box with text. Returns the actual width used, allowing caller spacing.
 */
function drawMetricBox(ctx, x, y, width, height, text, horizontalPadding = 20) {
  // Ensure font set for accurate measurement
  ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
  const textWidth = ctx.measureText(text).width;
  const boxWidth = Math.max(width, Math.ceil(textWidth + horizontalPadding * 2));

  // Background
  ctx.fillStyle = '#FAFAFA';
  drawRoundedRectPath(ctx, x, y, boxWidth, height, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#D4D4D4';
  ctx.lineWidth = 2;
  drawRoundedRectPath(ctx, x + 2, y + 2, boxWidth - 4, height - 4, 10);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#404040';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const centerX = x + boxWidth / 2;
  const centerY = y + height / 2;
  drawTextWithLetterSpacing(ctx, text, centerX, centerY, 0);

  return boxWidth;
}

// Helper to draw a rounded rectangle path
function drawRoundedRectPath(ctx, x, y, width, height, radius = 10) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r);
  ctx.lineTo(x + width, y + height - r);
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
  ctx.lineTo(x + r, y + height);
  ctx.arcTo(x, y + height, x, y + height - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/**
 * Draw a Lucide-style checkmark centered within a bounding box.
 * The path mirrors Lucide's Check icon proportions (120x120 viewBox).
 */
function drawLucideCheckmark(ctx, boxX, boxY, boxW, boxH, color = 'white', lineWidth = 25, lineCap = 'round', lineJoin = 'round') {
  const baseSize = 120; // Lucide check viewBox size
  const scale = Math.min(boxW, boxH) / baseSize;
  const offsetX = boxX + (boxW - baseSize * scale) / 2;
  const offsetY = boxY + (boxH - baseSize * scale) / 2;

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = lineCap;
  ctx.lineJoin = lineJoin;

  // Lucide check path: M20 65 L55 100 L110 35
  ctx.beginPath();
  ctx.moveTo(20, 65);
  ctx.lineTo(55, 100);
  ctx.lineTo(110, 35);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw the provided SVG checkmark path scaled into the target box.
 * SVG path: M320 39.8487L110.663 251L0 148.673L36.1637 107.801L109.058 175.204L282.151 0.6185L320 39.8487Z
 */
function drawSvgCheckmark(ctx, boxX, boxY, boxW, boxH, fill = '#22C55E') {
  // Use a Path2D built from the path data (supported in modern browsers)
  const path = new Path2D('M320 39.8487L110.663 251L0 148.673L36.1637 107.801L109.058 175.204L282.151 0.6185L320 39.8487Z');

  // Original viewBox: width=320, height=251
  const viewW = 320;
  const viewH = 251;
  const scaleX = boxW / viewW;
  const scaleY = boxH / viewH;

  ctx.save();
  ctx.translate(boxX, boxY);
  ctx.scale(scaleX, scaleY);
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.restore();
}

/**
 * Generate and upload OG image for a workout using server-side generation
 * @param {string} workoutId - The workout ID
 * @param {Object} workoutData - The workout data
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<string>} - The public URL of the uploaded image
 */
export async function generateAndUploadOGImage(workoutId, workoutData, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OGImage] Attempt ${attempt}/${maxRetries} for workout ${workoutId}`);
      const resp = await fetch('/api/generate-and-store-og-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutId })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || 'Failed to generate');
      console.log(`[OGImage] Successfully generated OG image for workout ${workoutId} on attempt ${attempt}`);
      return data.imageUrl;
    } catch (error) {
      lastError = error;
      console.error(`[OGImage] Attempt ${attempt}/${maxRetries} failed for workout ${workoutId}:`, error);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`[OGImage] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error(`[OGImage] All ${maxRetries} attempts failed for workout ${workoutId}`);
  throw lastError;
}
