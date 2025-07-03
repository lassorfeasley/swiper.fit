import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useAuth } from './AuthContext';
import { generateWorkoutName } from '@/lib/utils';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const { user } = useAuth();
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
          .select('*, routines(routine_name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        if (!workout || workoutError) {
          setLoading(false);
          return;
        }
        // Build workout context data
        const workoutData = {
          id: workout.id,
          programId: workout.routine_id,
          name: workout.routines?.routine_name || workout.workout_name || 'Workout',
          startTime: workout.created_at,
          lastExerciseId: workout.last_exercise_id || null,
        };
        setActiveWorkout(workoutData);
        // Fetch all sets logged for this workout (including pending ones)
        const { data: setsData, error: setsError } = await supabase
          .from('sets')
          .select('*')
          .eq('workout_id', workout.id);
        const progress = {};
        if (setsData && !setsError) {
          setsData.forEach(s => {
            if (!progress[s.exercise_id]) progress[s.exercise_id] = [];
            progress[s.exercise_id].push({
              id: s.id,
              routine_set_id: s.routine_set_id,
              reps: s.reps,
              weight: s.weight,
              unit: s.weight_unit,
              weight_unit: s.weight_unit,
              set_variant: s.set_variant,
              set_type: s.set_type,
              timed_set_duration: s.timed_set_duration,
              status: s.status || 'complete', // Include status from DB
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
            unit: s.weight_unit,
            weight_unit: s.weight_unit,
            set_variant: s.set_variant,
            set_type: s.set_type,
            timed_set_duration: s.timed_set_duration,
            status: s.status || 'complete', // Include status from DB
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

    const { data: workout, error } = await supabase
      .from("workouts")
      .insert({
        user_id: user.id,
        routine_id: program.id,
        workout_name: workoutName,
        is_active: true,
      })
      .select()
      .single();

    if (error || !workout) {
      console.error("Error creating workout:", error);
      // Surface Supabase error if available to help debugging
      throw new Error(error?.message || "Could not start workout. Please try again.");
    }
    
    const workoutData = {
      id: workout.id,
      programId: program.id,
      name: workoutName,
      startTime: workout.created_at,
      lastExerciseId: null,
    };

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
    if (!activeWorkout?.id) return;

    try {
      // Check if any sets have been logged for this workout
      const { count: setCount, error: countError } = await supabase
        .from('sets')
        .select('*', { count: 'exact', head: true })
        .eq('workout_id', activeWorkout.id);

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
  }, [activeWorkout, elapsedTime]);

  const updateWorkoutProgress = useCallback(async (exerciseId, updates) => {
    console.log('[updateWorkoutProgress] Starting with updates:', { exerciseId, updates });
    
    // Handle database persistence first, then update local state
    const dbOperations = updates.map(async (update) => {
      const targetRoutineSetId = update.changes.routine_set_id;
      const targetId = update.id;

      console.log('[updateWorkoutProgress] Processing update:', { targetId, targetRoutineSetId, changes: update.changes });

      try {
        // Check if we have a real database ID
        if (targetId && typeof targetId === 'string' && targetId.length > 10) {
          console.log('[updateWorkoutProgress] Updating existing row:', targetId);
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
          console.log('[updateWorkoutProgress] Update payload:', updatePayload);

          const { error } = await supabase
            .from('sets')
            .update(updatePayload)
            .eq('id', targetId);
          if (error) console.error('updateWorkoutProgress: DB update error', error);
          return { update, dbId: targetId };
        } else {
          console.log('[updateWorkoutProgress] Inserting new row for routine_set_id:', targetRoutineSetId);
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
          console.log('[updateWorkoutProgress] Insert payload:', insertPayload);

          const { data: inserted, error } = await supabase
            .from('sets')
            .insert(insertPayload)
            .select()
            .single();
          if (error) {
            console.error('updateWorkoutProgress: DB insert error', error);
            return null;
          }
          console.log('[updateWorkoutProgress] Successfully inserted:', inserted);
          return { update, dbId: inserted.id };
        }
      } catch (e) {
        console.error('updateWorkoutProgress: persistence exception', e);
        return null;
      }
    });

    // Wait for all database operations to complete
    const dbResults = await Promise.all(dbOperations);
    console.log('[updateWorkoutProgress] DB operations completed:', dbResults);

    // Now update local state with the results
    setWorkoutProgress(prev => {
      const prevSets = prev[exerciseId] || [];
      let newSets = [...prevSets];

      dbResults.forEach((result) => {
        if (!result || !result.update) return;

        const { update, dbId } = result;
        const targetRoutineSetId = update.changes.routine_set_id;
        const targetId = update.id;

        // Find existing set in local state
        const setIdx = newSets.findIndex(s => {
          if (targetRoutineSetId) return String(s.routine_set_id) === String(targetRoutineSetId);
          return String(s.id) === String(targetId);
        });

        if (setIdx !== -1) {
          newSets[setIdx] = {
            ...newSets[setIdx],
            ...update.changes,
            id: dbId || newSets[setIdx].id,
            status: update.changes.status || newSets[setIdx].status || 'pending'
          };
        } else {
          newSets.push({
            ...update.changes,
            id: dbId || update.id,
            routine_set_id: targetRoutineSetId,
            status: update.changes.status || 'pending'
          });
        }
      });

      console.log('[updateWorkoutProgress] Updated local state:', { exerciseId, newSets });
      return { ...prev, [exerciseId]: newSets };
    });
  }, [activeWorkout]);

  const saveSet = useCallback(async (exerciseId, setConfig) => {
    if (!activeWorkout?.id || !user?.id) {
        console.error("Cannot save set: no active workout or user.");
        return;
    }

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

    const isTimed = restOfSetConfig.set_type === 'timed';

    // For debugging: set reps=1 for timed sets; otherwise use provided reps
    if (isTimed) {
        payload.reps = 1; // temporary diagnostic value
    } else if (restOfSetConfig.reps !== undefined) {
        payload.reps = Number(restOfSetConfig.reps);
    }

    // Always include weight_unit – even for body-weight sets – to satisfy NOT-NULL.
    if (restOfSetConfig.unit) {
        payload.weight_unit = restOfSetConfig.unit;
    }

    // Weight: store 0 for body-weight sets, otherwise the provided value (if any)
    if (restOfSetConfig.unit === 'body') {
        payload.weight = 0;
    } else if (restOfSetConfig.weight !== undefined) {
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

    // Include status to properly mark completed sets in the database
    if (restOfSetConfig.status) {
        payload.status = restOfSetConfig.status;
    }

    // DEBUG: log the payload we are about to send
    console.log('[saveSet] inserting payload', payload);

    const { data, error } = await supabase
        .from('sets')
        .insert(payload)
        .select()
        .single();
    
    if (error) {
        console.error("Error saving set:", error);
        throw error;
    } else {
      // Update local state with the actual ID from the database
      setWorkoutProgress(prev => {
        const exerciseProgress = prev[exerciseId] || [];
        const setIndex = exerciseProgress.findIndex(s => String(s.routine_set_id) === String(setConfig.routine_set_id));

        const newExerciseProgress = [...exerciseProgress];

        if (setIndex !== -1) {
            // Found the set, update it. Merge existing, new DB data, and ensure status from the initiating call is respected.
            newExerciseProgress[setIndex] = { ...newExerciseProgress[setIndex], ...data, status: setConfig.status };
        } else {
            // Did not find set (due to state batching), so add it.
            // Build the set from `setConfig` (which has the correct status) and `data` (which has the DB ID).
            newExerciseProgress.push({ ...setConfig, ...data });
        }

        return { ...prev, [exerciseId]: newExerciseProgress };
      });
    }
  }, [activeWorkout, user]);

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

  const updateLastExercise = useCallback(async (exerciseId) => {
    if (!activeWorkout?.id) return;
    // Optimistically update state first
    setActiveWorkout(prev => ({ ...prev, lastExerciseId: exerciseId }));
  
    try {
      await supabase
        .from('workouts')
        .update({ last_exercise_id: exerciseId })
        .eq('id', activeWorkout.id);
    } catch (err) {
      console.error('Failed to update last_exercise_id:', err);
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