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
  // Track if is_paused column exists to avoid repeated failed queries
  // Use localStorage to persist across page loads
  const getInitialPausedColumnState = (): boolean | null => {
    const stored = localStorage.getItem('is_paused_column_available');
    return stored === null ? null : stored === 'true';
  };
  const isPausedColumnAvailableRef = useRef<boolean | null>(getInitialPausedColumnState());
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
  // Ref to track active workout for use in subscription handlers
  const activeWorkoutRef = useRef<Workout | null>(null);
  
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
  
  // Test if Supabase real-time is working at all
  useEffect(() => {
    const testChan = supabase
      .channel('test-connection')
      .on('presence', { event: 'sync' }, () => {
        // Real-time connection test successful
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
            workout_exercises!workout_exercises_workout_id_fkey(
              *,
              sets!fk_sets_workout_exercise_id(
                *
              )
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
          // Skip if we've already determined the is_paused column doesn't exist
          if ((!workouts || workouts.length === 0) && isPausedColumnAvailableRef.current !== false) {
            try {
              const pausedAttempt = await supabase
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
                .eq('user_id', user.id)
                .eq('is_paused', true)
                .order('created_at', { ascending: false })
                .limit(1);
                
              // Check for error - if column doesn't exist, mark it and skip future queries
              if (pausedAttempt.error) {
                const errorMsg = String(pausedAttempt.error.message || '');
                // If it's a missing column error, mark it so we don't try again
                if (errorMsg.includes('is_paused') || errorMsg.includes('column') || pausedAttempt.error.code === 'PGRST116') {
                  isPausedColumnAvailableRef.current = false;
                  localStorage.setItem('is_paused_column_available', 'false');
                } else {
                  // Only log if it's not a missing column error (which is expected)
                  console.error('[ActiveWorkout] Error checking paused workouts:', pausedAttempt.error);
                }
              } else {
                // Column exists and query succeeded
                isPausedColumnAvailableRef.current = true;
                localStorage.setItem('is_paused_column_available', 'true');
                workouts = pausedAttempt.data as any[] | null;
              }
            } catch (pausedError) {
              // Mark column as unavailable on any error
              isPausedColumnAvailableRef.current = false;
              localStorage.setItem('is_paused_column_available', 'false');
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
          
          // Sort exercises and sets (matching other handlers)
          if (workout.workout_exercises) {
            workout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
              (a.exercise_order || 0) - (b.exercise_order || 0)
            );
            workout.workout_exercises.forEach((exercise: WorkoutExercise) => {
              if (exercise.sets) {
                exercise.sets.sort((a: Set, b: Set) => 
                  (a.set_order || 0) - (b.set_order || 0)
                );
              }
            });
          }
          
          // Map workout_exercises to exercises for compatibility
          const processedWorkout = {
            ...workout,
            exercises: workout.workout_exercises || []
          };
          
          setActiveWorkout(processedWorkout);
          activeWorkoutRef.current = processedWorkout;
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
          setActiveWorkout(null);
          activeWorkoutRef.current = null;
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
      .channel(`user-workouts-${user.id}${activeWorkout?.id ? `-workout-${activeWorkout.id}` : ''}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'workouts',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        console.log('[ActiveWorkout] INSERT event received:', payload.new);
        // When a new workout is created, check if it's active and load it
        const newWorkout = payload.new as any;
        
        // Only process if the workout is active
        if (newWorkout && newWorkout.is_active === true) {
          console.log('[ActiveWorkout] INSERT event received for active workout:', newWorkout.id);
          try {
            // Fetch the full workout with relations (matching refreshActiveWorkout structure)
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
              .eq('id', newWorkout.id)
              .single();

            if (error) {
              console.error('[ActiveWorkout] Error fetching new workout:', error);
              return;
            }

            if (workout) {
              // Sort exercises and sets (matching refreshActiveWorkout)
              if (workout.workout_exercises) {
                workout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
                  (a.exercise_order || 0) - (b.exercise_order || 0)
                );
                workout.workout_exercises.forEach((exercise: WorkoutExercise) => {
                  if (exercise.sets) {
                    exercise.sets.sort((a: Set, b: Set) => 
                      (a.set_order || 0) - (b.set_order || 0)
                    );
                  }
                });
              }
              
              // Map workout_exercises to exercises for compatibility
              const processedWorkout = {
                ...workout,
                exercises: workout.workout_exercises || []
              };
              
              console.log('[ActiveWorkout] Setting active workout from INSERT:', processedWorkout.id);
              // CRITICAL: Set loading to false so the component can render
              setLoading(false);
              setActiveWorkout(processedWorkout);
              activeWorkoutRef.current = processedWorkout;
              setIsWorkoutActive(true);
              
              // Initialize elapsed time
              if (workout.running_since) {
                const startTime = new Date(workout.running_since).getTime();
                const now = Date.now();
                const runningTime = Math.floor((now - startTime) / 1000);
                const accumulated = workout.active_seconds_accumulated || 0;
                setElapsedTime(accumulated + runningTime);
              } else {
                setElapsedTime(workout.active_seconds_accumulated || 0);
              }
            }
          } catch (error) {
            console.error('[ActiveWorkout] Error processing new workout:', error);
          }
        }
      });
    
    // Handler for workout updates
    const handleWorkoutUpdate = async (payload: any) => {
      if (payload.eventType === 'UPDATE') {
        const updatedWorkout = payload.new as Workout;
        const oldWorkout = payload.old as Workout;
        
        // Check if a workout just became active (for this user)
        const justBecameActive = updatedWorkout.is_active === true && 
                                  (oldWorkout?.is_active === false || oldWorkout?.is_active === undefined) &&
                                  updatedWorkout.user_id === user.id;
        
        // If a workout just became active and we don't have one loaded, fetch it
        if (justBecameActive && !activeWorkoutRef.current) {
          console.log('[ActiveWorkout] Workout just became active, fetching:', updatedWorkout.id);
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
              .eq('id', updatedWorkout.id)
              .single();

            if (!error && workout) {
              // Sort exercises and sets (matching refreshActiveWorkout)
              if (workout.workout_exercises) {
                workout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
                  (a.exercise_order || 0) - (b.exercise_order || 0)
                );
                workout.workout_exercises.forEach((exercise: WorkoutExercise) => {
                  if (exercise.sets) {
                    exercise.sets.sort((a: Set, b: Set) => 
                      (a.set_order || 0) - (b.set_order || 0)
                    );
                  }
                });
              }
              
              // Map workout_exercises to exercises for compatibility
              const processedWorkout = {
                ...workout,
                exercises: workout.workout_exercises || []
              };
              
              console.log('[ActiveWorkout] Setting active workout from UPDATE:', processedWorkout.id);
              // CRITICAL: Set loading to false so the component can render
              setLoading(false);
              setActiveWorkout(processedWorkout);
              activeWorkoutRef.current = processedWorkout;
              setIsWorkoutActive(true);
              
              // Initialize elapsed time
              if (workout.running_since) {
                const startTime = new Date(workout.running_since).getTime();
                const now = Date.now();
                const runningTime = Math.floor((now - startTime) / 1000);
                const accumulated = workout.active_seconds_accumulated || 0;
                setElapsedTime(accumulated + runningTime);
              } else {
                setElapsedTime(workout.active_seconds_accumulated || 0);
              }
              return;
            }
          } catch (error) {
            console.error('[ActiveWorkout] Error fetching workout that became active:', error);
          }
        }
        
        // Update workout state and handle side effects
        setActiveWorkout(prev => {
          // Only process if this is the active workout
          if (!prev || updatedWorkout.id !== prev.id) return prev;
          
          // Update ref with the new workout state
          const updated = { ...prev, ...updatedWorkout };
          activeWorkoutRef.current = updated;
          
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
              // Only end workout if we're actually finishing (not just pausing)
              if (hasPausedField2) {
                // New schema: if is_paused is false and is_active is false, workout ended
                // Show notification that workout ended
                toast.success('Workout completed!', {
                  description: 'Viewing workout summary...'
                });
                // Navigate to workout summary page for both trainer and client
                if (updatedWorkout.id) {
                  navigate(`/history/${updatedWorkout.id}`, { replace: true });
                } else {
                  navigate('/history', { replace: true });
                }
                // Clear workout state
                setIsWorkoutActive(false);
                setActiveWorkout(null);
                activeWorkoutRef.current = null;
                setElapsedTime(0);
              } else if (isFinishingRef.current) {
                // Legacy schema: only end if isFinishingRef indicates we're finishing
                // Show notification that workout ended
                toast.success('Workout completed!', {
                  description: 'Viewing workout summary...'
                });
                // Navigate to workout summary page for both trainer and client
                if (updatedWorkout.id) {
                  navigate(`/history/${updatedWorkout.id}`, { replace: true });
                } else {
                  navigate('/history', { replace: true });
                }
                // Clear workout state
                setIsWorkoutActive(false);
                setActiveWorkout(null);
                activeWorkoutRef.current = null;
                setElapsedTime(0);
              }
              // If neither condition is met, workout is paused (legacy schema) - keep it active
            }
          }
          
          return updated;
        });
      }
    };
    
    // Subscribe to workout updates by user_id (for the user's own workouts)
    // Use the workout owner's user_id if available, otherwise use current user's id
    const workoutOwnerId = activeWorkout?.user_id || user.id;
    if (workoutOwnerId) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `user_id=eq.${workoutOwnerId}`
      }, handleWorkoutUpdate);
    }
    
    // Also subscribe by workout_id when there's an active workout
    // This ensures both trainer and client receive updates for the same workout
    if (activeWorkout?.id) {
      channel.on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workouts',
        filter: `id=eq.${activeWorkout.id}`
      }, handleWorkoutUpdate);
    }
    
    // Subscribe to set updates for the active workout
    channel.on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'sets',
      filter: `workout_id=eq.${activeWorkout?.id || ''}`
    }, (payload) => {
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
            
            const updated = { ...prev, exercises: updatedExercises };
            activeWorkoutRef.current = updated;
            return updated;
          });
        }
      })
      .subscribe(async (status) => {
        console.log('[ActiveWorkout] Subscription status:', status);
        
        // When subscription becomes active, check if there's an active workout we might have missed
        if (status === 'SUBSCRIBED' && !activeWorkoutRef.current) {
          console.log('[ActiveWorkout] Subscription active, checking for missed active workout');
          console.log('[ActiveWorkout] Current activeWorkoutRef:', activeWorkoutRef.current?.id || 'null');
          console.log('[ActiveWorkout] Querying for active workouts for user:', user.id);
          console.log('[ActiveWorkout] User object:', { id: user.id, email: (user as any).email });
          
          // First, try a simple query to see if we can read workouts at all
          try {
            const { data: allWorkouts, error: allError } = await supabase
              .from('workouts')
              .select('id, user_id, is_active, created_at')
              .eq('user_id', user.id)
              .limit(5);
            
            console.log('[ActiveWorkout] Simple query - error:', allError);
            console.log('[ActiveWorkout] Simple query - all workouts for user:', allWorkouts?.length || 0);
            if (allWorkouts && allWorkouts.length > 0) {
              console.log('[ActiveWorkout] Simple query - workout details:', allWorkouts.map(w => ({
                id: w.id,
                user_id: w.user_id,
                is_active: w.is_active,
                created_at: w.created_at
              })));
            }
          } catch (simpleError) {
            console.error('[ActiveWorkout] Error in simple query:', simpleError);
          }
          
          try {
            const { data: workouts, error } = await supabase
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
              .eq('user_id', user.id)
              .eq('is_active', true)
              .order('created_at', { ascending: false })
              .limit(1);

            console.log('[ActiveWorkout] Full query result - error:', error);
            console.log('[ActiveWorkout] Full query result - error details:', error ? {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            } : null);
            console.log('[ActiveWorkout] Full query result - workouts found:', workouts?.length || 0);
            if (workouts && workouts.length > 0) {
              console.log('[ActiveWorkout] Full query result - workout IDs:', workouts.map(w => w.id));
            }

            if (error) {
              console.error('[ActiveWorkout] Error querying for missed workout:', error);
              return;
            }

            if (!workouts || workouts.length === 0) {
              console.log('[ActiveWorkout] No active workouts found in fallback check');
              return;
            }

            const workout = workouts[0];
            console.log('[ActiveWorkout] Found active workout that was missed:', workout.id);
            
            // Sort exercises and sets
            if (workout.workout_exercises) {
              workout.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => 
                (a.exercise_order || 0) - (b.exercise_order || 0)
              );
              workout.workout_exercises.forEach((exercise: WorkoutExercise) => {
                if (exercise.sets) {
                  exercise.sets.sort((a: Set, b: Set) => 
                    (a.set_order || 0) - (b.set_order || 0)
                  );
                }
              });
            }
            
            // Map workout_exercises to exercises for compatibility
            const processedWorkout = {
              ...workout,
              exercises: workout.workout_exercises || []
            };
            
            console.log('[ActiveWorkout] Setting active workout from subscription check:', processedWorkout.id);
            console.log('[ActiveWorkout] Workout data structure:', {
              id: processedWorkout.id,
              hasExercises: !!processedWorkout.exercises,
              exerciseCount: processedWorkout.exercises?.length || 0,
              exercises: processedWorkout.exercises?.map(ex => ({
                id: ex.id,
                exercise_id: ex.exercise_id,
                snapshot_name: ex.snapshot_name,
                setsCount: ex.sets?.length || 0
              }))
            });
            
            // Set state updates - these will trigger re-renders and redirects
            // CRITICAL: Set loading to false so the component can render
            setLoading(false);
            setActiveWorkout(processedWorkout);
            activeWorkoutRef.current = processedWorkout;
            setIsWorkoutActive(true);
            
            // Initialize elapsed time
            if (workout.running_since) {
              const startTime = new Date(workout.running_since).getTime();
              const now = Date.now();
              const runningTime = Math.floor((now - startTime) / 1000);
              const accumulated = workout.active_seconds_accumulated || 0;
              setElapsedTime(accumulated + runningTime);
            } else {
              setElapsedTime(workout.active_seconds_accumulated || 0);
            }
            
            // Verify state was set correctly after React has processed the update
            setTimeout(() => {
              console.log('[ActiveWorkout] State verification after update:', {
                activeWorkoutId: activeWorkoutRef.current?.id,
                hasExercises: !!activeWorkoutRef.current?.exercises,
                exerciseCount: activeWorkoutRef.current?.exercises?.length || 0,
                workoutData: activeWorkoutRef.current ? {
                  id: activeWorkoutRef.current.id,
                  is_active: activeWorkoutRef.current.is_active,
                  exercisesLength: activeWorkoutRef.current.exercises?.length || 0
                } : null
              });
            }, 100);
            
            console.log('[ActiveWorkout] State updated, isWorkoutActive should be true now');
          } catch (error) {
            console.error('[ActiveWorkout] Error checking for missed workout:', error);
          }
        }
      });

    return () => {
      console.log('[ActiveWorkout] Cleaning up subscription');
      channel.unsubscribe();
    };
  }, [user, activeWorkout?.id, navigate]); // Only depend on activeWorkout.id to avoid recreating subscription when workout data changes

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
      } catch (error) {
        console.error('[ActiveWorkout] Error syncing time:', error);
      }
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [activeWorkout?.id, activeWorkout?.is_active, activeWorkout?.running_since, loading]);

  const refreshActiveWorkout = useCallback(async (workoutId: string) => {
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
        activeWorkoutRef.current = processedWorkout;
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

      // Create workout exercises and sets
      const rawExercises: any[] = (program as any).exercises || (program as any).routine_exercises || [];
      if (!rawExercises || !Array.isArray(rawExercises)) {
        console.error('[ActiveWorkout] Program exercises is undefined or not an array:', program);
        toast.error('Invalid program data - no exercises found');
        return;
      }

      // Normalize incoming exercises to a common shape
      const normalizedExercises = rawExercises.map((ex: any, index: number) => {
        const exerciseId = ex.exercise_id ?? ex.id; // routine_exercises.exercise_id or exercises.id
        const name = ex.name ?? ex.snapshot_name ?? ex.exercises?.name ?? 'Exercise';
        const sets = ex.sets ?? ex.routine_sets ?? [];
        return { index, exercise_id: exerciseId, name, sets };
      });

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
      
      // Add null check for user.id before creating sets
      if (!user?.id) {
        console.error('[ActiveWorkout] Cannot create sets: user ID is null');
        toast.error('User not authenticated. Please refresh and try again.');
        return;
      }
      
      normalizedExercises.forEach((normalized: any, exerciseIndex: number) => {
        const workoutExercise = workoutExercises.find((we: any) => we.exercise_id === normalized.exercise_id);
        if (workoutExercise) {
          const sets = normalized.sets || [];
          sets.forEach((set: any, i: number) => {
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
      return;
    }

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
                  await generateAndUploadOGImage(activeWorkout.id, formattedData);
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
      activeWorkoutRef.current = null;
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
    // In delegated mode, we might not have activeWorkout loaded yet, but we can still update
    // by finding the active workout for the current user
    if (!activeWorkout && user) {
      try {
        const { data: workouts } = await supabase
          .from('workouts')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (workouts && workouts.length > 0) {
          const workoutId = workouts[0].id;
          const { error } = await supabase
            .from('workouts')
            .update({ last_workout_exercise_id: workoutExerciseId })
            .eq('id', workoutId);
          
          if (error) {
            console.error('[ActiveWorkout] Error updating last exercise:', error);
          }
        }
      } catch (error) {
        console.error('[ActiveWorkout] Error in updateLastExercise (fetch first):', error);
      }
      return;
    }
    
    if (!activeWorkout) {
      return;
    }

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
  }, [activeWorkout, user]);

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
    activeWorkoutRef.current = null;
    setIsWorkoutActive(false);
    setElapsedTime(0);
    setManuallyCompletedSets(() => new Set<string>());
    setToastedSets(() => new Set<string>());
  }, []);

  const pauseWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    
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
      
      // Check if is_paused column is available before trying to use it
      const shouldUsePausedColumn = isPausedColumnAvailableRef.current !== false;
      
      let updateResult;
      if (shouldUsePausedColumn) {
        // First try to set both flags (new schema)
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: false,
            is_paused: true,
            running_since: null,
            active_seconds_accumulated: newAccumulated
          })
          .eq('id', activeWorkout.id);

        if (updateResult.error) {
          // If server doesn't know about is_paused, mark it and fall back to legacy schema
          const msg = String(updateResult.error.message || '');
          if (msg.includes('is_paused') || updateResult.error.code === 'PGRST116') {
            isPausedColumnAvailableRef.current = false;
            localStorage.setItem('is_paused_column_available', 'false');
            // Fall back to legacy schema
            updateResult = await supabase
              .from('workouts')
              .update({ 
                is_active: false,
                running_since: null,
                active_seconds_accumulated: newAccumulated
              })
              .eq('id', activeWorkout.id);
          }
        } else {
          // Success - mark column as available
          isPausedColumnAvailableRef.current = true;
          localStorage.setItem('is_paused_column_available', 'true');
        }
      } else {
        // Column doesn't exist, use legacy schema
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: false,
            running_since: null,
            active_seconds_accumulated: newAccumulated
          })
          .eq('id', activeWorkout.id);
      }

      if (updateResult?.error) {
        console.error('[ActiveWorkout] Error pausing workout:', updateResult.error);
        toast.error('Failed to pause workout');
        return;
      }

      // Update local state regardless of schema
      setActiveWorkout(prev => {
        const updated = prev ? {
          ...prev,
          is_active: false,
          running_since: null,
          active_seconds_accumulated: newAccumulated,
          // Only set is_paused locally if the field exists on the object
          ...(Object.prototype.hasOwnProperty.call(prev, 'is_paused') ? { is_paused: true } : {})
        } : null;
        activeWorkoutRef.current = updated;
        return updated;
      });
      
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
    
    try {
      const now = new Date().toISOString();
      
      // Check if is_paused column is available before trying to use it
      const shouldUsePausedColumn = isPausedColumnAvailableRef.current !== false;
      
      let updateResult;
      if (shouldUsePausedColumn) {
        // Try new schema first
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: true,
            is_paused: false,
            running_since: now
          })
          .eq('id', activeWorkout.id);

        if (updateResult.error) {
          const msg = String(updateResult.error.message || '');
          if (msg.includes('is_paused') || updateResult.error.code === 'PGRST116') {
            isPausedColumnAvailableRef.current = false;
            localStorage.setItem('is_paused_column_available', 'false');
            // Fall back to legacy schema
            updateResult = await supabase
              .from('workouts')
              .update({ 
                is_active: true,
                running_since: now
              })
              .eq('id', activeWorkout.id);
          }
        } else {
          // Success - mark column as available
          isPausedColumnAvailableRef.current = true;
          localStorage.setItem('is_paused_column_available', 'true');
        }
      } else {
        // Column doesn't exist, use legacy schema
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: true,
            running_since: now
          })
          .eq('id', activeWorkout.id);
      }

      if (updateResult?.error) {
        console.error('[ActiveWorkout] Error resuming workout:', updateResult.error);
        toast.error('Failed to resume workout');
        return;
      }

      // Update local state regardless of schema
      setActiveWorkout(prev => {
        const updated = prev ? {
          ...prev,
          is_active: true,
          running_since: now,
          ...(Object.prototype.hasOwnProperty.call(prev, 'is_paused') ? { is_paused: false } : {})
        } : null;
        activeWorkoutRef.current = updated;
        return updated;
      });
      
      setIsWorkoutActive(true);
      toast.success('Workout resumed');
      
    } catch (error) {
      console.error('[ActiveWorkout] Error resuming workout:', error);
      toast.error('Failed to resume workout');
    }
  }, [activeWorkout]);

  const reactivateWorkout = useCallback(async (workoutId: string) => {
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
      
      // Check if is_paused column is available before trying to use it
      const shouldUsePausedColumn = isPausedColumnAvailableRef.current !== false;
      
      let updateResult;
      if (shouldUsePausedColumn) {
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: true,
            is_paused: false,
            running_since: now
          })
          .eq('id', workoutId);

        if (updateResult.error) {
          const msg = String(updateResult.error.message || '');
          if (msg.includes('is_paused') || updateResult.error.code === 'PGRST116') {
            isPausedColumnAvailableRef.current = false;
            localStorage.setItem('is_paused_column_available', 'false');
            // Fall back to legacy schema
            updateResult = await supabase
              .from('workouts')
              .update({ 
                is_active: true,
                running_since: now
              })
              .eq('id', workoutId);
          }
        } else {
          // Success - mark column as available
          isPausedColumnAvailableRef.current = true;
          localStorage.setItem('is_paused_column_available', 'true');
        }
      } else {
        // Column doesn't exist, use legacy schema
        updateResult = await supabase
          .from('workouts')
          .update({ 
            is_active: true,
            running_since: now
          })
          .eq('id', workoutId);
      }

      if (updateResult?.error) {
        console.error('[ActiveWorkout] Error reactivating workout:', updateResult.error);
        toast.error('Failed to reactivate workout');
        return;
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
