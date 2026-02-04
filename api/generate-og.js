import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { createClient } from '@supabase/supabase-js';

// Node.js runtime (default, no edge config)

// Create Supabase client
function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, serviceRoleKey);
}

/**
 * Generate and save OG image for a workout or routine
 * 
 * GET /api/generate-og?type=workout&id=<uuid>
 * GET /api/generate-og?type=routine&id=<uuid>
 * 
 * Returns the generated image directly (can be used as og:image src)
 * Also saves the image to Supabase Storage and updates the record
 */
export default async function handler(req, res) {
  const { type = 'workout', id, save = 'true' } = req.query;
  const shouldSave = save !== 'false';

  if (!id) {
    return res.status(400).json({ error: 'ID is required' });
  }

  try {
    if (type === 'workout') {
      return await generateWorkoutOG(id, shouldSave, res);
    } else if (type === 'routine') {
      return await generateRoutineOG(id, shouldSave, res);
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
  } catch (error) {
    console.error('[GenerateOG] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function generateWorkoutOG(workoutId, save, res) {
  const supabase = getSupabaseClient();
  
  // Fetch workout data
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_name,
      completed_at,
      duration_seconds,
      active_seconds_accumulated,
      user_id,
      routines!workouts_routine_id_fkey(routine_name)
    `)
    .eq('id', workoutId)
    .single();

  if (workoutError || !workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  // Get exercise and set counts
  const { count: exerciseCount } = await supabase
    .from('workout_exercises')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  const { count: setCount } = await supabase
    .from('sets')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId)
    .eq('status', 'complete');

  // Format data
  const workoutName = workout.workout_name || 'Completed Workout';
  const routineName = workout.routines?.routine_name || '';
  const duration = formatDuration(workout.active_seconds_accumulated || workout.duration_seconds || 0);
  const date = workout.completed_at 
    ? formatDate(workout.completed_at)
    : formatDate(new Date().toISOString());

  // Build pills array
  const pills = [];
  if (duration) pills.push(duration);
  pills.push(`${exerciseCount || 0} EXERCISES`);
  pills.push(`${setCount || 0} SETS`);

  // Generate SVG using satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0084D1',
          position: 'relative',
          fontFamily: 'Inter',
        },
        children: [
          // Top row: metrics
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                padding: '44px',
                position: 'relative',
                zIndex: 1,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { display: 'flex', gap: '20px' },
                    children: pills.map(text => ({
                      type: 'div',
                      props: {
                        style: {
                          backgroundColor: '#00598A',
                          padding: '16px 20px',
                          borderRadius: '10px',
                          color: 'white',
                          fontSize: '30px',
                          fontWeight: 300,
                          letterSpacing: '1.2px',
                          display: 'flex',
                          alignItems: 'center',
                        },
                        children: text,
                      },
                    })),
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      backgroundColor: '#00598A',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '30px',
                      fontWeight: 300,
                      letterSpacing: '1.2px',
                      display: 'flex',
                      alignItems: 'center',
                    },
                    children: date,
                  },
                },
              ],
            },
          },
          // Main title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                padding: '0 44px',
                position: 'relative',
                zIndex: 1,
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: '#F1F5F9',
                    fontSize: '120px',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    maxWidth: '1112px',
                    wordWrap: 'break-word',
                    display: 'flex',
                  },
                  children: workoutName,
                },
              },
            },
          },
          // Bottom: routine name
          routineName ? {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                padding: '0 44px 44px',
                position: 'relative',
                zIndex: 1,
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: 'white',
                    fontSize: '50px',
                    fontWeight: 300,
                    display: 'flex',
                  },
                  children: routineName,
                },
              },
            },
          } : null,
        ].filter(Boolean),
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'),
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff'),
          weight: 500,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff'),
          weight: 300,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // If save is requested, upload to storage and update record
  if (save) {
    try {
      const fileName = `workouts/${workoutId}.png`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('og-images')
        .upload(fileName, pngBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (!uploadError) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('og-images')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          // Add cache buster to URL
          const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          // Update workout record
          await supabase
            .from('workouts')
            .update({ og_image_url: imageUrl })
            .eq('id', workoutId);
          console.log('[GenerateOG] Saved workout OG image:', imageUrl);
        }
      } else {
        console.error('[GenerateOG] Upload error:', uploadError);
      }
    } catch (saveError) {
      console.error('[GenerateOG] Save error:', saveError);
    }
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(pngBuffer);
}

async function generateRoutineOG(routineId, save, res) {
  const supabase = getSupabaseClient();
  
  // Fetch routine data
  const { data: routine, error: routineError } = await supabase
    .from('routines')
    .select('id, routine_name, user_id')
    .eq('id', routineId)
    .single();

  if (routineError || !routine) {
    return res.status(404).json({ error: 'Routine not found' });
  }

  // Get owner name
  let ownerName = '';
  if (routine.user_id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', routine.user_id)
      .single();
    
    if (profile) {
      ownerName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
    }
  }

  const routineName = routine.routine_name || 'Routine';

  // Generate SVG using satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F54900',
          position: 'relative',
          fontFamily: 'Inter',
        },
        children: [
          // Top: WWW.SWIPER.FIT
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                padding: '44px',
                position: 'relative',
                zIndex: 1,
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: 'white',
                    fontSize: '30px',
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    display: 'flex',
                  },
                  children: 'WWW.SWIPER.FIT',
                },
              },
            },
          },
          // Main title
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                padding: '0 44px',
                position: 'relative',
                zIndex: 1,
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: '#F1F5F9',
                    fontSize: '125px',
                    fontWeight: 500,
                    lineHeight: 1,
                    maxWidth: '1025px',
                    wordWrap: 'break-word',
                    display: 'flex',
                  },
                  children: routineName,
                },
              },
            },
          },
          // Bottom: creator name
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                padding: '0 44px 44px',
                position: 'relative',
                zIndex: 1,
              },
              children: {
                type: 'div',
                props: {
                  style: {
                    color: 'white',
                    fontSize: '50px',
                    fontWeight: 300,
                    display: 'flex',
                  },
                  children: ownerName ? `Routine created by ${ownerName}` : 'Routine',
                },
              },
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'),
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hjp-Ek-_EeA.woff'),
          weight: 500,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff'),
          weight: 300,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await fetchFont('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff'),
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // If save is requested, upload to storage and update record
  if (save) {
    try {
      const fileName = `routines/${routineId}.png`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('og-images')
        .upload(fileName, pngBuffer, {
          contentType: 'image/png',
          upsert: true,
        });

      if (!uploadError) {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('og-images')
          .getPublicUrl(fileName);

        if (urlData?.publicUrl) {
          // Add cache buster to URL
          const imageUrl = `${urlData.publicUrl}?t=${Date.now()}`;
          // Update routine record
          await supabase
            .from('routines')
            .update({ og_image_url: imageUrl })
            .eq('id', routineId);
          console.log('[GenerateOG] Saved routine OG image:', imageUrl);
        }
      } else {
        console.error('[GenerateOG] Upload error:', uploadError);
      }
    } catch (saveError) {
      console.error('[GenerateOG] Save error:', saveError);
    }
  }

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(pngBuffer);
}

// Helper to fetch font data
async function fetchFont(url) {
  const response = await fetch(url);
  return await response.arrayBuffer();
}

function formatDuration(seconds) {
  if (!seconds || seconds === 0) return '';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month}, ${day} ${year}`;
  } catch {
    return '';
  }
}
