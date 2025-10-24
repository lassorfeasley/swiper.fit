export default async function handler(req, res) {
  try {
    // Test if we can import
    const { getSupabaseServerClient } = await import('../../server/supabase.js');
    
    // Test if we can create client
    const supabase = getSupabaseServerClient();
    
    return res.status(200).json({
      success: true,
      message: 'Supabase import works',
      hasClient: !!supabase
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
