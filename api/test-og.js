export default async function handler(req, res) {
  try {
    console.log('Test endpoint called');
    return res.status(200).json({ 
      message: 'Test endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({ 
      error: 'Test endpoint failed',
      details: error.message
    });
  }
}
