import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useCurrentUser } from '@/contexts/AccountContext';
import { generateWorkoutName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [workoutProgress, setWorkoutProgress] = useState({});
  const [loading, setLoading] = useState(true);

  // Effect to check for an active workout on load
  useEffect(() => {
    const checkForActiveWorkout = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // Fetch the active workout record and program metadata
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .select('*, routines!workouts_routine_id_fkey(routine_name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        if (workoutError) {
          console.error('Error fetching active workout row:', workoutError);
          setLoading(false);
          return;
        }
        if (!workout) {
          setLoading(false);
          return;
        }
        // Build workout context data
        const workoutData = {
          id: workout.id,
          programId: workout.routine_id,
          workoutName: workout.workout_name || 'Workout',
          routineName: workout.routines?.routine_name || '',
          startTime: workout.created_at,
          lastExerciseId: workout.last_workout_exercise_id || null,
        };
        setActiveWorkout(workoutData);
        // Fetch all sets logged for this workout (including pending ones)
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('*')
          .eq('workout_id', workout.id);
        if (setsError) {
          console.error('[ActiveWorkoutContext] Error fetching sets on initial load:', setsError);
        }
        const progress = {};
        if (setsData && !setsError) {
          setsData.forEach(s => {
            if (!progress[s.exercise_id]) progress[s.exercise_id] = [];
            progress[s.exercise_id].push({
              id: s.id,
              routine_set_id: s.routine_set_id,
              reps: s.reps,
              weight: s.weight,
              unit: s.weight_unit || 'lbs',
              weight_unit: s.weight_unit || 'lbs',
              set_variant: s.set_variant,
              set_type: s.set_type,
              timed_set_duration: s.timed_set_duration,
              status: s.status ?? 'pending', // Include status from DB (default to pending)
            });
          });
        }
        setWorkoutProgress(progress);
        // Compute elapsed time
        const elapsed = workout.created_at
          ? Math.floor((new Date() - new Date(workout.created_at)) / 1000)
          : 0;
        setElapsedTime(elapsed);
        setIsWorkoutActive(true);
        
        console.log('[ActiveWorkoutContext] Loaded workout progress on refresh:', progress);
      } catch (err) {
        console.error('Error checking for active workout:', err);
      } finally {
        setLoading(false);
      }
    };
    checkForActiveWorkout();
  }, [user]);

  // Whenever a new workout is active, fetch any logged sets for it
  useEffect(() => {
    if (!activeWorkout?.id) return;
    supabase
      .from('sets')
      .select('*')
      .eq('workout_id', activeWorkout.id)
      .then(({ data: setsData, error }) => {
        if (error) {
          console.error('Error fetching sets for active workout:', error);
          return;
        }
        const progress = {};
        setsData.forEach((s) => {
          if (!progress[s.exercise_id]) progress[s.exercise_id] = [];
          progress[s.exercise_id].push({
            id: s.id,
            routine_set_id: s.routine_set_id,
            reps: s.reps,
            weight: s.weight,
            unit: s.weight_unit || 'lbs',
            weight_unit: s.weight_unit || 'lbs',
            set_variant: s.set_variant,
            set_type: s.set_type,
            timed_set_duration: s.timed_set_duration,
            status: s.status ?? 'pending', // Include status from DB (default to pending)
          });
        });
        setWorkoutProgress(progress);
      });
  }, [activeWorkout?.id]);

  useEffect(() => {
    let timer;
    if (isWorkoutActive && !isPaused) {
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isWorkoutActive, isPaused]);

// Realtime subscriptions for active workout across clients
useEffect(() => {
  if (!activeWorkout?.id || !user?.id) return;
  
  // Subscribe to workout status changes (completion/updates)
  const workoutChan = supabase
    .channel(`public:workouts:id=eq.${activeWorkout.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `id=eq.${activeWorkout.id}` }, ({ eventType, new: w, old }) => {
      console.log('[Real-time] Workout change:', eventType, w, old);
      
      if (eventType === 'UPDATE') {
        // Sync last exercise across clients
        if (w.last_workout_exercise_id && w.last_workout_exercise_id !== activeWorkout?.lastExerciseId) {
          setActiveWorkout(prev => prev ? { ...prev, lastExerciseId: w.last_workout_exercise_id } : prev);
        }
        
        // Handle workout completion
        setIsWorkoutActive(w.is_active);
        if (!w.is_active) {
          console.log('[Real-time] Workout ended remotely, navigating...');
          // Navigate to completed workout before clearing state (for remote workout endings)
          if (activeWorkout?.id && w.completed_at) {
            navigate(`/history/${activeWorkout.id}`);
          } else {
            // Workout was ended but no completion timestamp (shouldn't happen, but handle gracefully)
            navigate('/routines');
          }
          setActiveWorkout(null);
          setWorkoutProgress({});
          setElapsedTime(0);
          setIsPaused(false);
        }
      } else if (eventType === 'DELETE') {
        console.log('[Real-time] Workout deleted remotely, ending local session...');
        // Workout was deleted (no sets logged), end local session
        setIsWorkoutActive(false);
        setActiveWorkout(null);
        setWorkoutProgress({});
        setElapsedTime(0);
        setIsPaused(false);
        navigate('/routines');
      }
    })
    .subscribe();
  
  // Subscribe to workout deletions by user_id (catches deletions that specific workout subscription misses)
  const userWorkoutChan = supabase
    .channel(`user:workouts:${user.id}`)
    .on('postgres_changes', { 
      event: 'DELETE', 
      schema: 'public', 
      table: 'workouts', 
      filter: `user_id=eq.${user.id}` 
    }, ({ old }) => {
      console.log('[Real-time] User workout deleted:', old);
      // If the deleted workout was our active workout, end the session
      if (old && String(old.id) === String(activeWorkout?.id)) {
        console.log('[Real-time] Active workout deleted remotely, ending session...');
        setIsWorkoutActive(false);
        setActiveWorkout(null);
        setWorkoutProgress({});
        setElapsedTime(0);
        setIsPaused(false);
        navigate('/routines');
      }
    })
    .subscribe();

  // Subscribe to set logs for this workout
  const setsChan = supabase
    .channel(`public:sets:workout_id=eq.${activeWorkout.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sets', filter: `workout_id=eq.${activeWorkout.id}` }, ({ eventType, new: row, old }) => {
      setWorkoutProgress(prev => {
        const prog = { ...prev };
        const list = prog[row.exercise_id] ? [...prog[row.exercise_id]] : [];
        if (eventType === 'INSERT') {
          list.push({
            id: row.id,
            routine_set_id: row.routine_set_id,
            reps: row.reps,
            weight: row.weight,
            unit: row.weight_unit || 'lbs',
            weight_unit: row.weight_unit || 'lbs',
            set_variant: row.set_variant,
            set_type: row.set_type,
            timed_set_duration: row.timed_set_duration,
            status: row.status || 'complete',
          });
        } else if (eventType === 'UPDATE') {
          const idx = list.findIndex(s => s.id === row.id);
          if (idx !== -1) {
            list[idx] = {
              ...list[idx],
              reps: row.reps,
              weight: row.weight,
              weight_unit: row.weight_unit || 'lbs',
              set_variant: row.set_variant,
              set_type: row.set_type,
              timed_set_duration: row.timed_set_duration,
              status: row.status || 'complete',
            };
          }
        } else if (eventType === 'DELETE') {
          const idx = list.findIndex(s => s.id === old?.id);
          if (idx !== -1) list.splice(idx, 1);
        }
        prog[row.exercise_id] = list;
        return prog;
      });
    })
    .subscribe();

  return () => {
    void workoutChan.unsubscribe();
    void userWorkoutChan.unsubscribe();
    void setsChan.unsubscribe();
  };
}, [activeWorkout?.id, user?.id, navigate]);

// Auto-navigate into any new active workout for this user (delegate or delegator), and initialize context
useEffect(() => {
  if (!user?.id) return;
  const globalChan = supabase
    .channel('global-workouts')
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'workouts', filter: `user_id=eq.${user.id}`
    }, async ({ new: w }) => {
      console.log('[Realtime][global new workout]', w);
      if (!activeWorkout?.id) {
        try {
          // Fetch full workout record with routine join
          const { data: workoutRec, error: fetchErr } = await supabase
            .from('workouts')
            .select('id, routine_id, workout_name, created_at, last_workout_exercise_id, routines!workouts_routine_id_fkey(routine_name)')
            .eq('id', w.id)
            .maybeSingle();
          if (fetchErr || !workoutRec) {
            console.error('Error fetching new active workout:', fetchErr);
            return;
          }
          // Initialize context state
          const workoutData = {
            id: workoutRec.id,
            programId: workoutRec.routine_id,
            workoutName: workoutRec.workout_name,
            routineName: workoutRec.routines?.routine_name || '',
            startTime: workoutRec.created_at,
            lastExerciseId: workoutRec.last_workout_exercise_id || null,
          };
          setActiveWorkout(workoutData);
          setIsWorkoutActive(true);
          // Compute elapsed time from start
          const elapsed = workoutRec.created_at
            ? Math.floor((new Date() - new Date(workoutRec.created_at)) / 1000)
            : 0;
          setElapsedTime(elapsed);
          setIsPaused(false);
          setWorkoutProgress({});
          // Navigate into the record page
          navigate('/workout/active');
        } catch (e) {
          console.error('Error initializing remote workout:', e);
        }
      }
    })
    .subscribe();

  return () => void globalChan.unsubscribe();
}, [user?.id, activeWorkout?.id, navigate]);

  const startWorkout = useCallback(async (program) => {
    if (!user) throw new Error("User not authenticated.");

    // 1) Make sure there isn't already an active workout for this user.
    //    If there is, mark it complete so the unique-constraint (or RLS) on
    //    `is_active = true` won't block a new insert.
    try {
      await supabase
        .from("workouts")
        .update({ is_active: false, completed_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("is_active", true);
    } catch (e) {
      console.warn("Failed to auto-close previous active workouts", e);
      // not fatal – continue
    }

    const workoutName = generateWorkoutName();

    // Try creating a new active workout; if one already exists, fetch that instead
    let workout;
    try {
      const { data: inserted, error: insertErr } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          routine_id: program.id,
          workout_name: workoutName,
          is_active: true,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      workout = inserted;
    } catch (e) {
      if (e.code === '23505') {
        console.warn('Active workout already exists; fetching existing record');
        const { data: existing, error: fetchErr } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();
        if (fetchErr) throw fetchErr;
        workout = existing;
      } else {
        console.error('Error creating workout:', e);
        throw new Error(e.message || 'Could not start workout. Please try again.');
      }
    }
    
    const workoutData = {
      id: workout.id,
      programId: program.id,
      workoutName,
      routineName: program.routine_name || '',
      startTime: workout.created_at,
      lastExerciseId: null,
    };

    // Snapshot initial exercises for this workout
    try {
      const snapshotPayload = program.routine_exercises.map((progEx, idx) => ({
        workout_id: workout.id,
        exercise_id: progEx.exercise_id,
        exercise_order: progEx.exercise_order || idx + 1,
        snapshot_name: progEx.exercises.name,
      }));
      const { error: snapshotError } = await supabase
        .from("workout_exercises")
        .insert(snapshotPayload);
      if (snapshotError) console.error("Error snapshotting exercises:", snapshotError);
    } catch (err) {
      console.error("Error snapshotting exercises for workout start:", err);
    }

    // Only update context state after snapshot insert is done
    setActiveWorkout(workoutData);
    setIsWorkoutActive(true);
    setElapsedTime(0);
    setIsPaused(false);
    setWorkoutProgress({});

    const exercises = program.routine_exercises.reduce((acc, progEx) => {
      acc[progEx.exercise_id] = {
        name: progEx.exercises.name,
        program_exercise_id: progEx.id,
        sets: progEx.routine_sets.map(ps => ({
          id: null, // this will be the `sets` table id, populated on completion
          program_set_id: ps.id, // Storing the routine_set id.
          reps: ps.reps,
          weight: ps.weight,
          unit: ps.weight_unit,
          status: 'pending', // pending, active, complete
          set_variant: ps.set_variant
        })),
      };
      return acc;
    }, {});

    return workoutData;
  }, [user]);

  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  const endWorkout = useCallback(async () => {
    if (!activeWorkout?.id) return false;
    let saved = false;
    try {
      // Check if any completed sets have been logged for this workout
      const { count: setCount, error: countError } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', activeWorkout.id)
        .eq('status', 'complete');

      if (countError) {
        console.error('Error counting sets for workout:', countError);
      }

      if (setCount === 0) {
        // No sets logged – delete the workout entirely instead of marking complete
        const { error: deleteError } = await supabase
          .from('workouts')
          .delete()
          .eq('id', activeWorkout.id);

        if (deleteError) {
          console.error('Error deleting empty workout:', deleteError);
        }
        saved = false;
      } else {
        // Sets exist – mark workout as completed
        const { error } = await supabase
          .from('workouts')
          .update({
            is_active: false,
            duration_seconds: elapsedTime,
            completed_at: new Date().toISOString(),
          })
          .eq('id', activeWorkout.id);

        if (error) {
          console.error('Error ending workout:', error);
        }
        saved = true;
      }
    } catch (err) {
      console.error('Unexpected error ending workout:', err);
    }

    // Reset local state regardless of outcome
    setIsWorkoutActive(false);
    setActiveWorkout(null);
    setElapsedTime(0);
    setIsPaused(false);
    setWorkoutProgress({});
    return saved;
  }, [activeWorkout, elapsedTime]);

  const updateWorkoutProgress = useCallback(async (exerciseId, updates) => {
    // Store previous state for potential rollback
    const previousState = workoutProgress[exerciseId] || [];
    
    // OPTIMISTIC UPDATE: Immediately update local state
    setWorkoutProgress(prev => {
      const prevSets = prev[exerciseId] || [];
      let newSets = [...prevSets];

      updates.forEach((update) => {
        const targetRoutineSetId = update.changes.routine_set_id;
        const targetId = update.id;

        // Update existing row or append new one
        const setIdx = newSets.findIndex(
          (s) => String(s.routine_set_id) === String(targetRoutineSetId)
        );

        const updatedRow = {
          ...update.changes,
          id: targetId || `temp-${Date.now()}-${Math.random()}`, // Use temp ID if no real ID
          routine_set_id: targetRoutineSetId,
          status: update.changes.status || 'pending',
          isOptimistic: !targetId || targetId.length <= 10, // Flag for optimistic updates
        };

        if (setIdx !== -1) {
          newSets[setIdx] = { ...newSets[setIdx], ...updatedRow };
        } else {
          newSets.push(updatedRow);
        }
      });

      // Deduplicate rows by routine_set_id to avoid duplicates
      const deduped = Array.from(
        new Map(
          newSets.map((s) => [String(s.routine_set_id), s])
        ).values()
      );
      return { ...prev, [exerciseId]: deduped };
    });

    // DATABASE OPERATIONS: Perform actual database operations
    try {
      const dbOperations = updates.map(async (update) => {
        const targetRoutineSetId = update.changes.routine_set_id;
        const targetId = update.id;

        try {
          // Check if we have a real database ID
          if (targetId && typeof targetId === 'string' && targetId.length > 10) {
            // Build update payload
            const updatePayload = {
              reps: Number(update.changes.reps) || 0,
              weight: Number(update.changes.weight) || 0,
              weight_unit: update.changes.weight_unit || update.changes.unit || 'lbs',
              set_variant: update.changes.set_variant || 'Set 1',
              set_type: update.changes.set_type || 'reps',
              status: update.changes.status || 'pending',
            };
            // Only add timed_set_duration if it's a timed set and has a valid value
            if (update.changes.set_type === 'timed' && update.changes.timed_set_duration) {
              updatePayload.timed_set_duration = Number(update.changes.timed_set_duration);
            }

            const { error } = await supabase
              .from('sets')
              .update(updatePayload)
              .eq('id', targetId);
            if (error) {
              console.error('updateWorkoutProgress: DB update error', error);
              throw error;
            }
            return { update, dbId: targetId };
          } else {
            // Build insert payload
            const insertPayload = {
              workout_id: activeWorkout.id,
              exercise_id: exerciseId,
              routine_set_id: targetRoutineSetId,
              reps: Number(update.changes.reps) || 0,
              weight: Number(update.changes.weight) || 0,
              weight_unit: update.changes.weight_unit || update.changes.unit || 'lbs',
              set_variant: update.changes.set_variant || 'Set 1',
              set_type: update.changes.set_type || 'reps',
              status: update.changes.status || 'pending',
            };
            // Only add timed_set_duration if it's a timed set and has a valid value
            if (update.changes.set_type === 'timed' && update.changes.timed_set_duration) {
              insertPayload.timed_set_duration = Number(update.changes.timed_set_duration);
            }

            const { data: inserted, error } = await supabase
              .from('sets')
              .insert(insertPayload)
              .select()
              .single();
            if (error) {
              console.error('updateWorkoutProgress: DB insert error', error);
              throw error;
            }
            return { update, dbId: inserted.id };
          }
        } catch (e) {
          console.error('updateWorkoutProgress: persistence exception', e);
          throw e;
        }
      });

      // Wait for all database operations to complete
      const dbResults = await Promise.all(dbOperations);

      // CONFIRM OPTIMISTIC UPDATE: Replace temp IDs with real database IDs
      setWorkoutProgress(prev => {
        const prevSets = prev[exerciseId] || [];
        let newSets = [...prevSets];

        dbResults.forEach((result) => {
          if (!result || !result.update) return;

          const { update, dbId } = result;
          const targetRoutineSetId = update.changes.routine_set_id;

          // Find and update the optimistic set with real database ID
          const setIdx = newSets.findIndex(
            (s) => String(s.routine_set_id) === String(targetRoutineSetId)
          );

          if (setIdx !== -1) {
            newSets[setIdx] = { 
              ...newSets[setIdx], 
              id: dbId, // Replace temp ID with real ID
              isOptimistic: false, // Remove optimistic flag
            };
          }
        });

        // Deduplicate rows by routine_set_id to avoid duplicates
        const deduped = Array.from(
          new Map(
            newSets.map((s) => [String(s.routine_set_id), s])
          ).values()
        );
        return { ...prev, [exerciseId]: deduped };
      });

    } catch (error) {
      // ROLLBACK ON ERROR: Revert the optimistic update
      console.error('[updateWorkoutProgress] Database operation failed, rolling back:', error);
      setWorkoutProgress(prev => ({
        ...prev,
        [exerciseId]: previousState
      }));
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  }, [activeWorkout, workoutProgress]);

  const saveSet = useCallback(async (exerciseId, setConfig) => {
    if (!activeWorkout?.id || !user?.id) {
        console.error("Cannot save set: no active workout or user.");
        return;
    }

    // Store previous state for potential rollback
    const previousState = workoutProgress[exerciseId] || [];

    // OPTIMISTIC UPDATE: Immediately add the set to local state
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    setWorkoutProgress(prev => {
      const exerciseProgress = prev[exerciseId] || [];
      const optimisticSet = { 
        ...setConfig, 
        id: tempId,
        status: setConfig.status || 'complete',
        isOptimistic: true 
      };
      return { ...prev, [exerciseId]: [...exerciseProgress, optimisticSet] };
    });

    // DATABASE OPERATION: Save to database
    try {
      // ------------------------------------------------------------------
      //  Build payload for new set row
      // ------------------------------------------------------------------
      // A set can originate from a program (program_set_id) or be ad-hoc.  In the
      // latter case we generate a temporary id (e.g. "temp-0") to track it in
      // local state.  Attempting to persist this temp id will fail because the
      // `program_set_id` column expects a valid UUID that references
      // `program_sets(id)`.  Therefore we must validate the value before adding
      // it to the insert payload.

      const {
          routine_set_id: routineSetIdField,
          id: maybeId,
          ...restOfSetConfig
      } = setConfig;

      // Prefer an explicit program_set_id field; fall back to the legacy `id`
      // property (used to piggy-back the program_set_id prior to persistence).
      const rawRoutineSetId = routineSetIdField || maybeId;

      const payload = {
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          set_variant: restOfSetConfig.set_variant,
      };

      /* ---------- reps ---------- */
      if (restOfSetConfig.set_type === 'timed') {
          // Timed sets don’t require reps – NULL is valid
          payload.reps = null;
      } else if (restOfSetConfig.reps !== undefined) {
          payload.reps = Number(restOfSetConfig.reps);
      }

      /* ---------- unit & weight ---------- */
      payload.weight_unit = restOfSetConfig.unit || 'lbs';
       
      // Weight: preserve the actual weight value even for body-weight sets
      if (restOfSetConfig.weight !== undefined) {
          payload.weight = Number(restOfSetConfig.weight);
      }

      // Only include program_set_id if it is a valid UUID (prevents foreign-key
      // errors from temp ids like "temp-0").
      if (rawRoutineSetId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawRoutineSetId)) {
          payload.routine_set_id = rawRoutineSetId;
      }

      // Include timed set fields when relevant
      if (restOfSetConfig.set_type) {
          payload.set_type = restOfSetConfig.set_type;
      }
      if (restOfSetConfig.timed_set_duration !== undefined) {
          payload.timed_set_duration = Number(restOfSetConfig.timed_set_duration);
      }

      /* ---------- status & ordering ---------- */
      payload.status = restOfSetConfig.status || 'complete';

      // Determine the next set_order for this exercise
      const { data: maxRow } = await supabase
        .from('sets')
        .select('set_order')
        .eq('workout_id', activeWorkout.id)
        .eq('exercise_id', exerciseId)
        .order('set_order', { ascending: false })
        .limit(1)
        .maybeSingle();
      payload.set_order = (maxRow?.set_order || 0) + 1;

      // DEBUG: log the payload we are about to send
      console.log('[saveSet] inserting payload', payload);

      const { data, error } = await supabase
          .from('sets')
          .insert(payload)
          .select()
          .single();
      // DEBUG: inspect inserted row
      console.log('[saveSet] inserted row', data, 'error', error);
      console.log('[saveSet] inserted row status', data.status, 'set_order', data.set_order);
      
      if (error) {
          console.error("Error saving set:", error);
          throw error;
      }

      // CONFIRM OPTIMISTIC UPDATE: Replace temp ID with real database ID
      setWorkoutProgress(prev => {
        const exerciseProgress = prev[exerciseId] || [];
        const setIndex = exerciseProgress.findIndex(s => s.id === tempId);

        const newExerciseProgress = [...exerciseProgress];

        if (setIndex !== -1) {
            // Found the optimistic set, update it with real database data
            newExerciseProgress[setIndex] = { 
              ...newExerciseProgress[setIndex], 
              ...data, 
              id: data.id, // Replace temp ID with real ID
              isOptimistic: false // Remove optimistic flag
            };
        } else {
            // Did not find optimistic set (rare), so add it normally
            newExerciseProgress.push({ ...setConfig, ...data });
        }

        return { ...prev, [exerciseId]: newExerciseProgress };
      });

    } catch (error) {
      // ROLLBACK ON ERROR: Revert the optimistic update
      console.error('[saveSet] Database operation failed, rolling back:', error);
      setWorkoutProgress(prev => ({
        ...prev,
        [exerciseId]: previousState
      }));
      
      // Re-throw the error so calling code can handle it
      throw error;
    }
  }, [activeWorkout, user, workoutProgress]);

  const updateSet = useCallback(async (setId, changes) => {
    if (!activeWorkout?.id || !user?.id) {
      console.error("Cannot update set: no active workout or user.");
      return;
    }
    // In-session updates before a set is saved to the DB won't have a setId
    if (!setId) return;

    // Filter out local-only fields before sending to DB
    const { status, ...dbChanges } = changes;

    if (dbChanges.unit) {
      dbChanges.weight_unit = dbChanges.unit;
      delete dbChanges.unit;
    }

    // Include status in database updates if provided
    if (status) {
      dbChanges.status = status;
    }

    if (Object.keys(dbChanges).length === 0) return;

    try {
      // First, check if a row with this ID even exists.
      const { data: existingSet, error: checkError } = await supabase
        .from('sets')
        .select('id')
        .eq('id', setId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for set before update:", checkError);
        return;
      }

      if (!existingSet) {
        // Set has not yet been saved to the database; no update necessary.
        return;
      }

      const { data, error } = await supabase
        .from('sets')
        .update({
          ...dbChanges,
          reps: dbChanges.reps !== undefined ? Number(dbChanges.reps) : undefined,
          weight: dbChanges.weight !== undefined ? Number(dbChanges.weight) : undefined,
        })
        .eq('id', setId)
        .select(); // removed .single()

      if (error) {
        console.error("Error updating set:", error);
      } else if (data && data.length === 1) {
        // Update local state with the new set data
        setWorkoutProgress(prev => {
          const newProgress = { ...prev };
          for (const exerciseId in newProgress) {
            newProgress[exerciseId] = newProgress[exerciseId].map(s =>
              String(s.id) === String(setId) ? { ...s, ...data[0] } : s
            );
          }
          return newProgress;
        });
      } else {
        // No rows updated (rare once existence is checked). Silently ignore.
      }
    } catch (err) {
      console.error("Error updating set:", err);
    }
  }, [activeWorkout, user]);

  const updateLastExercise = useCallback(async (workoutExerciseId) => {
    if (!activeWorkout?.id) {
      console.warn('[updateLastExercise] no activeWorkout.id, skipping', workoutExerciseId);
      return;
    }
    console.log('[updateLastExercise] attempting to set last_workout_exercise_id to', workoutExerciseId, 'for workout', activeWorkout.id);
    // Optimistically update local state
    setActiveWorkout(prev => prev ? { ...prev, lastExerciseId: workoutExerciseId } : prev);
    try {
      const { data: updatedRows, error: updateErr } = await supabase
        .from('workouts')
        .update({ last_workout_exercise_id: workoutExerciseId })
        .eq('id', activeWorkout.id)
        .select('id, last_workout_exercise_id');
      if (updateErr) {
        console.error('[updateLastExercise] DB error:', updateErr);
      } else {
        console.log('[updateLastExercise] DB update success, rows:', updatedRows);
      }
    } catch (err) {
      console.error('[updateLastExercise] exception:', err);
    }
  }, [activeWorkout]);

  return (
    <ActiveWorkoutContext.Provider 
      value={{ 
        activeWorkout, 
        isWorkoutActive, 
        startWorkout,
        elapsedTime,
        isPaused,
        togglePause,
        endWorkout,
        workoutProgress,
        updateWorkoutProgress,
        saveSet,
        updateSet,
        updateLastExercise,
        loading
      }}
    >
      {!loading && children}
    </ActiveWorkoutContext.Provider>
  );
}

export const useActiveWorkout = () => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
}; 