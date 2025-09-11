import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { generateOGImagePNG } from '@/lib/ogImageGenerator';
import { uploadOGImage, updateWorkoutOGImage } from '@/lib/ogImageStorage';

// Simple client-side OG image placeholder generator
async function generateImageBlob(titleText) {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 64px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const text = (titleText || 'Workout').toUpperCase();
  ctx.fillText(text, width / 2, height / 2);

  // Footer band
  ctx.fillStyle = '#22C55E';
  ctx.fillRect(width - 360, height / 2 - 110, 320, 220);

  // Checkmark
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(width - 320, height / 2);
  ctx.lineTo(width - 280, height / 2 + 40);
  ctx.lineTo(width - 220, height / 2 - 40);
  ctx.stroke();

  // Convert to Blob
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  return blob;
}

export default function OGImageAdmin() {
  const { user } = useAuth();
  const [selectedWorkouts, setSelectedWorkouts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState(null);
  const [filter, setFilter] = useState('missing'); // 'missing', 'all', 'public'
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [workoutsError, setWorkoutsError] = useState(null);

  // Inline preview controls
  const [previewWorkoutId, setPreviewWorkoutId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewError, setPreviewError] = useState(null);
  const originBase = typeof window !== 'undefined' ? window.location.origin : '';
  const apiBase = originBase.includes('localhost') ? 'https://www.swiper.fit' : originBase;
  const previewSrc = previewWorkoutId
    ? `${apiBase}/api/og-image?workoutId=${encodeURIComponent(previewWorkoutId)}&t=${refreshKey}`
    : '';

  // Load workouts on component mount
  useEffect(() => {
    if (user) {
      loadWorkouts();
    } else {
      setWorkoutsLoading(false);
      setWorkoutsError('Please log in to access the OG Image Admin');
    }
  }, [user]);

  const loadWorkouts = async () => {
    try {
      setWorkoutsLoading(true);
      setWorkoutsError(null);
      
      const { data: workouts, error } = await supabase
        .from('workouts')
        .select(`
          id,
          workout_name,
          duration_seconds,
          completed_at,
          is_public,
          og_image_url,
          created_at,
          routines!workouts_routine_id_fkey(routine_name)
        `)
        .eq('is_active', false) // Only completed workouts
        .not('completed_at', 'is', null)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setWorkouts(workouts || []);
    } catch (error) {
      console.error('Error loading workouts:', error);
      setWorkoutsError(error.message);
    } finally {
      setWorkoutsLoading(false);
    }
  };

  // Filter workouts based on current filter
  const filteredWorkouts = workouts.filter(workout => {
    if (!workout.completed_at) return false; // Only completed workouts
    
    switch (filter) {
      case 'missing':
        return !workout.og_image_url;
      case 'public':
        return workout.is_public;
      case 'all':
        return true;
      default:
        return true;
    }
  });

  const handleWorkoutToggle = (workoutId) => {
    setSelectedWorkouts(prev => 
      prev.includes(workoutId) 
        ? prev.filter(id => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const handleSelectAll = () => {
    if (selectedWorkouts.length === filteredWorkouts.length) {
      setSelectedWorkouts([]);
    } else {
      setSelectedWorkouts(filteredWorkouts.map(w => w.id));
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedWorkouts.length === 0) {
      alert('Please select at least one workout');
      return;
    }
    setIsGenerating(true);
    setResults(null);
    try {
      const { processed, failed, errors } = await clientSideGenerate(selectedWorkouts);
      setResults({ success: true, processed, failed, errors });
      await loadWorkouts();
    } catch (error) {
      console.error('Error generating OG images:', error);
      setResults({ success: false, error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAllMissing = async () => {
    setIsGenerating(true);
    setResults(null);
    try {
      const ids = filteredWorkouts.map(w => w.id);
      const { processed, failed, errors } = await clientSideGenerate(ids);
      setResults({ success: true, processed, failed, errors });
      await loadWorkouts();
    } catch (error) {
      console.error('Error generating OG images:', error);
      setResults({ success: false, error: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  async function clientSideGenerate(workoutIds) {
    const concurrency = 3;
    let processed = 0;
    let failed = 0;
    const errors = [];
    let index = 0;

    async function worker() {
      while (index < workoutIds.length) {
        const myIndex = index++;
        const id = workoutIds[myIndex];
        try {
          const data = await buildCanvasData(id);
          const dataUrl = await generateOGImagePNG(data);
          const url = await uploadOGImage(id, dataUrl);
          await updateWorkoutOGImage(id, url);
          processed++;
        } catch (e) {
          failed++;
          errors.push({ workoutId: id, error: e.message });
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, workoutIds.length) }, () => worker());
    await Promise.all(workers);
    return { processed, failed, errors };
  }

  async function buildCanvasData(workoutId) {
    // Load base workout info
    const { data: w, error: wErr } = await supabase
      .from('workouts')
      .select('user_id, workout_name, completed_at, created_at, duration_seconds, routines!workouts_routine_id_fkey(routine_name)')
      .eq('id', workoutId)
      .single();
    if (wErr || !w) throw new Error('Workout not found');

    // Counts
    const [{ count: exCountRaw = 0 }, { data: setsRows, error: setsErr }] = await Promise.all([
      supabase.from('workout_exercises').select('id', { count: 'exact', head: true }).eq('workout_id', workoutId),
      supabase.from('sets').select('id, exercise_id', { count: 'exact' }).eq('workout_id', workoutId)
    ]);
    if (setsErr) throw setsErr;
    const setCount = Array.isArray(setsRows) ? setsRows.length : 0;
    let exCount = exCountRaw || 0;
    if (exCount === 0 && Array.isArray(setsRows)) {
      const uniq = new Set(setsRows.map(s => s.exercise_id).filter(Boolean));
      exCount = uniq.size;
    }

    // Owner name (first)
    let first = '';
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', w.user_id)
        .single();
      const full = `${prof?.first_name || ''} ${prof?.last_name || ''}`.trim();
      first = (full.split(' ')[0] || '').trim();
    } catch (_) {}
    const possessive = first ? first + (first.toLowerCase().endsWith('s') ? "'" : "'s") + ' ' : '';
    const displayWorkoutName = `${possessive}${w.workout_name || 'Completed Workout'}`;

    // Format duration/date
    const secs = w.duration_seconds || 0;
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const duration = hours > 0 ? `${hours}h ${minutes}m` : (minutes > 0 ? `${minutes}m` : '');
    const date = new Date(w.completed_at || w.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    return {
      routineName: w.routines?.routine_name || 'Workout',
      workoutName: displayWorkoutName,
      date,
      duration,
      exerciseCount: exCount,
      setCount: setCount
    };
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>OG Image Admin</h1>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: '8px',
          color: '#721c24'
        }}>
          Please log in to access the OG Image Admin interface.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>OG Image Admin</h1>
      
      {/* Inline Preview */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Inline Preview</h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={previewWorkoutId}
            onChange={(e) => setPreviewWorkoutId(e.target.value)}
            placeholder="Enter workoutId"
            style={{ flex: '1 1 320px', padding: 8, border: '1px solid #ccc', borderRadius: 6 }}
          />
          <button
            onClick={() => { setPreviewError(null); setRefreshKey((k) => k + 1); }}
            disabled={!previewWorkoutId}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: previewWorkoutId ? 'pointer' : 'not-allowed' }}
          >
            Refresh Preview
          </button>
          {previewWorkoutId && (
            <a
              href={`${apiBase}/api/og-image?workoutId=${encodeURIComponent(previewWorkoutId)}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '8px 12px', borderRadius: 6, background: '#28a745', color: '#fff', textDecoration: 'none' }}
            >
              Open Smart Endpoint
            </a>
          )}
        </div>
        {previewWorkoutId && (
          <div style={{ marginTop: 12 }}>
            <img
              key={`admin-preview-${refreshKey}`}
              src={previewSrc}
              alt="OG Preview"
              onError={() => setPreviewError('Failed to load preview image.')}
              style={{ width: '100%', maxWidth: 800, border: '1px solid #ddd', borderRadius: 6 }}
            />
            {previewError && (
              <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 8, borderRadius: 6, marginTop: 8 }}>{previewError}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Quick Test Links */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6', 
        borderRadius: '8px' 
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Quick Test Links</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Removed server test endpoint (no longer used) */}
          <a
            href="/og-test"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            OG Image Test Page
          </a>
          <a
            href="/og-env"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            OG Environment
          </a>
          <a
            href="https://www.swiper.fit/api/og-image?workoutId=6385499d-a9f2-4161-b6bb-1b90256d605c"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc3545',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            Live OG Image (Production)
          </a>
          <button
            onClick={async () => {
              try {
                setIsGenerating(true);
                const ids = filteredWorkouts.map(w => w.id);
                const { processed, failed, errors } = await clientSideGenerate(ids);
                alert(`Bulk complete. Processed: ${processed}/${ids.length}. Failed: ${failed}`);
                await loadWorkouts();
              } catch (e) {
                console.error('Bulk generate failed:', e);
                alert(`Bulk generate failed: ${e.message}`);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            style={{
              padding: '6px 12px',
              backgroundColor: isGenerating ? '#ccc' : '#111827',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? 'Generating…' : 'Generate For All (Missing)'}
          </button>

          <button
            onClick={async () => {
              if (!confirm('This will overwrite OG images for ALL completed workouts. Continue?')) return;
              try {
                setIsGenerating(true);
                const ids = workouts.map(w => w.id);
                const { processed, failed } = await clientSideGenerate(ids);
                alert(`Overwrite complete. Processed: ${processed}/${ids.length}. Failed: ${failed}`);
                await loadWorkouts();
              } catch (e) {
                console.error('Bulk overwrite failed:', e);
                alert(`Bulk overwrite failed: ${e.message}`);
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating}
            style={{
              padding: '6px 12px',
              backgroundColor: isGenerating ? '#ccc' : '#f59e0b',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer'
            }}
          >
            {isGenerating ? 'Overwriting…' : 'Regenerate All (Overwrite)'}
          </button>
        </div>
      </div>
      
      {/* Filter Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <label>
          Filter workouts:
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            <option value="missing">Missing OG Images</option>
            <option value="public">Public Workouts</option>
            <option value="all">All Completed Workouts</option>
          </select>
        </label>
        
        <div style={{ marginLeft: '20px', fontSize: '14px', color: '#666' }}>
          Showing {filteredWorkouts.length} workouts
        </div>
      </div>

      {/* Bulk Actions */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSelectAll}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {selectedWorkouts.length === filteredWorkouts.length ? 'Deselect All' : 'Select All'}
        </button>
        
        <button
          onClick={handleBulkGenerate}
          disabled={isGenerating || selectedWorkouts.length === 0}
          style={{
            padding: '8px 16px',
            backgroundColor: (isGenerating || selectedWorkouts.length === 0) ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (isGenerating || selectedWorkouts.length === 0) ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : `Generate Selected (${selectedWorkouts.length})`}
        </button>
        
        <button
          onClick={handleGenerateAllMissing}
          disabled={isGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: isGenerating ? '#ccc' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isGenerating ? 'not-allowed' : 'pointer'
          }}
        >
          {isGenerating ? 'Generating...' : 'Generate All Missing'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          backgroundColor: results.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${results.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px',
          color: results.success ? '#155724' : '#721c24'
        }}>
          <h3>{results.success ? 'Success!' : 'Error'}</h3>
          {results.success ? (
            <div>
              <p>Processed: {results.processed}</p>
              <p>Failed: {results.failed}</p>
              {results.errors && results.errors.length > 0 && (
                <div>
                  <p>Errors:</p>
                  <ul>
                    {results.errors.map((error, index) => (
                      <li key={index}>
                        Workout {error.workoutId}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p>{results.error}</p>
          )}
        </div>
      )}

      {/* Workout List */}
      <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderBottom: '1px solid #ccc',
          fontWeight: 'bold'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 120px 120px 120px', gap: '10px' }}>
            <div>Select</div>
            <div>Workout</div>
            <div>Status</div>
            <div>Public</div>
            <div>OG Image</div>
          </div>
        </div>
        
        {workoutsLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading workouts...</div>
        ) : workoutsError ? (
          <div style={{ padding: '20px', color: 'red' }}>Error loading workouts: {workoutsError}</div>
        ) : filteredWorkouts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No workouts found matching the current filter.
          </div>
        ) : (
          filteredWorkouts.map((workout) => (
            <div 
              key={workout.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 1fr 120px 120px 120px', 
                gap: '10px',
                padding: '10px',
                borderBottom: '1px solid #eee',
                alignItems: 'center'
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={selectedWorkouts.includes(workout.id)}
                  onChange={() => handleWorkoutToggle(workout.id)}
                />
              </div>
              
              <div>
                <div style={{ fontWeight: '500' }}>{workout.workout_name}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  User • {new Date(workout.created_at).toLocaleDateString()}
                </div>
                {workout.routines?.routine_name && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Routine: {workout.routines.routine_name}
                  </div>
                )}
              </div>
              
              <div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: workout.completed_at ? '#d4edda' : '#f8d7da',
                  color: workout.completed_at ? '#155724' : '#721c24'
                }}>
                  {workout.completed_at ? 'Completed' : 'Active'}
                </span>
              </div>
              
              <div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  backgroundColor: workout.is_public ? '#d4edda' : '#f8d7da',
                  color: workout.is_public ? '#155724' : '#721c24'
                }}>
                  {workout.is_public ? 'Public' : 'Private'}
                </span>
              </div>
              
              <div>
                {workout.og_image_url ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: '#d4edda',
                      color: '#155724'
                    }}>
                      Generated
                    </span>
                    <a
                      href={workout.og_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: '12px', 
                        color: '#007bff',
                        textDecoration: 'none',
                        padding: '2px 6px',
                        border: '1px solid #007bff',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      View Image
                    </a>
                    <a
                      href={`/api/og-image?workoutId=${workout.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: '12px', 
                        color: '#28a745',
                        textDecoration: 'none',
                        padding: '2px 6px',
                        border: '1px solid #28a745',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      API Endpoint
                    </a>
                    <a
                      href={`/history/public/workout/${workout.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ 
                        fontSize: '12px', 
                        color: '#6f42c1',
                        textDecoration: 'none',
                        padding: '2px 6px',
                        border: '1px solid #6f42c1',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      Public Page
                    </a>
                  </div>
                ) : (
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                  }}>
                    Missing
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
