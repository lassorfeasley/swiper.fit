/**
 * Generate a PNG image for Open Graph sharing using Canvas API
 */

/**
 * Workout data interface for OG image generation
 */
export interface WorkoutData {
  routineName?: string;
  workoutName: string;
  date: string;
  duration?: string;
  exerciseCount: number;
  setCount: number;
}

/**
 * Routine data interface for OG image generation
 */
export interface RoutineData {
  routineName?: string;
  ownerName?: string;
  exerciseCount?: number;
  setCount?: number;
}

/**
 * Generate a PNG image for Open Graph sharing using Canvas API
 */
export function generateOGImagePNG(workoutData: WorkoutData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }
      
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
 * Generate a PNG for Routine OG image using the green theme
 */
export function generateRoutineOGImagePNG(routineData: RoutineData): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      try { if (document?.fonts?.ready) { await document.fonts.ready; } } catch (_) {}

      // Background: green 600
      ctx.fillStyle = '#00A63E';
      ctx.fillRect(0, 0, 1200, 630);

      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      // Top bar
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 30px "Be Vietnam Pro", Arial, sans-serif';
      // Avoid manual letter-spacing to preserve font kerning
      drawTextWithLetterSpacing(ctx, 'CLICK TO COPY', 60, 60, 0);
      ctx.textAlign = 'right';
      const owner = (routineData?.ownerName || '').trim();
      const rightLabel = owner ? `SHARED BY ${owner.toUpperCase()}` : '';
      if (rightLabel) {
        drawTextWithLetterSpacing(ctx, rightLabel, 1140, 60, 0);
      }
      ctx.textAlign = 'left';

      // Big routine title (always suffix " routine" unless already present)
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 80px "Be Vietnam Pro", Arial, sans-serif';
      ctx.textBaseline = 'middle';
      const titleLeft = 60;
      const titleRightMargin = 60;
      const titleMaxWidth = 1200 - titleLeft - titleRightMargin; // full width margins
      const rawName = (routineData?.routineName || 'Routine').trim();
      const hasSuffix = /\broutine\b/i.test(rawName);
      const titleText = hasSuffix ? rawName : `${rawName} routine`;
      drawWrappedLeftText(ctx, titleText, titleLeft, 300, titleMaxWidth, 90);

      // Bottom metrics
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';

      let xOffset = 60;
      const metricGap = 20;
      const exercisesText = `${routineData?.exerciseCount ?? 0} EXERCISES`;
      const setsText = `${routineData?.setCount ?? 0} SETS`;

      const usedA = drawMetricPill(ctx, xOffset, 502, exercisesText, 200, 68);
      xOffset += usedA + metricGap;
      drawMetricPill(ctx, xOffset, 502, setsText, 140, 68);

      // Dark-green checkmark at bottom-right inside 60px margin
      const checkWidth = 320;
      const checkHeight = 251;
      const checkX = 1200 - 60 - checkWidth;
      const checkY = 60 + 510 - checkHeight; // align with AllContent bottom
      drawSvgCheckmark(ctx, checkX, checkY, checkWidth, checkHeight, '#0D542B');

      const dataUrl = canvas.toDataURL('image/png');
      resolve(dataUrl);
    } catch (error) {
      console.error('Error generating Routine OG image:', error);
      reject(error);
    }
  });
}

/**
 * Draw text with letter spacing
 */
function drawTextWithLetterSpacing(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  x: number, 
  y: number, 
  letterSpacing: number
): void {
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
function drawWrappedCenteredText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  centerX: number, 
  centerY: number, 
  maxWidth: number, 
  lineHeight: number
): void {
  const words = (text || '').split(' ');
  const lines: string[] = [];
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
function drawWrappedLeftText(
  ctx: CanvasRenderingContext2D, 
  text: string, 
  leftX: number, 
  centerY: number, 
  maxWidth: number, 
  lineHeight: number
): void {
  const words = (text || '').split(' ');
  const lines: string[] = [];
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
function drawMetricBox(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  text: string, 
  horizontalPadding: number = 20
): number {
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

// Draw white pill metric with gray border and dynamic width
function drawMetricPill(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  text: string, 
  minWidth: number = 140, 
  height: number = 68
): number {
  ctx.font = '300 30px "Be Vietnam Pro", Arial, sans-serif';
  const paddingX = 20;
  const textWidth = ctx.measureText(text).width;
  const boxWidth = Math.max(minWidth, Math.ceil(textWidth + paddingX * 2));

  // Background
  ctx.fillStyle = '#FFFFFF';
  // Align to half-pixel to get a crisp 2px inner stroke
  const bgX = Math.round(x) + 0.5;
  const bgY = Math.round(y) + 0.5;
  drawRoundedRectPath(ctx, bgX, bgY, boxWidth, height, 10);
  ctx.fill();

  // Border
  ctx.strokeStyle = '#D4D4D4';
  ctx.lineWidth = 2;
  // True 2px inner stroke with crisp edges
  drawRoundedRectPath(ctx, bgX + 1, bgY + 1, boxWidth - 2, height - 2, 10);
  ctx.stroke();

  // Text
  ctx.fillStyle = '#0A0A0A';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const centerX = bgX + boxWidth / 2;
  const centerY = bgY + height / 2;
  // No letter spacing to avoid kerning artifacts
  drawTextWithLetterSpacing(ctx, text, centerX, centerY, 0);

  return boxWidth;
}

// Helper to draw a rounded rectangle path
function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  radius: number = 10
): void {
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
function drawLucideCheckmark(
  ctx: CanvasRenderingContext2D, 
  boxX: number, 
  boxY: number, 
  boxW: number, 
  boxH: number, 
  color: string = 'white', 
  lineWidth: number = 25, 
  lineCap: CanvasLineCap = 'round', 
  lineJoin: CanvasLineJoin = 'round'
): void {
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
function drawSvgCheckmark(
  ctx: CanvasRenderingContext2D, 
  boxX: number, 
  boxY: number, 
  boxW: number, 
  boxH: number, 
  fill: string = '#22C55E'
): void {
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
 */
export async function generateAndUploadOGImage(
  workoutId: string, 
  workoutData: WorkoutData, 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[OGImage] Attempt ${attempt}/${maxRetries} for workout ${workoutId}`);
      // Client-side render -> data URL
      const dataUrl = await generateOGImagePNG(workoutData);
      const { uploadOGImage, updateWorkoutOGImage } = await import('./ogImageStorage.ts');
      const imageUrl = await uploadOGImage(workoutId, dataUrl);
      await updateWorkoutOGImage(workoutId, imageUrl);
      console.log(`[OGImage] Successfully generated OG image for workout ${workoutId} on attempt ${attempt}`);
      return imageUrl;
    } catch (error) {
      lastError = error as Error;
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

/**
 * Generate and upload OG image for a routine
 */
export async function generateAndUploadRoutineOGImage(
  routineId: string, 
  routineData: RoutineData, 
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const dataUrl = await generateRoutineOGImagePNG({
        routineName: routineData?.routineName || 'Routine',
        ownerName: routineData?.ownerName || '',
        exerciseCount: routineData?.exerciseCount ?? 0,
        setCount: routineData?.setCount ?? 0,
      });
      const { uploadRoutineOGImage, updateRoutineOGImage } = await import('./ogImageStorage.ts');
      const imageUrl = await uploadRoutineOGImage(routineId, dataUrl);
      await updateRoutineOGImage(routineId, imageUrl);
      return imageUrl;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
