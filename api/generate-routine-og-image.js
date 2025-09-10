import { ImageResponse } from '@vercel/og';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tdevpmxmvrgouozsgplu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0'
);

export default async function handler(req, res) {
  const { routineId } = req.query;
  
  if (!routineId) {
    return res.status(400).json({ error: 'Routine ID is required' });
  }

  // Set caching headers for better performance
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.setHeader('Content-Type', 'image/png');

  try {
    // Fetch routine data
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select(`
        *,
        accounts!routines_user_id_fkey(full_name),
        routine_exercises(
          id,
          exercises(name)
        )
      `)
      .eq('id', routineId)
      .eq('is_public', true)
      .single();

    if (routineError || !routine) {
      return res.status(404).json({ error: 'Routine not found' });
    }

    // Calculate metrics
    const exerciseCount = routine.routine_exercises?.length || 0;
    
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
            {/* Routine type */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              ROUTINE
            </div>
            
            {/* Owner name */}
            <div
              style={{
                fontSize: '30px',
                fontWeight: '700',
                color: '#737373',
                letterSpacing: '1.2px',
                textTransform: 'uppercase',
              }}
            >
              BY {routine.accounts?.full_name?.toUpperCase() || 'USER'}
            </div>
          </div>

          {/* Main routine name */}
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
            {routine.routine_name || 'Workout Routine'}
          </div>

          {/* Metrics boxes */}
          <div
            style={{
              position: 'absolute',
              bottom: '60px',
              left: '60px',
              display: 'flex',
              gap: '20px',
            }}
          >
            {/* Exercises box */}
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
              {exerciseCount} EXERCISES
            </div>
          </div>

          {/* Blue play button */}
          <div
            style={{
              position: 'absolute',
              right: '60px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '320px',
              height: '250px',
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Play button SVG */}
            <svg
              width="120"
              height="120"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 30L40 90L90 60L40 30Z"
                fill="white"
              />
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
    console.error('Error generating routine OG image:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
