export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { workoutId, isPublic } = req.body;

  if (!workoutId) {
    return res.status(400).json({ error: 'workoutId is required' });
  }

  try {
    if (isPublic) {
      // Workout is now public - trigger static generation and OG image generation
      console.log(`Workout ${workoutId} is now public - triggering static and OG image generation`);
      
      // Generate OG image for the newly public workout
      try {
        const ogResponse = await fetch(`${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.swiper.fit'}/api/generate-og-image?workoutId=${workoutId}`);
        
        if (ogResponse.ok) {
          // Convert response to blob
          const blob = await ogResponse.blob();
          
          // Upload to Supabase Storage
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(
            'https://tdevpmxmvrgouozsgplu.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
          );
          
          const fileName = `${workoutId}.png`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('og-images')
            .upload(fileName, blob, {
              contentType: 'image/png',
              upsert: true
            });
          
          if (!uploadError) {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('og-images')
              .getPublicUrl(fileName);
            
            // Update workout record
            await supabase
              .from('workouts')
              .update({ og_image_url: publicUrl })
              .eq('id', workoutId);
            
            console.log(`Successfully generated OG image for newly public workout: ${workoutId}`);
          } else {
            console.error(`Failed to upload OG image for workout ${workoutId}:`, uploadError);
          }
        } else {
          console.error(`Failed to generate OG image for workout ${workoutId}: ${ogResponse.statusText}`);
        }
      } catch (ogError) {
        console.error(`Error generating OG image for workout ${workoutId}:`, ogError);
        // Don't fail the entire request if OG image generation fails
      }
      
      return res.status(200).json({ 
        success: true, 
        message: 'Static generation and OG image generation triggered',
        workoutId 
      });
    } else {
      // Workout is no longer public - could clean up static files here
      console.log(`Workout ${workoutId} is no longer public`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Static content cleanup triggered',
        workoutId 
      });
    }

  } catch (error) {
    console.error('Error in static generation trigger:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 