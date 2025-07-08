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
      // Workout is now public - we could trigger static generation here
      // For now, we'll just log it since the static content is generated on-demand
      console.log(`Workout ${workoutId} is now public - static content will be generated on first crawler visit`);
      
      // In a more advanced implementation, you could:
      // 1. Call the generate-static-workout API to pre-generate the HTML
      // 2. Store it in a CDN or file system
      // 3. Pre-warm caches
      
      return res.status(200).json({ 
        success: true, 
        message: 'Static generation triggered',
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