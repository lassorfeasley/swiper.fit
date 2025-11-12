import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/supabaseClient';
import { useCurrentUser } from '@/contexts/AccountContext';
import { generateWorkoutName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toastReplacement';
import { generateAndUploadOGImage } from '@/lib/ogImageGenerator.ts';

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
  weight_unit?: string;
  set_variant?: string;
  set_order?: number;
  created_at: string;
  logged_at: string;
  routine_set_id?: string;
  user_id: string;
  account_id: string;
  workout_exercise_id?: string;
}

interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  snapshot_name: string;
  name_override?: string;
  section_override?: string;
  sets: Set[];
}

interface Workout {
  id: string;
  user_id: string;
  routine_id?: string;
  routine_name?: string;
  workout_name: string;
  started_at: string;
  is_active: boolean;
  is_paused?: boolean;
  is_public?: boolean;
  last_workout_exercise_id?: string;
  og_image_url?: string;
  active_seconds_accumulated?: number;
  running_since?: string | null;
  exercises: WorkoutExercise[];
  routines?: {
    routine_name: string;
  };
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
  isStartingWorkout: boolean;
  startWorkout: (program: Program) => Promise<void>;
  endWorkout: () => Promise<boolean>;
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
  const [isStartingWorkout, setIsStartingWorkout] = useState<boolean>(false);
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
  const [manuallyCompletedSets, setManuallyCompletedSets] = useState(() => new Set<string>());
  const [toastedSets, setToastedSets] = useState(() => new Set<string>());

  // Check for active workout on mount
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkForActiveWorkout = async () => {
      console.log('[ActiveWorkout] Checking for active workout for user:', user.id);
      console.log('[ActiveWorkout] Current context state - actingUser:', user);
      
      try {
        // Try to fetch either active or paused (new schema) workouts
        let workouts: any[] | null = null;
        let error: any = null;

        // First try to get active workouts only (most common case)
        const attempt = await supabase
          .from('workouts')
          .select(`
            *,
            routines!fk_workouts__routines(
              routine_name
            ),
            sets!sets_workout_id_fkey(
              *
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);

        if (attempt.error) {
          console.error('Error fetching active workouts:', attempt.error);
          workouts = null;
          error = attempt.error;
        } else {
          workouts = attempt.data as any[] | null;
          error = null;
          
          // If no active workout found, check for paused workouts
          if (!workouts || workouts.length === 0) {
            try {
              const pausedAttempt = await supabase
                .from('workouts')
                .select(`
                  *,
                  routines!fk_workouts__routines(
                    routine_name
                  ),
                  sets!sets_workout_id_fkey(
                    *
                  )
                `)
                .eq('user_id', user.id)
                .eq('is_paused', true)
                .order('created_at', { ascending: false })
                .limit(1);
                
              // Check for error - if column doesn't exist, error will be in pausedAttempt.error
              if (pausedAttempt.error) {
                const errorMsg = String(pausedAttempt.error.message || '');
                if (errorMsg.includes('is_paused') || errorMsg.includes('column') || pausedAttempt.error.code === 'PGRST116') {
                  console.log('[ActiveWorkout] is_paused column not available, skipping paused workout check');
                } else {
                  console.error('[ActiveWorkout] Error checking paused workouts:', pausedAttempt.error);
                }
              } else {
                workouts = pausedAttempt.data as any[] | null;
              }
            } catch (pausedError) {
              console.log('[ActiveWorkout] is_paused column not available, skipping paused workout check');
            }
          }
        }

        if (error) {
          console.error('[ActiveWorkout] Error fetching active workout:', error);
          setLoading(false);
          return;
        }

        if (workouts && workouts.length > 0) {
          const workout = workouts[0];
          console.log('[ActiveWorkout] Found active workout:', workout.id, 'for user:', user.id);
          
          // Sort sets by set_order or created_at
          if (workout.sets) {
            workout.sets.sort((a: Set, b: Set) => {
              if (a.set_order !== null && b.set_order !== null) {
                return a.set_order - b.set_order;
              }
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });
          }
          
          // Map sets to exercises for compatibility (since the UI expects exercises)
          const processedWorkout = {
            ...workout,
            exercises: workout.sets ? [{
              id: 'workout-sets',
              exercise_name: 'Workout Sets',
              order_index: 0,
              sets: workout.sets
            }] : []
          };
          
          console.log('[ActiveWorkout] Setting workout as active:', workout.id);
          setActiveWorkout(processedWorkout);
          setIsWorkoutActive(Boolean(workout.is_active || (workout as any).is_paused));
          
          // Calculate elapsed time based on workout state
          let elapsed = 0;
          if (workout.is_active && workout.running_since) {
            // Workout is active - calculate from running_since
            const startTime = new Date(workout.running_since).getTime();
            const now = Date.now();
            elapsed = Math.floor((now - startTime) / 1000);
          } else {
            // Workout is paused - use accumulated time
            elapsed = workout.active_seconds_accumulated || 0;
          }
          setElapsedTime(elapsed);
        } else {
          console.log('[ActiveWorkout] No active workout found for user:', user.id);
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

  // Timer effect - only runs when workout is active and not paused
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.is_active) {
      return;
    }

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeWorkout?.is_active]);

  // Real-time subscription for new workouts and workout updates
  useEffect(() => {
    if (!user) return;

    console.log('[ActiveWorkout] Setting up real-time subscription for user:', user.id);

    const channel = supabase
      .channel(`user-workouts-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'workouts',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        console.log('[ActiveWorkout] New workout created for user:', payload);
        // Refresh the active workout when a new one is created
        // Re-fetch the active workout for this user
        try {
          const { data: workouts } = await supabase
            .from('workouts')
            .select(`
              *,
              routines!fk_workouts__routines(
                routine_name
              ),
              sets!sets_workout_id_fkey(
                *
              )
            `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);

          if (workouts && workouts.length > 0) {
            const workout = workouts[0];
            console.log('[ActiveWorkout] Detected new active workout:', workout.id);
            setActiveWorkout(workout);
            setIsWorkoutActive(true);
            
            // Initialize elapsed time
            if (workout.running_since) {
              const startTime = new Date(workout.running_since).getTime();
              const now = Date.now();
              const runningTime = Math.floor((now - startTime) / 1000);
              const accumulated = workout.active_seconds_accumulated || 0;
              setElapsedTime(accumulated + runningTime);
            }
          }
        } catch (error) {
          console.error('[ActiveWorkout] Error refreshing workout after creation:', error);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('[ActiveWorkout] Workout update received:', payload);
        // Only handle updates if we have an active workout
        if (!activeWorkout) return;
        
        if (payload.eventType === 'UPDATE') {
          const updatedWorkout = payload.new as Workout;
          setActiveWorkout(prev => prev ? { ...prev, ...updatedWorkout } : null);
          
          // Sync elapsed time from real-time update
          if (updatedWorkout.is_active && updatedWorkout.running_since) {
            const startTime = new Date(updatedWorkout.running_since).getTime();
            const now = Date.now();
            const runningTime = Math.floor((now - startTime) / 1000);
            const accumulated = updatedWorkout.active_seconds_accumulated || 0;
            setElapsedTime(accumulated + runningTime);
          } else if (updatedWorkout.active_seconds_accumulated !== undefined) {
            setElapsedTime(updatedWorkout.active_seconds_accumulated);
          }
          
          const hasPausedField = Object.prototype.hasOwnProperty.call(updatedWorkout as any, 'is_paused');
          const paused = hasPausedField ? Boolean((updatedWorkout as any).is_paused) : false;
          if (hasPausedField) {
            // New schema: active if either active or paused
            setIsWorkoutActive(Boolean(updatedWorkout.is_active || paused));
          } else {
            // Legacy schema (no is_paused): do NOT flip off during pause updates; only
            // allow turning off when we know we're finishing (handled below)
            if (updatedWorkout.is_active === true) setIsWorkoutActive(true);
          }
          
          // Only navigate to history if the workout truly ended, not merely paused
          if (updatedWorkout.is_active === false) {
            const hasPausedField2 = Object.prototype.hasOwnProperty.call(updatedWorkout as any, 'is_paused');
            const isPausedNow = hasPausedField2 ? Boolean((updatedWorkout as any).is_paused) : false;

            if (!isPausedNow) {
              if (hasPausedField2) {
                console.log('[ActiveWorkout] Workout ended via real-time update');
                navigate('/history');
              } else if (isFinishingRef.current) {
                console.log('[ActiveWorkout] Workout ended (legacy schema, finishing flag)');
                navigate('/history');
              }
            }
          }
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sets',
        filter: `workout_id=eq.${activeWorkout?.id || ''}`
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
                  updatedSets.sort((a, b) => (a.set_order || 0) - (b.set_order || 0));
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

  // Timer for elapsed time - calculate from running_since instead of incrementing
  useEffect(() => {
    if (!isWorkoutActive || !activeWorkout?.is_active || loading) return;

    const updateElapsedTime = () => {
      if (activeWorkout.running_since) {
        const startTime = new Date(activeWorkout.running_since).getTime();
        const now = Date.now();
        const runningTime = Math.floor((now - startTime) / 1000);
        const accumulated = activeWorkout.active_seconds_accumulated || 0;
        setElapsedTime(accumulated + runningTime);
      } else {
        // Paused - use accumulated time
        setElapsedTime(activeWorkout.active_seconds_accumulated || 0);
      }
    };

    // Update immediately
    updateElapsedTime();

    // Then update every second
    const timer = setInterval(updateElapsedTime, 1000);

    return () => clearInterval(timer);
  }, [isWorkoutActive, activeWorkout?.is_active, activeWorkout?.running_since, activeWorkout?.active_seconds_accumulated, loading]);

  // Periodic sync of accumulated time to database (every 10 seconds while running)
  useEffect(() => {
    if (!activeWorkout || !activeWorkout.is_active || !activeWorkout.running_since || loading) return;

    const syncInterval = setInterval(async () => {
      try {
        const runningSince = new Date(activeWorkout.running_since).getTime();
        const now = Date.now();
        const runningTime = Math.floor((now - runningSince) / 1000);
        const currentAccumulated = activeWorkout.active_seconds_accumulated || 0;
        const totalTime = currentAccumulated + runningTime;

        await supabase
          .from('workouts')
          .update({ 
            active_seconds_accumulated: totalTime,
            running_since: new Date().toISOString()
          })
          .eq('id', activeWorkout.id);

        console.log('[ActiveWorkout] Synced accumulated time:', totalTime);
      } catch (error) {
        console.error('[ActiveWorkout] Error syncing time:', error);
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [activeWorkout?.id, activeWorkout?.is_active, activeWorkout?.running_since, loading]);

  const refreshActiveWorkout = useCallback(async (workoutId: string) => {
    console.log('[ActiveWorkout] Refreshing workout:', workoutId);
    
    try {
      const { data: workout, error } = await supabase
        .from('workouts')
        .select(`
          *,
          routines!fk_workouts__routines(
            routine_name
          ),
          workout_exercises!workout_exercises_workout_id_fkey(
            *,
            sets!fk_sets_workout_exercise_id(
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
        if (workout.workout_exercises) {
          workout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.exercise_order - b.exercise_order);
          workout.workout_exercises.forEach((exercise: WorkoutExercise) => {
            if (exercise.sets) {
              exercise.sets.sort((a: Set, b: Set) => a.set_order - b.set_order);
            }
          });
        }
        
        // Map workout_exercises to exercises for compatibility
        const processedWorkout = {
          ...workout,
          exercises: workout.workout_exercises || []
        };
        
        setActiveWorkout(processedWorkout);
        setIsWorkoutActive(Boolean(workout.is_active || (workout as any).is_paused));
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
    setIsStartingWorkout(true);
    
    try {
      // First, check if there's already an active workout and clean it up
      const { data: existingWorkouts, error: existingError } = await supabase
        .from('workouts')
        .select('id, workout_name')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (existingError) {
        console.error('[ActiveWorkout] Error checking for existing workouts:', existingError);
      } else if (existingWorkouts && existingWorkouts.length > 0) {
        console.log('[ActiveWorkout] Found existing active workout(s), cleaning up:', existingWorkouts);
        
        // Mark existing active workouts as inactive
        const { error: cleanupError } = await supabase
          .from('workouts')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);

        if (cleanupError) {
          console.error('[ActiveWorkout] Error cleaning up existing workouts:', cleanupError);
          toast.error('Failed to clean up existing workout');
          return;
        }
        
        toast.info('Cleaned up existing workout');
      }

      // Create workout
      const routineName = (program as any)?.routine_name || (program as any)?.name || 'Workout';
      const workoutName = generateWorkoutName(routineName);
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          routine_id: program.id,
          workout_name: workoutName,
          is_active: true,
          running_since: new Date().toISOString(),
          active_seconds_accumulated: 0
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
      const rawExercises: any[] = (program as any).exercises || (program as any).routine_exercises || [];
      if (!rawExercises || !Array.isArray(rawExercises)) {
        console.error('[ActiveWorkout] Program exercises is undefined or not an array:', program);
        toast.error('Invalid program data - no exercises found');
        return;
      }

      // Normalize incoming exercises to a common shape
      console.log('[ActiveWorkout] Raw exercises from program:', rawExercises.length);
      const normalizedExercises = rawExercises.map((ex: any, index: number) => {
        const exerciseId = ex.exercise_id ?? ex.id; // routine_exercises.exercise_id or exercises.id
        const name = ex.name ?? ex.snapshot_name ?? ex.exercises?.name ?? 'Exercise';
        const sets = ex.sets ?? ex.routine_sets ?? [];
        console.log(`[ActiveWorkout] Normalizing exercise ${index}: ${exerciseId} (${name}) with ${sets.length} sets`);
        return { index, exercise_id: exerciseId, name, sets };
      });
      console.log('[ActiveWorkout] Normalized exercises:', normalizedExercises.length);

      const exercisesToInsert = normalizedExercises.map((exercise: any) => ({
        workout_id: workout.id,
        exercise_id: exercise.exercise_id,
        exercise_order: exercise.index,
        snapshot_name: exercise.name
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

      // Create sets for each exercise (supports both routine_sets and pre-expanded sets)
      const setsToInsert: any[] = [];
      console.log('[ActiveWorkout] Creating sets for normalized exercises:', normalizedExercises.length);
      
      // Add null check for user.id before creating sets
      if (!user?.id) {
        console.error('[ActiveWorkout] Cannot create sets: user ID is null');
        toast.error('User not authenticated. Please refresh and try again.');
        return;
      }
      
      normalizedExercises.forEach((normalized: any, exerciseIndex: number) => {
        console.log(`[ActiveWorkout] Processing exercise ${exerciseIndex}:`, normalized.exercise_id, 'with', normalized.sets?.length || 0, 'sets');
        const workoutExercise = workoutExercises.find((we: any) => we.exercise_id === normalized.exercise_id);
        if (workoutExercise) {
          const sets = normalized.sets || [];
          sets.forEach((set: any, i: number) => {
            console.log(`[ActiveWorkout] Creating set ${i + 1} for exercise ${normalized.exercise_id}`);
            setsToInsert.push({
              workout_id: workout.id,
              // Link to both the canonical exercise and the workout_exercises row
              exercise_id: normalized.exercise_id,
              workout_exercise_id: workoutExercise.id,
              status: 'default',
              set_type: set.set_type || 'reps',
              reps: typeof set.reps === 'number' ? set.reps : null,
              timed_set_duration: typeof set.timed_set_duration === 'number' ? set.timed_set_duration : null,
              weight: typeof set.weight === 'number' ? set.weight : 0,
              weight_unit: set.weight_unit,
              set_order: (typeof set.set_order === 'number' ? set.set_order : i + 1),
              user_id: user.id, // This is now guaranteed to be non-null
            });
          });
        } else {
          console.warn(`[ActiveWorkout] No workout exercise found for exercise_id: ${normalized.exercise_id}`);
        }
      });
      console.log('[ActiveWorkout] Total sets to insert:', setsToInsert.length);

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
      postSlackEvent('workout.started', {
        user_id: user.id,
        workout_id: workout.id,
        routine_id: workout.routine_id,
        routine_name: routineName
      });

      toast.success('Workout started!');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error starting workout:', error);
      toast.error('Failed to start workout');
    } finally {
      setIsStartingWorkout(false);
    }
  }, [user, navigate, refreshActiveWorkout, postSlackEvent]);

  // Helper to format workout data for OG image generation
  const formatWorkoutDataForOG = useCallback(async (workoutId: string, workout: any, completedSets: any[]) => {
    try {
      // Get completed sets with exercise info
      const validSets = completedSets || [];
      if (validSets.length === 0) {
        return null;
      }

      const uniqueExercises = new Set(validSets.map(s => s.exercise_id).filter(Boolean));
      const exerciseCount = uniqueExercises.size;
      const setCount = validSets.length;
      
      // Format duration
      const durationSeconds = workout.duration_seconds || workout.active_seconds_accumulated || 0;
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const duration = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m` : '';
      
      // Format date
      const date = new Date(workout.completed_at || workout.created_at || Date.now())
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      
      // Get owner name for possessive
      let ownerFullName = '';
      if (workout.user_id) {
        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', workout.user_id)
            .maybeSingle();
          if (prof) {
            const first = prof.first_name || '';
            const last = prof.last_name || '';
            ownerFullName = `${first} ${last}`.trim();
          }
        } catch (err) {
          console.warn('[ActiveWorkout] Error fetching profile for OG:', err);
        }
      }
      
      const ownerFirst = (ownerFullName.trim().split(' ')[0] || '').trim();
      const possessive = ownerFirst ? ownerFirst + (ownerFirst.toLowerCase().endsWith('s') ? "'" : "'s") + ' ' : '';
      const displayWorkoutName = `${possessive}${workout.workout_name || 'Completed Workout'}`;

      // Get routine name
      let routineName = 'Workout';
      if (workout.routine_id) {
        try {
          const { data: routine } = await supabase
            .from('routines')
            .select('routine_name')
            .eq('id', workout.routine_id)
            .maybeSingle();
          if (routine?.routine_name) {
            routineName = routine.routine_name;
          }
        } catch (err) {
          console.warn('[ActiveWorkout] Error fetching routine for OG:', err);
        }
      }

      return {
        routineName,
        workoutName: displayWorkoutName,
        date,
        duration,
        exerciseCount,
        setCount
      };
    } catch (error) {
      console.error('[ActiveWorkout] Error formatting workout data for OG:', error);
      return null;
    }
  }, []);

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
      // First check if any sets were completed by querying the database
      // Get full set data including exercise_id for OG image generation
      const { data: completedSets, error: setsError } = await supabase
        .from('sets')
        .select('id, exercise_id')
        .eq('workout_id', activeWorkout.id)
        .eq('status', 'complete');

      if (setsError) {
        console.error('[ActiveWorkout] Error checking completed sets:', setsError);
        // If we can't check, assume there were sets to be safe
        return true;
      }

      const hadAnySets = completedSets && completedSets.length > 0;
      console.log(`[ActiveWorkout] Workout ended with ${completedSets?.length || 0} completed sets`);
      
      // Only save the workout if there are completed sets
      if (hadAnySets) {
        // Calculate final accumulated time
        const currentAccumulated = activeWorkout.active_seconds_accumulated || 0;
        let additionalTime = 0;
        
        if (activeWorkout.running_since) {
          const runningSince = new Date(activeWorkout.running_since).getTime();
          const now = Date.now();
          additionalTime = Math.floor((now - runningSince) / 1000);
        }
        
        const finalAccumulated = currentAccumulated + additionalTime;
        
        // Update workout as ended (set completed_at for OG image date)
        const { error: updateError } = await supabase
          .from('workouts')
          .update({
            is_active: false,
            running_since: null,
            active_seconds_accumulated: finalAccumulated,
            completed_at: new Date().toISOString()
          })
          .eq('id', activeWorkout.id);

        if (updateError) {
          console.error('[ActiveWorkout] Error ending workout:', updateError);
          toast.error('Failed to end workout');
          return false;
        }

        // Fetch updated workout data for OG generation
        const { data: updatedWorkout, error: fetchError } = await supabase
          .from('workouts')
          .select('*')
          .eq('id', activeWorkout.id)
          .single();

        if (!fetchError && updatedWorkout) {
          // Generate and upload OG image (fire-and-forget, don't block navigation)
          // But with proper error handling and logging
          formatWorkoutDataForOG(activeWorkout.id, updatedWorkout, completedSets)
            .then(async (formattedData) => {
              if (formattedData) {
                try {
                  console.log('[ActiveWorkout] Generating OG image for workout:', activeWorkout.id);
                  await generateAndUploadOGImage(activeWorkout.id, formattedData);
                  console.log('[ActiveWorkout] Successfully generated OG image for workout:', activeWorkout.id);
                } catch (error) {
                  console.error('[ActiveWorkout] Failed to generate OG image:', error);
                  // Don't show error to user - this is background work
                }
              } else {
                console.warn('[ActiveWorkout] Could not format workout data for OG image');
              }
            })
            .catch((error) => {
              console.error('[ActiveWorkout] Error in OG image generation flow:', error);
            });
        } else {
          console.warn('[ActiveWorkout] Could not fetch updated workout for OG generation:', fetchError);
        }

        // Post Slack event
        postSlackEvent('workout.ended', {
          user_id: user?.id,
          workout_id: activeWorkout.id,
          routine_id: activeWorkout.routine_id,
          routine_name: activeWorkout.routine_name,
          duration_sec: finalAccumulated,
          total_sets: completedSets?.length || 0
        });

        toast.success('Workout completed!');
      } else {
        // No sets completed - delete the workout instead of saving it
        console.log('[ActiveWorkout] No sets completed, deleting workout instead of saving');
        
        const { error: deleteError } = await supabase
          .from('workouts')
          .delete()
          .eq('id', activeWorkout.id);

        if (deleteError) {
          console.error('[ActiveWorkout] Error deleting workout:', deleteError);
          toast.error('Failed to delete workout');
          return false;
        }

        toast.info('Workout cancelled - no sets were completed');
      }

      // Clear workout state
      setActiveWorkout(null);
      // Ending a workout should disable the active-workout redirect logic
      setIsWorkoutActive(false);
      setElapsedTime(0);
      setManuallyCompletedSets(() => new Set<string>());
      setToastedSets(() => new Set<string>());
      
      return hadAnySets;
    } catch (error) {
      console.error('[ActiveWorkout] Error ending workout:', error);
      toast.error('Failed to end workout');
      return false;
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
        .update({ last_workout_exercise_id: workoutExerciseId })
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
    setManuallyCompletedSets(() => new Set<string>());
    setToastedSets(() => new Set<string>());
  }, []);

  const pauseWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    
    console.log('[ActiveWorkout] Pausing workout:', activeWorkout.id);
    
    try {
      // Calculate accumulated time before pausing
      const currentAccumulated = activeWorkout.active_seconds_accumulated || 0;
      let additionalTime = 0;
      
      if (activeWorkout.running_since) {
        const runningSince = new Date(activeWorkout.running_since).getTime();
        const now = Date.now();
        additionalTime = Math.floor((now - runningSince) / 1000);
      }
      
      const newAccumulated = currentAccumulated + additionalTime;
      
      // First try to set both flags (new schema)
      const firstAttempt = await supabase
        .from('workouts')
        .update({ 
          is_active: false,
          is_paused: true,
          running_since: null,
          active_seconds_accumulated: newAccumulated
        })
        .eq('id', activeWorkout.id);

      if (firstAttempt.error) {
        // If server doesn't know about is_paused, fall back to legacy schema
        const msg = String(firstAttempt.error.message || '');
        if (msg.includes('is_paused')) {
          const fallback = await supabase
            .from('workouts')
            .update({ 
              is_active: false,
              running_since: null,
              active_seconds_accumulated: newAccumulated
            })
            .eq('id', activeWorkout.id);
          if (fallback.error) {
            console.error('[ActiveWorkout] Error pausing workout (fallback failed):', fallback.error);
            toast.error('Failed to pause workout');
            return;
          }
        } else {
          console.error('[ActiveWorkout] Error pausing workout:', firstAttempt.error);
          toast.error('Failed to pause workout');
          return;
        }
      }

      // Update local state regardless of schema
      setActiveWorkout(prev => prev ? {
        ...prev,
        is_active: false,
        running_since: null,
        active_seconds_accumulated: newAccumulated,
        // Only set is_paused locally if the field exists on the object
        ...(Object.prototype.hasOwnProperty.call(prev, 'is_paused') ? { is_paused: true } : {})
      } : null);
      
      setElapsedTime(newAccumulated);
      setIsWorkoutActive(true);
      toast.success('Workout paused');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error pausing workout:', error);
      toast.error('Failed to pause workout');
    }
  }, [activeWorkout]);

  const resumeWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    
    console.log('[ActiveWorkout] Resuming workout:', activeWorkout.id);
    
    try {
      const now = new Date().toISOString();
      
      // Try new schema first
      const firstAttempt = await supabase
        .from('workouts')
        .update({ 
          is_active: true,
          is_paused: false,
          running_since: now
        })
        .eq('id', activeWorkout.id);

      if (firstAttempt.error) {
        const msg = String(firstAttempt.error.message || '');
        if (msg.includes('is_paused')) {
          const fallback = await supabase
            .from('workouts')
            .update({ 
              is_active: true,
              running_since: now
            })
            .eq('id', activeWorkout.id);
          if (fallback.error) {
            console.error('[ActiveWorkout] Error resuming workout (fallback failed):', fallback.error);
            toast.error('Failed to resume workout');
            return;
          }
        } else {
          console.error('[ActiveWorkout] Error resuming workout:', firstAttempt.error);
          toast.error('Failed to resume workout');
          return;
        }
      }

      // Update local state regardless of schema
      setActiveWorkout(prev => prev ? {
        ...prev,
        is_active: true,
        running_since: now,
        ...(Object.prototype.hasOwnProperty.call(prev, 'is_paused') ? { is_paused: false } : {})
      } : null);
      
      setIsWorkoutActive(true);
      toast.success('Workout resumed');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error resuming workout:', error);
      toast.error('Failed to resume workout');
    }
  }, [activeWorkout]);

  const reactivateWorkout = useCallback(async (workoutId: string) => {
    console.log('[ActiveWorkout] Reactivating workout:', workoutId);

    try {
      // First, check if there's already an active workout and clean it up
      const { data: existingWorkouts, error: existingError } = await supabase
        .from('workouts')
        .select('id, workout_name')
        .eq('user_id', user?.id)
        .eq('is_active', true);

      if (existingError) {
        console.error('[ActiveWorkout] Error checking for existing workouts:', existingError);
      } else if (existingWorkouts && existingWorkouts.length > 0) {
        console.log('[ActiveWorkout] Found existing active workout(s), cleaning up:', existingWorkouts);
        
        // Mark existing active workouts as inactive
        const { error: cleanupError } = await supabase
          .from('workouts')
          .update({ is_active: false })
          .eq('user_id', user?.id)
          .eq('is_active', true);

        if (cleanupError) {
          console.error('[ActiveWorkout] Error cleaning up existing workouts:', cleanupError);
          toast.error('Failed to clean up existing workout');
          return;
        }
      }

      // Try new schema first, then fall back
      const now = new Date().toISOString();
      
      const firstAttempt = await supabase
        .from('workouts')
        .update({ 
          is_active: true,
          is_paused: false,
          running_since: now
        })
        .eq('id', workoutId);

      if (firstAttempt.error) {
        const msg = String(firstAttempt.error.message || '');
        if (msg.includes('is_paused')) {
          const fallback = await supabase
            .from('workouts')
            .update({ 
              is_active: true,
              running_since: now
            })
            .eq('id', workoutId);
          if (fallback.error) {
            console.error('[ActiveWorkout] Error reactivating workout (fallback failed):', fallback.error);
            toast.error('Failed to reactivate workout');
            return;
          }
        } else {
          console.error('[ActiveWorkout] Error reactivating workout:', firstAttempt.error);
          toast.error('Failed to reactivate workout');
          return;
        }
      }

      await refreshActiveWorkout(workoutId);
      navigate(`/workout/${workoutId}`);
      
    } catch (error) {
      console.error('[ActiveWorkout] Error reactivating workout:', error);
      toast.error('Failed to reactivate workout');
    }
  }, [refreshActiveWorkout, navigate, user]);

  const value: ActiveWorkoutContextType = {
    activeWorkout,
    isWorkoutActive,
    elapsedTime,
    loading,
    isPaused: activeWorkout
      ? (typeof (activeWorkout as any).is_paused === 'boolean'
          ? Boolean((activeWorkout as any).is_paused)
          : !activeWorkout.is_active)
      : false,
    isFinishing,
    isStartingWorkout,
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
