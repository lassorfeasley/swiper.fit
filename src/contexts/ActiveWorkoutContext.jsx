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
          .select('*, routines(program_name)')
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
          programId: workout.program_id,
          name: workout.routines?.program_name || workout.workout_name || 'Workout',
          startTime: workout.created_at,
          lastExerciseId: workout.last_exercise_id || null,
        };
        setActiveWorkout(workoutData);
        // Fetch all sets logged for this workout
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
              program_set_id: s.program_set_id,
              reps: s.reps,
              weight: s.weight,
              unit: s.weight_unit,
              weight_unit: s.weight_unit,
              set_variant: s.set_variant,
              status: 'complete',
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
            program_set_id: s.program_set_id,
            reps: s.reps,
            weight: s.weight,
            unit: s.weight_unit,
            weight_unit: s.weight_unit,
            set_variant: s.set_variant,
            status: 'complete',
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

    const workoutName = generateWorkoutName();

    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        program_id: program.id,
        workout_name: workoutName,
        is_active: true,
      })
      .select()
      .single();

    if (error || !workout) {
      console.error("Error creating workout:", error);
      throw new Error("Could not start workout. Please try again.");
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
    
    const exercises = program.program_exercises.reduce((acc, progEx) => {
      acc[progEx.exercise_id] = {
        name: progEx.exercises.name,
        program_exercise_id: progEx.id,
        sets: progEx.program_sets.map(ps => ({
          id: null, // this will be the `sets` table id, populated on completion
          program_set_id: ps.id, // Storing the program_set id.
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
    setWorkoutProgress(prev => {
      const prevSets = prev[exerciseId] || [];
      
      let newSets = [...prevSets];

      updates.forEach(update => {
        const targetProgramSetId = update.changes.program_set_id;
        const targetId = update.id;
        const setIdx = newSets.findIndex(s => {
          if (targetProgramSetId) return String(s.program_set_id) === String(targetProgramSetId);
          return String(s.id) === String(targetId);
        });

        if (setIdx !== -1) {
          newSets[setIdx] = { ...newSets[setIdx], ...update.changes };
        } else {
          newSets.push({ ...update.changes, id: update.id });
        }
      });

      return { ...prev, [exerciseId]: newSets };
    });
  }, []);

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
        program_set_id: programSetIdField,
        id: maybeId,
        ...restOfSetConfig
    } = setConfig;

    // Prefer an explicit program_set_id field; fall back to the legacy `id`
    // property (used to piggy-back the program_set_id prior to persistence).
    const rawProgramSetId = programSetIdField || maybeId;

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
    if (rawProgramSetId && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(rawProgramSetId)) {
        payload.program_set_id = rawProgramSetId;
    }

    // Include timed set fields when relevant
    if (restOfSetConfig.set_type) {
        payload.set_type = restOfSetConfig.set_type;
    }
    if (restOfSetConfig.timed_set_duration !== undefined) {
        payload.timed_set_duration = Number(restOfSetConfig.timed_set_duration);
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
        const setIndex = exerciseProgress.findIndex(s => String(s.program_set_id) === String(setConfig.program_set_id));

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

export function useActiveWorkout() {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
} 