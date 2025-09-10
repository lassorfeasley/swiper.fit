import { useState } from 'react';
import { generateAndUploadOGImage } from '../lib/ogImageGenerator.js';

/**
 * Hook to generate and upload Open Graph images for workouts
 */
export function useOGImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generateOGImage = async (workoutId, workoutData) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const imageUrl = await generateAndUploadOGImage(workoutId, workoutData);
      return imageUrl;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateOGImage,
    isGenerating,
    error
  };
}
