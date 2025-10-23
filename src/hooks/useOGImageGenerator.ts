import { useState } from 'react';
import { generateAndUploadOGImage } from '../lib/ogImageGenerator.ts';

interface OGImageGeneratorReturn {
  isGenerating: boolean;
  error: string | null;
  generateOGImage: (workoutId: string, workoutData: any) => Promise<string>;
}

/**
 * Hook to generate and upload Open Graph images for workouts
 */
export function useOGImageGenerator(): OGImageGeneratorReturn {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateOGImage = async (workoutId: string, workoutData: any): Promise<string> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const imageUrl = await generateAndUploadOGImage(workoutId, workoutData);
      return imageUrl;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    error,
    generateOGImage
  };
}
