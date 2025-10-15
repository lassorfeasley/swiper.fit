import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const userId = req.query.userId || req.query.userid;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Set caching headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', 'image/png');

  try {
    // Fetch public profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name, share_all_workouts')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respect privacy
    if (!profile.share_all_workouts) {
      return res.status(403).json({ error: 'User history is not public' });
    }

    const ownerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';

    // Generate OG image using Vercel's ImageResponse
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Top bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 60px',
              backgroundColor: 'white',
            }}
          >
            {/* Workout history label */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              WORKOUT HISTORY
            </div>
            
            {/* User name */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              {ownerName.toUpperCase()}
            </div>
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: '80px',
              fontWeight: '700',
              color: '#171717',
              letterSpacing: '0px',
              textAlign: 'center',
              marginTop: '60px',
              marginBottom: '60px',
            }}
          >
            Fitness Journey
          </div>

          {/* Stats boxes */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {/* Workouts completed box */}
            <div
              style={{
                width: '200px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              WORKOUTS
            </div>
            
            {/* Progress box */}
            <div
              style={{
                width: '200px',
                height: '68px',
                backgroundColor: '#FAFAFA',
                border: '2px solid #D4D4D4',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '30px',
                fontWeight: '300',
                color: '#404040',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              PROGRESS
            </div>
          </div>

          {/* Purple chart icon */}
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              height: '250px',
              backgroundColor: '#8B5CF6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Chart icon SVG */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 100L40 80L60 60L80 40L100 20"
                stroke="white"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle cx="20" cy="100" r="6" fill="white" />
              <circle cx="40" cy="80" r="6" fill="white" />
              <circle cx="60" cy="60" r="6" fill="white" />
              <circle cx="80" cy="40" r="6" fill="white" />
              <circle cx="100" cy="20" r="6" fill="white" />
            </svg>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating user history OG image:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
