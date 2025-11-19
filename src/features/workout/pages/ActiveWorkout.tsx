import React, {
  useState,
  useEffect,
  useContext,
  useRef
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import AppLayout from "@/components/layout/AppLayout";
import SwiperDialog from "@/components/shared/SwiperDialog";
import ActiveWorkoutNav from "../components/ActiveWorkoutNav";
import { toast } from "@/lib/toastReplacement";
 
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import ActiveWorkoutSection from "./ActiveWorkoutSection";
import { WorkoutNavigationProvider, useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";
import { useAutoScroll } from "@/hooks/useAutoScroll";

const DEBUG_LOG = false; // set to true to enable verbose logging

function debug(...args) {
  if (DEBUG_LOG) console.log("[ActiveWorkout]", ...args);
}

const ActiveWorkoutContent: React.FC = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    loading,
    endWorkout: contextEndWorkout,
    updateLastExercise,
    elapsedTime,
  } = useActiveWorkout();

  const {
    focusedExercise,
    setFocusedExerciseId,
    handleSectionComplete: navigationHandleSectionComplete,
    isWorkoutComplete,
    getProgressStats,
    sectionExercises,
    loadedSections
  } = useWorkoutNavigation();

  // Remove user activity tracking - simplified approach
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);
  const [isEndConfirmOpen, setEndConfirmOpen] = useState(false);
  const skipAutoRedirectRef = useRef(false);

  
  const { isDelegated, returnToSelf, loading: accountLoading } = useAccount();
  const { user } = useAuth();

  // List container ref (kept – may be used by the replacement implementation)
  const listRef = useRef(null);

  useEffect(() => {
    // CRITICAL: If we're in delegated mode, NEVER redirect to routines
    // Trainers managing clients should ALWAYS stay on the workout page (even if no workout exists)
    if (isDelegated) {
      return;
    }
    
    // Only redirect after both contexts finish loading (workout + delegation)
    if (loading || accountLoading) {
      return;
    }
    
    if (!isWorkoutActive) {
      // Skip auto-redirect if user just ended workout
      if (skipAutoRedirectRef.current) {
        skipAutoRedirectRef.current = false;
        return;
      }
      
      navigate("/routines", { replace: true });
    }
  }, [loading, accountLoading, isWorkoutActive, navigate, user?.id, isDelegated, activeWorkout?.id]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  // Use the dedicated autoscroll hook
  // Increase retries and delay for restoration to ensure element is found
  useAutoScroll({
    focusedId: focusedExercise?.exercise_id || null,
    elementPrefix: 'exercise-',
    viewportPosition: 0.2,
    scrollBehavior: 'smooth',
    debounceMs: 150,
    maxRetries: 20, // Increase retries for restoration (up to 3 seconds)
    recenterOnIdleMs: 5000,
    recenterThresholdPx: 40
  });
  // Auto-focus on first exercise when starting a new workout, or restore focus to last exercise
  const isRestoringFocusRef = useRef(false);
  const didWarmupOverrideRef = useRef(false);
  
  // Reset restoration flag when workout changes
  useEffect(() => {
    isRestoringFocusRef.current = false;
  }, [activeWorkout?.id]);

  
  useEffect(() => {
    if (!activeWorkout?.id) return;

    // Prevent multiple restoration attempts
    if (isRestoringFocusRef.current) return;

    // Fresh workout: only prefer warmup if there's no last_workout_exercise_id (truly new workout)
    const isFreshWorkout = (elapsedTime ?? 0) < 120;
    if (isFreshWorkout && !didWarmupOverrideRef.current && !activeWorkout?.last_workout_exercise_id) {
      if (!loadedSections?.warmup) return; // wait until we know if warmup exists
      const warm = sectionExercises?.warmup || [];
      if (warm.length > 0) {
        const firstWarm = warm[0];
        isRestoringFocusRef.current = true;
        didWarmupOverrideRef.current = true;
        setFocusedExerciseId(firstWarm.exercise_id, 'warmup');
        try { if (firstWarm.id) updateLastExercise(firstWarm.id); } catch (_) {}
        // Reset restoration flag after a short delay to allow real-time syncs
        setTimeout(() => {
          isRestoringFocusRef.current = false;
        }, 500);
        return;
      }
      // If no warmup, fall through to training/cooldown order
    }

    // Standard restore flow - restore to last opened exercise
    const timer = setTimeout(() => {
      if (activeWorkout?.last_workout_exercise_id) {
        // Find the exercise by workout_exercise.id (stored in last_workout_exercise_id)
        // and get its exercise_id to set focus
        let foundExercise = null;
        let foundSection = null;
        
        const sections = ['warmup', 'training', 'cooldown'];
        for (const section of sections) {
          const exercises = sectionExercises[section] || [];
          foundExercise = exercises.find(ex => ex.id === activeWorkout.last_workout_exercise_id);
          if (foundExercise) {
            foundSection = section;
            break;
          }
        }
        
        if (foundExercise) {
          isRestoringFocusRef.current = true;
          setFocusedExerciseId(foundExercise.exercise_id, foundSection || undefined);
          // Reset restoration flag after a short delay to allow real-time syncs
          setTimeout(() => {
            isRestoringFocusRef.current = false;
          }, 500);
        }
        // Exercise not loaded yet, will be handled by the reactive restoration effect
      } else {
        // No last exercise, focus on first exercise of first available section
        const order = ['warmup', 'training', 'cooldown'];
        for (const section of order) {
          if (!loadedSections[section]) return;
          const exercises = sectionExercises[section] || [];
          if (exercises.length > 0) {
            const firstExercise = exercises[0];
            isRestoringFocusRef.current = true;
            setFocusedExerciseId(firstExercise.exercise_id, section);
            // Reset restoration flag after a short delay to allow real-time syncs
            setTimeout(() => {
              isRestoringFocusRef.current = false;
            }, 500);
            break;
          }
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [activeWorkout?.id, elapsedTime, loadedSections?.warmup, loadedSections?.training, loadedSections?.cooldown, sectionExercises, setFocusedExerciseId, updateLastExercise]);

  // Reactive trigger: Restore focus as soon as sections have loaded exercises
  useEffect(() => {
    // If we've enforced warmup-first, don't revert to last_workout_exercise_id
    if (didWarmupOverrideRef.current) return;
    if (!activeWorkout?.last_workout_exercise_id || isRestoringFocusRef.current) return;
    
    // Check if any sections have loaded exercises
    const hasExercises = Object.values(sectionExercises).some(exercises => exercises.length > 0);
    
    if (hasExercises) {
      // Find the exercise by workout_exercise.id and get its exercise_id
      let foundExercise = null;
      let foundSection = null;
      
      const sections = ['warmup', 'training', 'cooldown'];
      for (const section of sections) {
        const exercises = sectionExercises[section] || [];
        foundExercise = exercises.find(ex => ex.id === activeWorkout.last_workout_exercise_id);
        if (foundExercise) {
          foundSection = section;
          break;
        }
      }
      
      if (foundExercise) {
        // Sections are ready, restore focus with a small delay to avoid render-phase state updates
        isRestoringFocusRef.current = true;
        
        // Use setTimeout to defer the state update to the next tick
        setTimeout(() => {
          setFocusedExerciseId(foundExercise.exercise_id, foundSection || undefined);
          // Reset restoration flag after focus is set to allow real-time syncs
          setTimeout(() => {
            isRestoringFocusRef.current = false;
          }, 500);
        }, 100);
      }
    }
  }, [sectionExercises, activeWorkout?.last_workout_exercise_id, setFocusedExerciseId]);

  // Fallback rule: If no exercise is focused, focus the first exercise of the first section
  // BUT only if we have an active workout (otherwise we're just loading)
  useEffect(() => {
    if (!focusedExercise && !isRestoringFocusRef.current && activeWorkout?.id) {
      // Prefer warmup once it has loaded. Do not skip ahead unless warmup loaded and is empty.
      const order = ['warmup', 'training', 'cooldown'];
      for (const section of order) {
        if (!loadedSections[section]) {
          return; // wait for this section (especially warmup) to load
        }
        const exercises = sectionExercises[section] || [];
        if (exercises.length > 0) {
          const firstExercise = exercises[0];
          setFocusedExerciseId(firstExercise.exercise_id, section);
          break;
        }
        // if loaded and empty, continue
      }
    }
  }, [sectionExercises, loadedSections, focusedExercise, setFocusedExerciseId, activeWorkout?.id]);

  // Real-time focus synchronization: Watch for changes to last_workout_exercise_id from other devices
  const lastSyncedExerciseIdRef = useRef<string | null>(null);
  
  // Reset sync tracking when workout changes
  useEffect(() => {
    lastSyncedExerciseIdRef.current = null;
  }, [activeWorkout?.id]);
  
  useEffect(() => {
    // Skip if we're in the middle of restoring focus (initial load)
    // BUT allow sync if this is a real-time update (lastSyncedId is not null, meaning we've synced before)
    // This prevents blocking real-time updates during initial restoration
    if (isRestoringFocusRef.current && lastSyncedExerciseIdRef.current === null) {
      return;
    }
    
    // Skip if no workout or no last_workout_exercise_id
    if (!activeWorkout?.last_workout_exercise_id) {
      return;
    }
    
    // Find the exercise by workout_exercise.id to get its exercise_id
    let foundExercise = null;
    let foundSection = null;
    
    const sections = ['warmup', 'training', 'cooldown'];
    for (const section of sections) {
      const exercises = sectionExercises[section] || [];
      foundExercise = exercises.find(ex => ex.id === activeWorkout.last_workout_exercise_id);
      if (foundExercise) {
        foundSection = section;
        break;
      }
    }
    
    if (!foundExercise) {
      // Exercise not loaded yet, skip for now
      return;
    }
    
    // Skip if focused exercise already matches the database value (we're already in sync)
    // This handles both cases: we just updated it ourselves, or we already synced it
    if (focusedExercise?.exercise_id === foundExercise.exercise_id) {
      lastSyncedExerciseIdRef.current = activeWorkout.last_workout_exercise_id;
      return;
    }
    
    // Skip if we just synced to this exercise (prevent loops)
    if (lastSyncedExerciseIdRef.current === activeWorkout.last_workout_exercise_id) {
      return;
    }
    
    // This is a real-time update from another device - sync the focus
    lastSyncedExerciseIdRef.current = activeWorkout.last_workout_exercise_id;
    setFocusedExerciseId(foundExercise.exercise_id, foundSection || undefined);
  }, [activeWorkout?.last_workout_exercise_id, focusedExercise?.exercise_id, setFocusedExerciseId, sectionExercises]);

  const handleEndWorkout = () => {
    setEndConfirmOpen(true);
  };

  const handleConfirmEnd = async () => {
    // Prevent the auto-redirect effect from firing
    skipAutoRedirectRef.current = true;
    try {
      const hadSets = await contextEndWorkout();
      const wid = activeWorkout?.id;
      
      if (hadSets && wid) {
        // Show notification that workout ended
        toast.success('Workout completed!', {
          description: 'Viewing workout summary...'
        });
        // Go to workout summary page for both trainer and client
        navigate(`/history/${wid}`, { replace: true });
      } else {
        // No sets completed, go back to train page
        if (isDelegated) {
          returnToSelf();
        } else {
          navigate('/train', { replace: true });
        }
      }
    } catch (error) {
      console.error("Error ending workout:", error);
      toast.error("There was an error ending your workout. Please try again.");
    } finally {
      setEndConfirmOpen(false);
    }
  };

  

  const handleDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // End the workout without saving (this will clear the context)
      await contextEndWorkout();
      if (isDelegated) {
        returnToSelf();
      } else {
        navigate("/train");
      }
    } catch (err) {
      alert("Failed to delete workout: " + err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle section completion
  const handleSectionComplete = (sectionName, justCompletedExerciseId) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionName);

      // Use the navigation context to find the next exercise
      // Pass the just-completed exercise ID to account for async state updates
      const nextExercise = navigationHandleSectionComplete(sectionName, justCompletedExerciseId);
      
      if (nextExercise) {
        // There are more exercises to complete, continue the workout
        console.log(`Section ${sectionName} complete. Next exercise:`, nextExercise);
        
        // Update the database with the new focused exercise
        // Find the workout_exercise.id from sectionExercises
        const nextSection = nextExercise.section || sectionName;
        const exercises = sectionExercises[nextSection] || [];
        const foundExercise = exercises.find(ex => ex.exercise_id === nextExercise.exercise_id);
        
        if (foundExercise?.id && updateLastExercise) {
          // Update database to sync focus across devices
          updateLastExercise(foundExercise.id);
        }
      } else {
        // All exercises are complete, end the workout
        if (!workoutAutoEnded) {
          setWorkoutAutoEnded(true);
          (async () => {
            const wid = activeWorkout?.id;
            // Prevent the auto-redirect effect from firing
            skipAutoRedirectRef.current = true;
            // End workout first to clear active context and prevent redirects
            const hadSets = await contextEndWorkout();
            if (hadSets && wid) {
              // Show notification that workout ended
              toast.success('Workout completed!', {
                description: 'Viewing workout summary...'
              });
              // Navigate to workout summary page for both trainer and client
              navigate(`/history/${wid}`, { replace: true });
            } else {
              // No sets completed
              if (isDelegated) {
                returnToSelf();
              } else {
                navigate("/train", { replace: true });
              }
            }
          })();
        }
      }

      return newSet;
    });
  };

  // Compute progress counts for nav using the navigation context
  const progressStats = getProgressStats();
  const totalSets = progressStats.total;
  const completedSets = progressStats.completed;
  const progress = totalSets > 0 ? completedSets / totalSets : 0;

  return (
    <AppLayout
      hideHeader={true}
      showAddButton={false}
      showPlusButton={false}
      pageNameEditable={false}
      showBackButton={false}
      title={activeWorkout?.routine_name || "Active Workout"}
      showAdd={false}
      showSettings={false}
      onSettings={undefined}
      onDelete={handleDeleteWorkout}
      showDeleteOption={true}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="workout"
      noTopPadding={!isDelegated}
      showSidebar={false}
      enableScrollSnap={false}
    >
      {/* Active workout nav: label scrolls, controls stick */}
      <ActiveWorkoutNav onEnd={handleEndWorkout} progress={progress} />

      <div ref={listRef} className="flex flex-col min-h-screen bg-transparent px-0">
        {/* Spacer to clear sticky subheader */}
        <div className="h-5" aria-hidden="true" />
        {/* Warmup Section */}
        <ActiveWorkoutSection
          section="warmup"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
        />

        {/* Training Section */}
        <ActiveWorkoutSection
          section="training"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
        />

        {/* Cooldown Section */}
        <ActiveWorkoutSection
          section="cooldown"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
          isLastSection={true}
        />
      </div>

      <SwiperDialog
        open={isEndConfirmOpen}
        onOpenChange={setEndConfirmOpen}
        onConfirm={handleConfirmEnd}
        onCancel={() => setEndConfirmOpen(false)}
        title="End workout?"
        confirmText="End workout"
        cancelText="Keep working out"
      />
    </AppLayout>
  );
};

ActiveWorkoutContent.propTypes = {
  // PropTypes can be re-added if needed
};

const ActiveWorkout = () => {
  return (
    <WorkoutNavigationProvider>
      <ActiveWorkoutContent />
    </WorkoutNavigationProvider>
  );
};

export default ActiveWorkout;
