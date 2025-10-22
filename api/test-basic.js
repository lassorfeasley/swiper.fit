export default async function handler(req, res) {
  try {
    return res.status(200).json({
      success: true,
      message: 'Basic serverless function is working',
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl: !!process.env.SUPABASE_URL,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Function execution failed',
      details: err.message
    });
  }
}
