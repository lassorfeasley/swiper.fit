import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { generateOGImagePNG, generateRoutineOGImagePNG } from '@/lib/ogImageGenerator';
import { uploadOGImage, uploadRoutineOGImage } from '@/lib/ogImageStorage';

export default function OGEnv() {
  const { user } = useAuth();

  const [mode, setMode] = useState('workout'); // 'workout' | 'routine'
  // no server OG refresh key needed anymore
  const [imgError, setImgError] = useState(null);

  // Public workouts for current user
  const [workouts, setWorkouts] = useState([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [workoutsError, setWorkoutsError] = useState(null);

  // Client-side fallback preview
  const [fallbackUrl, setFallbackUrl] = useState('');
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Public routines for current user
  const [routines, setRoutines] = useState([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [loadingRoutines, setLoadingRoutines] = useState(false);
  const [routinesError, setRoutinesError] = useState(null);

  // Load public workouts for the logged-in user
  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setWorkouts([]);
        setSelectedWorkoutId('');
        return;
      }
      try {
        setLoadingWorkouts(true);
        setWorkoutsError(null);
        const { data, error } = await supabase
          .from('workouts')
          .select('id, workout_name, created_at, completed_at, duration_seconds, is_public, routine_id, og_image_url')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        setWorkouts(list);
        // Auto-select most recent
        setSelectedWorkoutId(list.length > 0 ? list[0].id : '');
      } catch (e) {
        console.error('Failed to load workouts:', e);
        setWorkoutsError(e.message);
      } finally {
        setLoadingWorkouts(false);
      }
    })();
  }, [user?.id]);

  // Load public routines for the logged-in user
  useEffect(() => {
    (async () => {
      if (!user?.id) {
        setRoutines([]);
        setSelectedRoutineId('');
        return;
      }
      try {
        setLoadingRoutines(true);
        setRoutinesError(null);
        const { data, error } = await supabase
          .from('routines')
          .select('id, routine_name, created_at, is_public, og_image_url')
          .eq('user_id', user.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(50);
        if (error) throw error;
        const list = Array.isArray(data) ? data : [];
        setRoutines(list);
        setSelectedRoutineId(list.length > 0 ? list[0].id : '');
      } catch (e) {
        console.error('Failed to load routines:', e);
        setRoutinesError(e.message);
      } finally {
        setLoadingRoutines(false);
      }
    })();
  }, [user?.id]);

  const originBase = typeof window !== 'undefined' ? window.location.origin : '';

  // server OG not used in OGEnv

  const handleRefresh = () => {
    setImgError(null);
    setFallbackUrl('');
    setSaveMsg('');
  };

  const linkStyleMemo = (enabled, color = '#007bff') => linkStyle(enabled, color);

  async function generateFallback() {
    if (!selectedWorkoutId) return;
    try {
      setSaveMsg('');
      setFallbackLoading(true);
      // Load workout basics
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select('user_id, workout_name, completed_at, created_at, duration_seconds, routines!workouts_routine_id_fkey(routine_name)')
        .eq('id', selectedWorkoutId)
        .single();
      if (workoutError) throw workoutError;

      // Count related rows
      const { data: exRows, error: exErr } = await supabase
        .from('workout_exercises')
        .select('id')
        .eq('workout_id', selectedWorkoutId);
      if (exErr) throw exErr;
      const { data: setRows, error: setErr } = await supabase
        .from('sets')
        .select('id, exercise_id, status, set_type, reps, timed_set_duration')
        .eq('workout_id', selectedWorkoutId);
      if (setErr) throw setErr;

      // Completed/valid sets only
      const validSets = (setRows || []).filter(s => {
        if (s?.status !== 'complete') return false;
        if (s?.set_type === 'timed') {
          return typeof s?.timed_set_duration === 'number' && s.timed_set_duration > 0;
        }
        return typeof s?.reps === 'number' && s.reps > 0;
      });

      // Prefer distinct exercises from valid sets; fallback to snapshot count
      let exerciseCount = 0;
      if (validSets.length > 0) {
        const uniq = new Set(validSets.map(s => s.exercise_id).filter(Boolean));
        exerciseCount = uniq.size;
      } else {
        exerciseCount = Array.isArray(exRows) ? exRows.length : 0;
      }
      const setCount = validSets.length;

      // Format data for canvas renderer
      const durationSeconds = workout?.duration_seconds || 0;
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const duration = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : '';
      const date = new Date(workout?.completed_at || workout?.created_at || Date.now()).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric'
      });

      // Load owner's name separately to avoid complex joins
      let fullName = '';
      try {
        // Prefer profiles table for name to avoid join issues
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', workout?.user_id)
          .single();
        if (!profErr && prof) {
          const first = prof.first_name || '';
          const last = prof.last_name || '';
          fullName = `${first} ${last}`.trim();
        }
      } catch (e) {
        // ignore and fallback to blank
      }

      // Build possessive owner + workout name (e.g., "Lassor's Friday Workout")
      const ownerFirst = (fullName.trim().split(' ')[0] || '').trim();
      const possessive = ownerFirst ? ownerFirst + (ownerFirst.toLowerCase().endsWith('s') ? "'" : "'s") + ' ' : '';
      const displayWorkoutName = `${possessive}${workout?.workout_name || 'Completed Workout'}`;

      const dataUrl = await generateOGImagePNG({
        routineName: workout?.routines?.routine_name || 'Workout',
        workoutName: displayWorkoutName,
        date,
        duration,
        exerciseCount,
        setCount,
      });
      setFallbackUrl(dataUrl);
    } catch (e) {
      console.error('Fallback preview failed:', e);
    } finally {
      setFallbackLoading(false);
    }
  }

  // Routine fallback builder
  async function generateRoutineFallback() {
    if (!selectedRoutineId) return;
    try {
      setSaveMsg('');
      setFallbackLoading(true);
      // Minimal counts
      const { data: rx, error: rxErr } = await supabase
        .from('routine_exercises')
        .select('id')
        .eq('routine_id', selectedRoutineId);
      if (rxErr) throw rxErr;
      const { data: rs, error: rsErr } = await supabase
        .from('routine_sets')
        .select('id')
        .eq('routine_id', selectedRoutineId);
      if (rsErr) throw rsErr;

      // Routine and owner
      const { data: routine, error: rErr } = await supabase
        .from('routines')
        .select('routine_name, user_id')
        .eq('id', selectedRoutineId)
        .single();
      if (rErr) throw rErr;

      let ownerName = '';
      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', routine?.user_id)
          .single();
        if (prof) ownerName = `${prof.first_name || ''} ${prof.last_name || ''}`.trim();
      } catch (_) {}

      const exerciseCount = Array.isArray(rx) ? rx.length : 0;
      const setCount = Array.isArray(rs) ? rs.length : 0;

      const dataUrl = await generateRoutineOGImagePNG({
        routineName: routine?.routine_name || 'Routine',
        ownerName: ownerName,
        exerciseCount,
        setCount,
      });
      setFallbackUrl(dataUrl);
    } catch (e) {
      console.error('Routine fallback failed:', e);
    } finally {
      setFallbackLoading(false);
    }
  }

  async function saveToBucket() {
    if (!selectedWorkoutId) return;
    try {
      setSaving(true);
      setSaveMsg('');
      if (!user?.id) {
        throw new Error('Not signed in');
      }
      if (!fallbackUrl) throw new Error('Build the client preview first');

      const dataUrl = fallbackUrl;

      const url = await uploadOGImage(selectedWorkoutId, dataUrl);
      if (!url) throw new Error('No public URL returned');

      // Verify existence in storage (diagnostic)
      try {
        const path = `${selectedWorkoutId}.png`;
        const list = await supabase.storage.from('og-images').list('', { limit: 100, search: selectedWorkoutId });
        if (list?.error) {
          console.warn('Storage list error:', list.error);
        } else {
          const found = (list?.data || []).some((f) => f.name === `${selectedWorkoutId}.png`);
          if (!found) {
            console.warn('Uploaded file not visible in list yet:', path);
          }
        }
      } catch (e) {
        console.warn('Storage verification failed:', e);
      }

      const { error: updateErr } = await supabase
        .from('workouts')
        .update({ og_image_url: url })
        .eq('id', selectedWorkoutId);
      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

      // Confirm DB write
      const { data: chk, error: chkErr } = await supabase
        .from('workouts')
        .select('og_image_url')
        .eq('id', selectedWorkoutId)
        .single();
      if (chkErr) {
        console.warn('Post-update read failed:', chkErr);
      }

      setSaveMsg(`Saved ✓ URL: <a href="${chk?.og_image_url || url}" target="_blank" rel="noreferrer">${chk?.og_image_url || url}</a>`);
    } catch (e) {
      console.error('Save to bucket failed:', e);
      setSaveMsg(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function saveRoutineToBucket() {
    if (!selectedRoutineId) return;
    try {
      setSaving(true);
      setSaveMsg('');
      if (!user?.id) throw new Error('Not signed in');

      if (!fallbackUrl) throw new Error('Build the client preview first');
      const dataUrl = fallbackUrl;

      const url = await uploadRoutineOGImage(selectedRoutineId, dataUrl);
      if (!url) throw new Error('No public URL returned');

      const { error: updateErr } = await supabase
        .from('routines')
        .update({ og_image_url: url })
        .eq('id', selectedRoutineId);
      if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

      setSaveMsg(`Saved ✓ URL: <a href="${url}" target="_blank" rel="noreferrer">${url}</a>`);
    } catch (e) {
      console.error('Save routine to bucket failed:', e);
      setSaveMsg(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Open Graph Templates Environment</h1>
      <p style={{ color: '#555' }}>Quickly preview OG templates and endpoints with your IDs.</p>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button
          onClick={() => { setMode('workout'); setImgError(null); setFallbackUrl(''); setSaveMsg(''); }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: mode === 'workout' ? '#111827' : '#fff', color: mode === 'workout' ? '#fff' : '#111' }}
        >
          Workouts
        </button>
        <button
          onClick={() => { setMode('routine'); setImgError(null); setFallbackUrl(''); setSaveMsg(''); }}
          style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: mode === 'routine' ? '#111827' : '#fff', color: mode === 'routine' ? '#fff' : '#111' }}
        >
          Routines
        </button>
      </div>

      {/* Public Workouts (current user) */}
      {mode === 'workout' && (
      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Public Workouts (your account)</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedWorkoutId}
            onChange={(e) => { setSelectedWorkoutId(e.target.value); setImgError(null); setFallbackUrl(''); setSaveMsg(''); }}
            disabled={!user?.id || loadingWorkouts}
            style={{ flex: '1 1 360px', padding: 8, border: '1px solid #ccc', borderRadius: 4, background: 'white' }}
          >
            <option value="">
              {!user?.id ? 'Log in to view workouts' : loadingWorkouts ? 'Loading workouts...' : (workouts.length ? 'Choose a workout' : 'No public workouts')}
            </option>
            {workouts.map((w) => (
              <option key={w.id} value={w.id}>
                {w.workout_name} ({new Date(w.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <a href={selectedWorkoutId ? `${originBase}/history/public/workout/${encodeURIComponent(selectedWorkoutId)}` : '#'} target="_blank" rel="noreferrer" style={linkStyleMemo(!!selectedWorkoutId, '#6f42c1')}>
            Public Workout Page
          </a>
          <button onClick={handleRefresh} disabled={!selectedWorkoutId} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedWorkoutId ? 'pointer' : 'not-allowed' }}>
            Refresh Preview
          </button>
          <button onClick={generateFallback} disabled={!selectedWorkoutId || fallbackLoading} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedWorkoutId && !fallbackLoading ? 'pointer' : 'not-allowed' }}>
            {fallbackLoading ? 'Building Fallback…' : 'Build Client Preview'}
          </button>
          <button onClick={saveToBucket} disabled={!selectedWorkoutId || saving || !fallbackUrl} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedWorkoutId && !saving ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Saving…' : 'Save to Bucket'}
          </button>
        </div>
        {saveMsg && (
          <div
            style={{ marginTop: 8, color: saveMsg.startsWith('Save failed') ? '#b91c1c' : '#065f46', background: saveMsg.startsWith('Save failed') ? '#fee2e2' : '#ecfdf5', border: '1px solid #d1fae5', padding: 8, borderRadius: 6 }}
            dangerouslySetInnerHTML={{ __html: saveMsg }}
          />
        )}
        
        {imgError && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 8, borderRadius: 6, marginTop: 8 }}>{imgError}</div>
        )}
        {fallbackUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Client Preview (fallback)</div>
            <img
              src={fallbackUrl}
              alt="Client Preview"
              style={{ width: '100%', maxWidth: 800, border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>
        )}
      </section>
      )}

      {/* Public Routines (current user) */}
      {mode === 'routine' && (
      <section style={{ marginTop: 24, padding: 16, border: '1px solid #eee', borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>Public Routines (your account)</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={selectedRoutineId}
            onChange={(e) => { setSelectedRoutineId(e.target.value); setImgError(null); setFallbackUrl(''); setSaveMsg(''); }}
            disabled={!user?.id || loadingRoutines}
            style={{ flex: '1 1 360px', padding: 8, border: '1px solid #ccc', borderRadius: 4, background: 'white' }}
          >
            <option value="">
              {!user?.id ? 'Log in to view routines' : loadingRoutines ? 'Loading routines...' : (routines.length ? 'Choose a routine' : 'No public routines')}
            </option>
            {routines.map((r) => (
              <option key={r.id} value={r.id}>
                {r.routine_name} ({new Date(r.created_at).toLocaleDateString()})
              </option>
            ))}
          </select>
          <a href={selectedRoutineId ? `${originBase}/routines/public/${encodeURIComponent(selectedRoutineId)}` : '#'} target="_blank" rel="noreferrer" style={linkStyleMemo(!!selectedRoutineId, '#6f42c1')}>
            Public Routine Page
          </a>
          <button onClick={() => { setImgError(null); setFallbackUrl(''); setSaveMsg(''); }} disabled={!selectedRoutineId} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedRoutineId ? 'pointer' : 'not-allowed' }}>
            Refresh Preview
          </button>
          <button onClick={generateRoutineFallback} disabled={!selectedRoutineId || fallbackLoading} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedRoutineId && !fallbackLoading ? 'pointer' : 'not-allowed' }}>
            {fallbackLoading ? 'Building Fallback…' : 'Build Client Preview'}
          </button>
          <button onClick={saveRoutineToBucket} disabled={!selectedRoutineId || saving || !fallbackUrl} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: selectedRoutineId && !saving ? 'pointer' : 'not-allowed' }}>
            {saving ? 'Saving…' : 'Save to Bucket'}
          </button>
        </div>
        {routinesError && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 8, borderRadius: 6, marginTop: 8 }}>{routinesError}</div>
        )}
        
        {imgError && (
          <div style={{ color: '#b91c1c', background: '#fee2e2', border: '1px solid #fecaca', padding: 8, borderRadius: 6, marginTop: 8 }}>{imgError}</div>
        )}
        {fallbackUrl && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 6 }}>Client Preview (fallback)</div>
            <img
              src={fallbackUrl}
              alt="Client Preview"
              style={{ width: '100%', maxWidth: 800, border: '1px solid #ddd', borderRadius: 6 }}
            />
          </div>
        )}
      </section>
      )}
    </div>
  );
}

function linkStyle(enabled, color = '#007bff') {
  return {
    pointerEvents: enabled ? 'auto' : 'none',
    opacity: enabled ? 1 : 0.5,
    backgroundColor: color,
    color: 'white',
    padding: '8px 12px',
    textDecoration: 'none',
    borderRadius: 6,
    fontSize: 14
  };
}
