export default async function handler(req, res) {
  const { type, workoutId, routineId, userId } = req.query;
  const userAgent = req.headers['user-agent'] || '';

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle legacy og-image endpoint (redirect to og-images)
  if (!type && workoutId) {
    return res.redirect(302, `/api/og-images?type=workout&workoutId=${workoutId}`);
  }

  try {
    switch (type) {
      case 'workout':
        return await handleWorkoutOG(req, res, workoutId);
      case 'routine':
        return await handleRoutineOG(req, res, routineId, userAgent);
      case 'static-workout':
        return await handleStaticWorkoutOG(req, res);
      case 'user-history':
        return await handleUserHistoryOG(req, res, userId);
      default:
        // Default to workout OG for backward compatibility
        return await handleWorkoutOG(req, res, workoutId);
    }
  } catch (error) {
    console.error('Error in consolidated OG handler:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      type,
      workoutId,
      routineId,
      userId
    });
  }
}

// ============================================================================
// WORKOUT OG IMAGE HANDLER
// ============================================================================
async function handleWorkoutOG(req, res, workoutId) {
  // For now, redirect to default OG image
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}

// ============================================================================
// ROUTINE OG IMAGE HANDLER
// ============================================================================
async function handleRoutineOG(req, res, routineId, userAgent) {
  if (!routineId) {
    return res.status(400).send('Missing required routineId');
  }

  // For now, redirect to default OG image
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}

// ============================================================================
// STATIC WORKOUT OG HANDLER
// ============================================================================
async function handleStaticWorkoutOG(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

    return res.status(200).json({
      success: true,
    message: 'Static workout OG generation not implemented yet'
  });
}

// ============================================================================
// USER HISTORY OG HANDLER
// ============================================================================
async function handleUserHistoryOG(req, res, userId) {
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // For now, redirect to default OG image
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Location', `https://${req.headers.host}/images/default-open-graph.png`);
  return res.status(302).end();
}