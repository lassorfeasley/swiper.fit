import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/supabaseClient';
import { useCurrentUser } from '@/contexts/AccountContext';
import { generateWorkoutName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAndUploadOGImage } from '@/lib/ogImageGenerator';

// Type definitions for workout data structures
interface Set {
  id: string;
  workout_id: string;
  exercise_id: string;
  status: string;
  set_type: string;
  reps?: number;
  timed_set_duration?: number;
  weight?: number;
  order_index: number;
}

interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_name: string;
  order_index: number;
  sets: Set[];
}

interface Workout {
  id: string;
  user_id: string;
  routine_id?: string;
  routine_name?: string;
  name: string;
  started_at: string;
  ended_at?: string;
  is_active: boolean;
  is_paused: boolean;
  exercises: WorkoutExercise[];
}

interface Program {
  id: string;
  name: string;
  exercises: any[];
}

interface ActiveWorkoutContextType {
  activeWorkout: Workout | null;
  isWorkoutActive: boolean;
  elapsedTime: number;
  loading: boolean;
  isPaused: boolean;
  isFinishing: boolean;
  startWorkout: (program: Program) => Promise<void>;
  endWorkout: () => Promise<void>;
  pauseWorkout: () => Promise<void>;
  resumeWorkout: () => Promise<void>;
  reactivateWorkout: (workoutId: string) => Promise<void>;
  updateLastExercise: (workoutExerciseId: string) => Promise<void>;
  markSetManuallyCompleted: (setId: string) => void;
  unmarkSetManuallyCompleted: (setId: string) => void;
  isSetManuallyCompleted: (setId: string) => boolean;
  markSetToasted: (setId: string) => void;
  isSetToasted: (setId: string) => boolean;
  clearWorkoutState: () => void;
  refreshActiveWorkout: (workoutId: string) => Promise<void>;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextType | null>(null);

interface ActiveWorkoutProviderProps {
  children: ReactNode;
}

export function ActiveWorkoutProvider({ children }: ActiveWorkoutProviderProps) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastExerciseIdChangeTrigger, setLastExerciseIdChangeTrigger] = useState<number>(0);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const isFinishingRef = useRef<boolean>(false);
  // Guard window to avoid transient pause right after start
  const startGuardUntilRef = useRef<number>(0);
  
  // Fire-and-forget Slack event
  const postSlackEvent = useCallback((event: string, data: any) => {
    try {
      const base = window?.location?.origin?.includes('localhost')
        ? 'https://www.swiper.fit' // call prod when running locally
        : '';
      fetch(`${base}/api/slack/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          context: { env: import.meta?.env?.MODE || 'production', source: 'client' },
          data,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch (_) {}
  }, []);
  
  console.log('[ActiveWorkout] Provider initialized with user:', user?.id);
  console.log('[ActiveWorkout] Full user object:', user);
  
  // Test if Supabase real-time is working at all
  useEffect(() => {
    console.log('[ActiveWorkout] Testing Supabase real-time connection');
    const testChan = supabase
      .channel('test-connection')
      .on('presence', { event: 'sync' }, () => {
        console.log('[ActiveWorkout] Real-time connection test successful');
      })
      .subscribe();
    
    return () => {
      testChan.unsubscribe();
    };
  }, []);

  // State for tracking manually completed sets and toast notifications
  const [manuallyCompletedSets, setManuallyCompletedSets] = useState<Set<string>>(new Set<string>());
  const [toastedSets, setToastedSets] = useState<Set<string>>(new Set<string>());

  // Check for active workout on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkForActiveWorkout = async () => {
      console.log('[ActiveWorkout] Checking for active workout for user:', user.id);
      
      try {
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select(`
            *,
            exercises:workout_exercises(
              *,
              sets:sets(
                *
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('started_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('[ActiveWorkout] Error fetching active workout:', error);
          setLoading(false);
          return;
        }

        if (workouts && workouts.length > 0) {
          const workout = workouts[0];
          console.log('[ActiveWorkout] Found active workout:', workout.id);
          
          // Sort exercises by order_index
          if (workout.exercises) {
            workout.exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index);
            
            // Sort sets within each exercise by order_index
            workout.exercises.forEach((exercise: WorkoutExercise) => {
              if (exercise.sets) {
                exercise.sets.sort((a: Set, b: Set) => a.order_index - b.order_index);
              }
            });
          }
          
          setActiveWorkout(workout);
          setIsWorkoutActive(true);
          
          // Calculate elapsed time
          const startTime = new Date(workout.started_at).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - startTime) / 1000);
          setElapsedTime(elapsed);
          
          // Start timer if workout is not paused
          if (!workout.is_paused) {
            const timer = setInterval(() => {
              setElapsedTime(prev => prev + 1);
            }, 1000);
            
            return () => clearInterval(timer);
          }
        } else {
          console.log('[ActiveWorkout] No active workout found');
          setActiveWorkout(null);
          setIsWorkoutActive(false);
        }
      } catch (error) {
        console.error('[ActiveWorkout] Error in checkForActiveWorkout:', error);
      } finally {
        setLoading(false);
      }
    };

    checkForActiveWorkout();
  }, [user]);

  // Real-time subscription for workout updates
  useEffect(() => {
    if (!user || !activeWorkout) return;

    console.log('[ActiveWorkout] Setting up real-time subscription for workout:', activeWorkout.id);

    const channel = supabase
      .channel(`workout-${activeWorkout.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `id=eq.${activeWorkout.id}`
      }, (payload) => {
        console.log('[ActiveWorkout] Workout update received:', payload);
        
        if (payload.eventType === 'UPDATE') {
          const updatedWorkout = payload.new as Workout;
          setActiveWorkout(prev => prev ? { ...prev, ...updatedWorkout } : null);
          
          if (typeof updatedWorkout.is_active === 'boolean') {
            setIsWorkoutActive(updatedWorkout.is_active);
          }
          
          if (updatedWorkout.is_active === false) {
            console.log('[ActiveWorkout] Workout ended via real-time update');
            navigate('/history');
          }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sets',
        filter: `workout_id=eq.${activeWorkout.id}`
      }, (payload) => {
        console.log('[ActiveWorkout] Set update received:', payload);
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const updatedSet = payload.new as Set;
          
          setActiveWorkout(prev => {
            if (!prev) return null;
            
            const updatedExercises = prev.exercises.map(exercise => {
              if (exercise.id === updatedSet.exercise_id) {
                const updatedSets = exercise.sets.map(set => 
                  set.id === updatedSet.id ? updatedSet : set
                );
                
                // If it's a new set, add it
                if (payload.eventType === 'INSERT') {
                  updatedSets.push(updatedSet);
                  updatedSets.sort((a, b) => a.order_index - b.order_index);
                }
                
                return { ...exercise, sets: updatedSets };
              }
              return exercise;
            });
            
            return { ...prev, exercises: updatedExercises };
          });
        }
      })
      .subscribe();

    return () => {
      console.log('[ActiveWorkout] Cleaning up real-time subscription');
      channel.unsubscribe();
    };
  }, [user, activeWorkout, navigate]);

  // Timer for elapsed time
  useEffect(() => {
    if (!isWorkoutActive || !activeWorkout?.is_paused) return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isWorkoutActive, activeWorkout?.is_paused]);

  const refreshActiveWorkout = useCallback(async (workoutId: string) => {
    console.log('[ActiveWorkout] Refreshing workout:', workoutId);
    
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            sets:sets(
              *
            )
          )
        `)
        .eq('id', workoutId)
        .single();

      if (error) {
        console.error('[ActiveWorkout] Error refreshing workout:', error);
        return;
      }

      if (workout) {
        // Sort exercises and sets
        if (workout.exercises) {
          workout.exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index);
          workout.exercises.forEach((exercise: WorkoutExercise) => {
            if (exercise.sets) {
              exercise.sets.sort((a: Set, b: Set) => a.order_index - b.order_index);
            }
          });
        }
        
        setActiveWorkout(workout);
        setIsWorkoutActive(workout.is_active);
      }
    } catch (error) {
      console.error('[ActiveWorkout] Error in refreshActiveWorkout:', error);
    }
  }, []);

  const startWorkout = useCallback(async (program: Program) => {
    if (!user) {
      console.error('[ActiveWorkout] Cannot start workout: no user');
      return;
    }

    console.log('[ActiveWorkout] Starting workout for program:', program.id);
    
    try {
      // Create workout
      const workoutName = generateWorkoutName(program.name);
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          routine_id: program.id,
          routine_name: program.name,
          name: workoutName,
          started_at: new Date().toISOString(),
          is_active: true,
          is_paused: false
        })
        .select()
        .single();

      if (workoutError) {
        console.error('[ActiveWorkout] Error creating workout:', workoutError);
        toast.error('Failed to start workout');
        return;
      }

      console.log('[ActiveWorkout] Created workout:', workout.id);

      // Create workout exercises and sets
      const exercisesToInsert = program.exercises.map((exercise: any, index: number) => ({
        workout_id: workout.id,
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        order_index: index
      }));

      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .insert(exercisesToInsert)
        .select();

      if (exercisesError) {
        console.error('[ActiveWorkout] Error creating workout exercises:', exercisesError);
        toast.error('Failed to create workout exercises');
        return;
      }

      // Create sets for each exercise
      const setsToInsert: any[] = [];
      workoutExercises.forEach((workoutExercise: any) => {
        const exercise = program.exercises.find((e: any) => e.id === workoutExercise.exercise_id);
        if (exercise && exercise.sets) {
          exercise.sets.forEach((set: any, setIndex: number) => {
            setsToInsert.push({
              workout_id: workout.id,
              exercise_id: workoutExercise.id,
              status: 'pending',
              set_type: set.set_type || 'reps',
              reps: set.reps,
              timed_set_duration: set.timed_set_duration,
              weight: set.weight,
              order_index: setIndex
            });
          });
        }
      });

      if (setsToInsert.length > 0) {
        const { error: setsError } = await supabase
          .from('sets')
          .insert(setsToInsert);

        if (setsError) {
          console.error('[ActiveWorkout] Error creating sets:', setsError);
          toast.error('Failed to create workout sets');
          return;
        }
      }

      // Refresh the workout data
      await refreshActiveWorkout(workout.id);
      
      // Navigate to active workout
      navigate(`/workout/${workout.id}`);
      
      // Post Slack event
      postSlackEvent('workout_started', {
        user_id: user.id,
        workout_id: workout.id,
        routine_name: program.name
      });

      toast.success('Workout started!');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error starting workout:', error);
      toast.error('Failed to start workout');
    }
  }, [user, navigate, refreshActiveWorkout, postSlackEvent]);

  const gatherWorkoutDataForOG = useCallback(async (workoutId: string) => {
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            sets:sets(
              *
            )
          )
        `)
        .eq('id', workoutId)
        .single();

      if (error) {
        console.error('[ActiveWorkout] Error gathering workout data for OG:', error);
        return null;
      }

      return workout;
    } catch (error) {
      console.error('[ActiveWorkout] Error in gatherWorkoutDataForOG:', error);
      return null;
    }
  }, []);

  const endWorkout = useCallback(async () => {
    if (!activeWorkout || isFinishingRef.current) {
      console.log('[ActiveWorkout] Cannot end workout: no active workout or already finishing');
      return;
    }

    console.log('[ActiveWorkout] Ending workout:', activeWorkout.id);
    isFinishingRef.current = true;
    setIsFinishing(true);

    try {
      // Update workout as ended
      const { error: updateError } = await supabase
        .from('workouts')
        .update({
          is_active: false,
          ended_at: new Date().toISOString()
        })
        .eq('id', activeWorkout.id);

      if (updateError) {
        console.error('[ActiveWorkout] Error ending workout:', updateError);
        toast.error('Failed to end workout');
        return;
      }

      // Generate and upload OG image
      const workoutData = await gatherWorkoutDataForOG(activeWorkout.id);
      if (workoutData) {
        try {
          await generateAndUploadOGImage(workoutData);
        } catch (ogError) {
          console.warn('[ActiveWorkout] Failed to generate OG image:', ogError);
        }
      }

      // Post Slack event
      postSlackEvent('workout_completed', {
        user_id: user?.id,
        workout_id: activeWorkout.id,
        routine_name: activeWorkout.routine_name
      });

      // Clear workout state
      setActiveWorkout(null);
      setIsWorkoutActive(false);
      setElapsedTime(0);
      setManuallyCompletedSets(new Set());
      setToastedSets(new Set());

      toast.success('Workout completed!');
      
      // Navigate to history
      navigate('/history');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error ending workout:', error);
      toast.error('Failed to end workout');
    } finally {
      isFinishingRef.current = false;
      setIsFinishing(false);
    }
  }, [activeWorkout, navigate, gatherWorkoutDataForOG, postSlackEvent, user]);

  const updateLastExercise = useCallback(async (workoutExerciseId: string) => {
    if (!activeWorkout) return;

    try {
      const { error } = await supabase
        .from('workouts')
        .update({ last_exercise_id: workoutExerciseId })
        .eq('id', activeWorkout.id);

      if (error) {
        console.error('[ActiveWorkout] Error updating last exercise:', error);
      }
    } catch (error) {
      console.error('[ActiveWorkout] Error in updateLastExercise:', error);
    }
  }, [activeWorkout]);

  const markSetManuallyCompleted = useCallback((setId: string) => {
    setManuallyCompletedSets(prev => new Set(prev).add(setId));
  }, []);

  const unmarkSetManuallyCompleted = useCallback((setId: string) => {
    setManuallyCompletedSets(prev => {
      const newSet = new Set(prev);
      newSet.delete(setId);
      return newSet;
    });
  }, []);

  const isSetManuallyCompleted = useCallback((setId: string) => {
    return manuallyCompletedSets.has(setId);
  }, [manuallyCompletedSets]);

  const markSetToasted = useCallback((setId: string) => {
    setToastedSets(prev => new Set(prev).add(setId));
  }, []);

  const isSetToasted = useCallback((setId: string) => {
    return toastedSets.has(setId);
  }, [toastedSets]);

  const clearWorkoutState = useCallback(() => {
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setElapsedTime(0);
    setManuallyCompletedSets(new Set());
    setToastedSets(new Set());
  }, []);

  const pauseWorkout = useCallback(async () => {
    if (!activeWorkout || activeWorkout.is_paused) return;

    console.log('[ActiveWorkout] Pausing workout:', activeWorkout.id);

    try {
      const { error } = await supabase
        .from('workouts')
        .update({ is_paused: true })
        .eq('id', activeWorkout.id);

      if (error) {
        console.error('[ActiveWorkout] Error pausing workout:', error);
        toast.error('Failed to pause workout');
        return;
      }

      setActiveWorkout(prev => prev ? { ...prev, is_paused: true } : null);
      toast.success('Workout paused');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error pausing workout:', error);
      toast.error('Failed to pause workout');
    }
  }, [activeWorkout]);

  const resumeWorkout = useCallback(async () => {
    if (!activeWorkout || !activeWorkout.is_paused) return;

    console.log('[ActiveWorkout] Resuming workout:', activeWorkout.id);

    try {
      const { error } = await supabase
        .from('workouts')
        .update({ is_paused: false })
        .eq('id', activeWorkout.id);

      if (error) {
        console.error('[ActiveWorkout] Error resuming workout:', error);
        toast.error('Failed to resume workout');
        return;
      }

      setActiveWorkout(prev => prev ? { ...prev, is_paused: false } : null);
      toast.success('Workout resumed');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error resuming workout:', error);
      toast.error('Failed to resume workout');
    }
  }, [activeWorkout]);

  const reactivateWorkout = useCallback(async (workoutId: string) => {
    console.log('[ActiveWorkout] Reactivating workout:', workoutId);

    try {
      const { error } = await supabase
        .from('workouts')
        .update({ 
          is_active: true,
          is_paused: false
        })
        .eq('id', workoutId);

      if (error) {
        console.error('[ActiveWorkout] Error reactivating workout:', error);
        toast.error('Failed to reactivate workout');
        return;
      }

      await refreshActiveWorkout(workoutId);
      navigate(`/workout/${workoutId}`);
      
    } catch (error) {
      console.error('[ActiveWorkout] Error reactivating workout:', error);
      toast.error('Failed to reactivate workout');
    }
  }, [refreshActiveWorkout, navigate]);

  const value: ActiveWorkoutContextType = {
    activeWorkout,
    isWorkoutActive,
    elapsedTime,
    loading,
    isPaused: activeWorkout?.is_paused || false,
    isFinishing,
    startWorkout,
    endWorkout,
    pauseWorkout,
    resumeWorkout,
    reactivateWorkout,
    updateLastExercise,
    markSetManuallyCompleted,
    unmarkSetManuallyCompleted,
    isSetManuallyCompleted,
    markSetToasted,
    isSetToasted,
    clearWorkoutState,
    refreshActiveWorkout
  };

  return (
    <ActiveWorkoutContext.Provider value={value}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export const useActiveWorkout = (): ActiveWorkoutContextType => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  }
  return context;
};
