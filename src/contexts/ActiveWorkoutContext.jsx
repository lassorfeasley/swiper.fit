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
        const { data, error } = await supabase
          .from('workouts')
          .select('*, sets(*), programs(program_name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (data && !error) {
          // Found an active workout, let's resume it
          const progress = {};
          if (data.sets) {
            data.sets.forEach(s => {
              if (!progress[s.exercise_id]) progress[s.exercise_id] = [];
              progress[s.exercise_id].push({
                id: s.id,
                program_set_id: s.program_set_id,
                reps: s.reps,
                weight: s.weight,
                unit: s.weight_unit,
                weight_unit: s.weight_unit,
                set_variant: s.set_variant,
                status: 'complete', // Assume sets in DB are complete
              });
            });
          }

          const workoutData = {
            id: data.id,
            programId: data.program_id,
            name: data.programs?.program_name || data.workout_name || 'Workout',
            startTime: data.created_at,
            lastExerciseId: data.last_exercise_id || null,
          };
          
          setActiveWorkout(workoutData);
          setWorkoutProgress(progress);
          const elapsed = data.created_at ? Math.floor((new Date() - new Date(data.created_at)) / 1000) : 0;
          setElapsedTime(elapsed);
          setIsWorkoutActive(true);
        }
      } catch (err) {
        console.error("Error checking for active workout:", err);
      } finally {
        setLoading(false);
      }
    };
    checkForActiveWorkout();
  }, [user]);


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

    const { id: program_set_id, ...restOfSetConfig } = setConfig;

    const newSet = {
      ...restOfSetConfig,
      status: 'complete',
      logged_at: new Date().toISOString(),
    };

    const payload = {
        workout_id: activeWorkout.id,
        exercise_id: exerciseId,
        reps: Number(restOfSetConfig.reps),
        weight: Number(restOfSetConfig.weight),
        weight_unit: restOfSetConfig.unit,
        set_variant: restOfSetConfig.set_variant,
    };

    if (program_set_id) {
        payload.program_set_id = program_set_id;
    }

    const { data, error } = await supabase
        .from('sets')
        .insert(payload)
        .select()
        .single();
    
    if (error) {
        console.error("Error saving set:", error);
        // Here you might want to handle the error, e.g., by reverting the optimistic update
    } else {
      // Update local state with the actual ID from the database
      setWorkoutProgress(prev => {
        const newSets = (prev[exerciseId] || []).map(s => 
          s.program_set_id === setConfig.program_set_id ? { ...s, ...data } : s
        );
        return { ...prev, [exerciseId]: newSets };
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