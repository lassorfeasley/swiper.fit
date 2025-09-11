import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { useCurrentUser } from '@/contexts/AccountContext';
import { generateWorkoutName } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { generateAndUploadOGImage } from '@/lib/ogImageGenerator';

const ActiveWorkoutContext = createContext();

export function ActiveWorkoutProvider({ children }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastExerciseIdChangeTrigger, setLastExerciseIdChangeTrigger] = useState(0);
  
  console.log('[ActiveWorkout] Provider initialized with user:', user?.id);
  console.log('[ActiveWorkout] Full user object:', user);
  
  // Test if Supabase real-time is working at all
  useEffect(() => {
    console.log('[ActiveWorkout] Testing Supabase real-time connection');
    const testChan = supabase
      .channel('test-connection')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'workouts'
      }, (payload) => {
        console.log('[Realtime][CONNECTION TEST] Any workout change:', payload);
      })
      .subscribe();
    
    return () => {
      console.log('[ActiveWorkout] Cleaning up test connection');
      void testChan.unsubscribe();
    };
  }, []);
  
  // Debug useEffect to see when user changes
  useEffect(() => {
    console.log('[ActiveWorkout] User changed effect triggered');
    console.log('[ActiveWorkout] User in effect:', user);
    console.log('[ActiveWorkout] User ID in effect:', user?.id);
  }, [user]);
  
  // Track sets that were manually completed in this session (to prevent animations)
  const [manuallyCompletedSets, setManuallyCompletedSets] = useState(new Set());
  
  // Track sets that have already shown completion toasts (to prevent duplicates across sections)
  const [toastedSets, setToastedSets] = useState(new Set());

  // Effect to check for an active workout on load
  useEffect(() => {
    console.log('[ActiveWorkout] User changed, checking for active workout:', user?.id);
    console.log('[ActiveWorkout] Clearing workout state due to user change');
    
    // Clear existing workout state when user changes
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setElapsedTime(0);
    
    const checkForActiveWorkout = async () => {
      if (!user) {
        setLoading(false);
        // Clear workout state when no user
        setActiveWorkout(null);
        setIsWorkoutActive(false);
        setElapsedTime(0);
        

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
        // Clear workout state on error
        setActiveWorkout(null);
        setIsWorkoutActive(false);
        setElapsedTime(0);
        

          return;
        }
        if (!workout) {
                  setLoading(false);
        // Clear workout state when no active workout found
        setActiveWorkout(null);
        setIsWorkoutActive(false);
        setElapsedTime(0);
        

          return;
        }

        // If there's a last_workout_exercise_id, convert it to exercise_id
        let lastExerciseId = null;
        if (workout.last_workout_exercise_id) {
          try {
            const { data: workoutExercise, error: conversionError } = await supabase
              .from('workout_exercises')
              .select('exercise_id')
              .eq('id', workout.last_workout_exercise_id)
              .single();

            if (!conversionError && workoutExercise?.exercise_id) {
              lastExerciseId = workoutExercise.exercise_id;
              console.log('[ActiveWorkout] Converted workout_exercise_id', workout.last_workout_exercise_id, 'to exercise_id', lastExerciseId);
            } else {
              console.warn('[ActiveWorkout] Could not convert workout_exercise_id to exercise_id:', workout.last_workout_exercise_id);
            }
          } catch (err) {
            console.error('[ActiveWorkout] Error converting workout_exercise_id:', err);
          }
        }

        // Build workout context data
        const workoutData = {
          id: workout.id,
          programId: workout.routine_id,
          workoutName: workout.workout_name || 'Workout',
          routineName: workout.routines?.routine_name || '',
          startTime: workout.created_at,
          lastExerciseId: lastExerciseId,
        };
        
        // Log when last workout exercise is loaded
        if (lastExerciseId) {
          console.log('[ActiveWorkout] Last workout exercise loaded:', lastExerciseId);
        }
        
        setActiveWorkout(workoutData);
        
        // Compute elapsed time
        const elapsed = workout.created_at
          ? Math.floor((new Date() - new Date(workout.created_at)) / 1000)
          : 0;
        setElapsedTime(elapsed);
        setIsWorkoutActive(true);
        

        
        console.log('[ActiveWorkout] Active workout found and set:', workoutData);
      } catch (err) {
        console.error('Error checking for active workout:', err);
      } finally {
        setLoading(false);
      }
    };
    checkForActiveWorkout();
    

  }, [user?.id]);

  // Timer effect: derive strictly from workout startTime (created_at)
  useEffect(() => {
    let timer;
    if (isWorkoutActive && activeWorkout?.startTime) {
      const update = () => {
        const start = new Date(activeWorkout.startTime).getTime();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      };
      update();
      timer = setInterval(update, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [isWorkoutActive, activeWorkout?.startTime]);

  // Real-time subscriptions for workout status changes only
  useEffect(() => {
    if (!activeWorkout?.id || !user?.id) return;
    
    // Subscribe to workout status changes (completion/updates)
    const workoutChan = supabase
      .channel(`public:workouts:id=eq.${activeWorkout.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workouts', filter: `id=eq.${activeWorkout.id}` }, async ({ eventType, new: w, old }) => {
        console.log('[Real-time] Workout change:', eventType, w, old);
        
        if (eventType === 'UPDATE') {
          // Sync last exercise across clients, but only if it's different and not during restoration
          if (w.last_workout_exercise_id && w.last_workout_exercise_id !== activeWorkout?.lastExerciseId) {
            // Convert the new workout_exercise_id to exercise_id
            try {
              const { data: workoutExercise, error: conversionError } = await supabase
                .from('workout_exercises')
                .select('exercise_id')
                .eq('id', w.last_workout_exercise_id)
                .single();

              if (!conversionError && workoutExercise?.exercise_id) {
                setActiveWorkout(prev => prev ? { ...prev, lastExerciseId: workoutExercise.exercise_id } : prev);
                // Trigger focus restoration for cross-device sync
                setLastExerciseIdChangeTrigger(prev => prev + 1);
              }
            } catch (err) {
              console.error('[ActiveWorkout] Error converting workout_exercise_id in real-time update:', err);
            }
          } else if (w.last_workout_exercise_id && w.last_workout_exercise_id === activeWorkout?.lastExerciseId) {
            // Even if the lastExerciseId is the same, trigger focus restoration for cross-device sync
            // This handles the case where both windows are working on the same exercise
            console.log('[ActiveWorkout] Same exercise completed remotely, triggering focus restoration');
            setLastExerciseIdChangeTrigger(prev => prev + 1);
          }
          
          // Handle workout completion
          setIsWorkoutActive(w.is_active);
          if (!w.is_active) {
            console.log('[Real-time] Workout ended remotely, clearing state...');
            console.log('[Real-time] Workout ID:', activeWorkout?.id);
            console.log('[Real-time] Was completed:', w.completed_at);
            console.log('[Real-time] Current user:', user?.id);
            
            // Store workout ID before clearing state for navigation
            const workoutId = activeWorkout?.id;
            const wasCompleted = w.completed_at;
            // Clear workout state - let the ActiveWorkout page handle navigation
            setActiveWorkout(null);
            setElapsedTime(0);
            
            // Navigate based on whether workout was completed or deleted
            // Add a small delay to ensure this takes precedence over auto-redirect logic
            setTimeout(() => {
              if (workoutId && wasCompleted) {
                console.log('[Real-time] Navigating to workout summary:', workoutId);
                navigate(`/history/${workoutId}`);
              } else {
                console.log('[Real-time] Navigating to routines (workout deleted)');
                navigate('/routines');
              }
            }, 100);
          }
        } else if (eventType === 'DELETE') {
          console.log('[Real-time] Workout deleted remotely, ending local session...');
          // Workout was deleted (no sets logged), end local session
          setIsWorkoutActive(false);
          setActiveWorkout(null);
          setElapsedTime(0);
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
          setElapsedTime(0);
          setIsPaused(false);
          navigate('/routines');
        }
      })
      .subscribe();

    return () => {
      void workoutChan.unsubscribe();
      void userWorkoutChan.unsubscribe();
    };
  }, [activeWorkout?.id, user?.id, navigate]);

  // Auto-navigate into any new active workout for this user (delegate or delegator), and initialize context
  useEffect(() => {
    console.log('[ActiveWorkout] Real-time subscription useEffect triggered');
    console.log('[ActiveWorkout] User object in useEffect:', user);
    console.log('[ActiveWorkout] User ID in useEffect:', user?.id);
    if (!user?.id) {
      console.log('[ActiveWorkout] No user ID, skipping real-time subscription setup');
      return;
    }
    console.log('[ActiveWorkout] Setting up real-time subscription for user:', user.id);
    
    // Use the newer Supabase v2.5+ syntax for real-time subscriptions with RLS
    const globalChan = supabase
      .channel(`realtime:public:workouts:user_id=eq.${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'workouts'
      }, async ({ new: w }) => {
        // Filter in the callback to ensure we only process workouts for this user
        if (w.user_id !== user.id) return;
        console.log('[Realtime][INSERT] New workout detected for user:', user.id, w);
        console.log('[Realtime][INSERT] New workout detected:', w);
        console.log('[Realtime][global new workout]', w);
        console.log('[Realtime] Current activeWorkout:', activeWorkout);
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
            // Navigate into the record page
            navigate('/workout/active');
          } catch (e) {
            console.error('Error initializing remote workout:', e);
          }
        }
      })
      .subscribe((status) => {
        console.log('[ActiveWorkout] Real-time subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[ActiveWorkout] Successfully subscribed to workout changes for user:', user.id);
        } else if (status === 'CLOSED' || status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          console.error('[ActiveWorkout] Real-time subscription failed:', status);
        }
      });

    console.log('[ActiveWorkout] Real-time subscription created for user:', user.id);

    return () => {
      console.log('[ActiveWorkout] Cleaning up real-time subscription for user:', user.id);
      void globalChan.unsubscribe();
    };
  }, [user?.id]);

  const startWorkout = useCallback(async (program) => {
    if (!user) throw new Error("User not authenticated.");
    
    console.log('[ActiveWorkout] startWorkout called for user:', user.id);
    console.log('[ActiveWorkout] Program data:', program);

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
          is_public: true,
        })
        .select()
        .single();
      if (insertErr) throw insertErr;
      workout = inserted;
      console.log('[ActiveWorkout] Workout created successfully:', workout);
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
    let firstWorkoutExerciseId = null;
    let insertedExercises = null;
    try {
      const snapshotPayload = program.routine_exercises.map((progEx, idx) => ({
        workout_id: workout.id,
        exercise_id: progEx.exercise_id,
        exercise_order: progEx.exercise_order || idx + 1,
        snapshot_name: progEx.exercises.name,
      }));
      const { data: exercisesData, error: snapshotError } = await supabase
        .from("workout_exercises")
        .insert(snapshotPayload)
        .select('id, exercise_id, exercise_order');
      if (snapshotError) {
        console.error("Error snapshotting exercises:", snapshotError);
      } else if (exercisesData && exercisesData.length > 0) {
        insertedExercises = exercisesData;
        // Find the first exercise by section priority (warmup -> training -> cooldown) then by exercise_order
        const sectionPriority = { warmup: 1, training: 2, cooldown: 3 };
        const firstExercise = insertedExercises.reduce((first, current) => {
          // Get the section for each exercise from the original program data
          const currentSection = program.routine_exercises.find(ex => ex.exercise_id === current.exercise_id)?.exercises?.section || "training";
          const firstSection = program.routine_exercises.find(ex => ex.exercise_id === first.exercise_id)?.exercises?.section || "training";
          
          const currentPriority = sectionPriority[currentSection] || 2;
          const firstPriority = sectionPriority[firstSection] || 2;
          
          // If sections are different, prioritize by section order
          if (currentPriority !== firstPriority) {
            return currentPriority < firstPriority ? current : first;
          }
          
          // If sections are the same, prioritize by exercise_order
          return current.exercise_order < first.exercise_order ? current : first;
        });
        firstWorkoutExerciseId = firstExercise.id;        
        // Update the workout to set the first exercise as last_workout_exercise_id
        const { error: updateError } = await supabase
          .from('workouts')
          .update({ last_workout_exercise_id: firstWorkoutExerciseId })
          .eq('id', workout.id);
        
        if (updateError) {
          console.error("Error setting first exercise as last_workout_exercise_id:", updateError);
        } else {
          console.log('[ActiveWorkout] Set first exercise as last_workout_exercise_id:', firstWorkoutExerciseId);
        }
      }
    } catch (err) {
      console.error("Error snapshotting exercises for workout start:", err);
    }

    // Update workoutData with the first exercise's exercise_id
    const updatedWorkoutData = {
      ...workoutData,
      lastExerciseId: firstWorkoutExerciseId && insertedExercises ? 
        program.routine_exercises.find(ex => ex.exercise_id === 
          (insertedExercises.find(we => we.id === firstWorkoutExerciseId)?.exercise_id)
        )?.exercise_id : null
    };

    // Only update context state after snapshot insert is done
    setActiveWorkout(updatedWorkoutData);
    setIsWorkoutActive(true);
    setElapsedTime(0);

    return workoutData;
  }, [user]);

  // Helper function to gather workout data for OG image generation
  const gatherWorkoutDataForOG = useCallback(async (workoutId) => {
    try {
      // Fetch comprehensive workout data
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .select(`
          *,
          routines!workouts_routine_id_fkey(routine_name),
          workout_exercises(
            id,
            exercises(name)
          ),
          sets!sets_workout_id_fkey(id)
        `)
        .eq('id', workoutId)
        .single();

      if (workoutError || !workout) {
        console.error('Error fetching workout data for OG image:', workoutError);
        return null;
      }

      // Calculate metrics
      const exerciseCount = workout.workout_exercises?.length || 0;
      const setCount = workout.sets?.length || 0;
      
      // Format duration
      const durationSeconds = workout.duration_seconds || elapsedTime;
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

      // Format date
      const completedDate = new Date(workout.completed_at || new Date());
      const date = completedDate.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });

      return {
        routineName: workout.routines?.routine_name || 'Workout',
        workoutName: workout.workout_name || 'Completed Workout',
        date: date,
        duration: duration,
        exerciseCount: exerciseCount,
        setCount: setCount
      };
    } catch (error) {
      console.error('Error gathering workout data for OG image:', error);
      return null;
    }
  }, [elapsedTime]);

  const endWorkout = useCallback(async () => {
    if (!activeWorkout?.id) return false;
    console.log('[ActiveWorkout] endWorkout called for workout:', activeWorkout.id);
    console.log('[ActiveWorkout] Current user context:', user?.id);
    
    // Fetch the workout details to see which user it belongs to
    const { data: workoutDetails, error: workoutError } = await supabase
      .from('workouts')
      .select('user_id, workout_name')
      .eq('id', activeWorkout.id)
      .single();
    
    if (workoutError) {
      console.error('[ActiveWorkout] Error fetching workout details:', workoutError);
    } else {
      console.log('[ActiveWorkout] Workout belongs to user:', workoutDetails.user_id);
      console.log('[ActiveWorkout] Workout name:', workoutDetails.workout_name);
    }
    
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
        } else {
          saved = true;
          
          // Generate OG image for completed workout (fire and forget)
          try {
            const workoutData = await gatherWorkoutDataForOG(activeWorkout.id);
            if (workoutData) {
              console.log('[ActiveWorkout] Generating OG image for workout:', activeWorkout.id);
              // Don't await this - let it run in background
              generateAndUploadOGImage(activeWorkout.id, workoutData)
                .then(imageUrl => {
                  console.log('[ActiveWorkout] OG image generated successfully:', imageUrl);
                })
                .catch(error => {
                  console.error('[ActiveWorkout] Error generating OG image:', error);
                });
            }
          } catch (error) {
            console.error('[ActiveWorkout] Error in OG image generation flow:', error);
          }
        }
      }
    } catch (err) {
      console.error('Unexpected error ending workout:', err);
    }

    // Reset local state regardless of outcome
    setIsWorkoutActive(false);
    setActiveWorkout(null);
    setElapsedTime(0);
    return saved;
  }, [activeWorkout, elapsedTime, gatherWorkoutDataForOG]);

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

  // Mark a set as manually completed
  const markSetManuallyCompleted = useCallback((setId) => {
    setManuallyCompletedSets(prev => new Set([...prev, setId]));
  }, []);

  // Check if a set was manually completed
  const isSetManuallyCompleted = useCallback((setId) => {
    return manuallyCompletedSets.has(setId);
  }, [manuallyCompletedSets]);

  // Mark a set as toasted (to prevent duplicate notifications)
  const markSetToasted = useCallback((setId) => {
    setToastedSets(prev => new Set([...prev, setId]));
  }, []);

  // Check if a set has already been toasted
  const isSetToasted = useCallback((setId) => {
    return toastedSets.has(setId);
  }, [toastedSets]);

  // Clear manually completed sets and toasted sets when workout changes
  useEffect(() => {
    setManuallyCompletedSets(new Set());
    setToastedSets(new Set());
  }, [activeWorkout?.id]);

  const clearWorkoutState = useCallback(() => {
    console.log('[ActiveWorkout] Clearing workout state manually');
    setActiveWorkout(null);
    setIsWorkoutActive(false);
    setElapsedTime(0);
  }, []);

  return (
    <ActiveWorkoutContext.Provider 
      value={{ 
        activeWorkout, 
        isWorkoutActive, 
        startWorkout,
        elapsedTime,
        endWorkout,
        updateLastExercise,
        loading,
        lastExerciseIdChangeTrigger,
        markSetManuallyCompleted,
        isSetManuallyCompleted,
        markSetToasted,
        isSetToasted,
        clearWorkoutState
      }}
    >
      {children}
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