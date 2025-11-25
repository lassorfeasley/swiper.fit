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
    focusedExercise, // Alias to activeFocus for backward compatibility
    activeFocus,
    persistedFocus,
    setFocusedExerciseId,
    handleSectionComplete: navigationHandleSectionComplete,
    isWorkoutComplete,
    getProgressStats,
    sectionExercises,
    loadedSections,
    setUpdateLastExercise
  } = useWorkoutNavigation();
  
  // Register the DB update callback with the context
  useEffect(() => {
    if (updateLastExercise && setUpdateLastExercise) {
      setUpdateLastExercise(updateLastExercise);
    }
  }, [updateLastExercise, setUpdateLastExercise]);

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
      try {
        if (sessionStorage.getItem('skip_active_workout_redirect') === 'true') {
          skipAutoRedirectRef.current = true;
          sessionStorage.removeItem('skip_active_workout_redirect');
        }
      } catch (_) {}
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
    focusedId: activeFocus?.exercise_id || null,
    elementPrefix: 'exercise-',
    viewportPosition: 0.2,
    scrollBehavior: 'smooth',
    debounceMs: 150,
    maxRetries: 20, // Increase retries for restoration (up to ~3 seconds)
    // Re-enable idle recentering so manual scrolls or late layout shifts
    // are gently corrected, using the same positioning math as the initial scroll.
    recenterOnIdleMs: 5000,
    recenterThresholdPx: 40,
    // Delay the initial scroll slightly so the focused card has time to expand
    // before we measure and position it. This should make the first scroll
    // land in the same place the idle recenter used to land, but without
    // a second adjustment 5 seconds later.
    initialScrollDelayMs: 550
  });
  // Check if exercises are loaded (all sections have loaded)
  const exercisesLoaded = Object.values(loadedSections).every(loaded => loaded === true);

  // Single simple restoration rule: Restore focus when exercises are loaded
  useEffect(() => {
    if (!activeWorkout?.id || !exercisesLoaded) return;
    
    // If we already have active focus, don't restore
    if (activeFocus) return;
    
    // Try to restore from persistedFocus (DB value)
    if (persistedFocus) {
      // Find the exercise by workout_exercise.id
      let foundExercise = null;
      let foundSection = null;
      
      const sections = ['warmup', 'training', 'cooldown'];
      for (const section of sections) {
        const exercises = sectionExercises[section] || [];
        foundExercise = exercises.find(ex => ex.id === persistedFocus);
        if (foundExercise) {
          foundSection = section;
          break;
        }
      }
      
      if (foundExercise) {
        const focusId = foundExercise.id || foundExercise.exercise_id;
        if (focusId) {
          setFocusedExerciseId(focusId, foundSection || undefined, 'restore');
        }
        return;
      }
    }
    
    // No persisted focus, or exercise not found - fallback to first exercise
    // Prefer warmup for fresh workouts
    const isFreshWorkout = (elapsedTime ?? 0) < 120;
    const order = isFreshWorkout ? ['warmup', 'training', 'cooldown'] : ['warmup', 'training', 'cooldown'];
    
    for (const section of order) {
      const exercises = sectionExercises[section] || [];
      if (exercises.length > 0) {
        const firstExercise = exercises[0];
        const focusId = firstExercise.id || firstExercise.exercise_id;
        if (focusId) {
          setFocusedExerciseId(focusId, section, 'restore');
        }
        break;
      }
    }
  }, [exercisesLoaded, activeFocus, persistedFocus, sectionExercises, activeWorkout?.id, elapsedTime, setFocusedExerciseId]);

  // Real-time focus synchronization: Update persistedFocus when DB changes
  // The context will handle applying it to activeFocus only if user is idle
  useEffect(() => {
    // Skip if no workout or no last_workout_exercise_id
    if (!activeWorkout?.last_workout_exercise_id) {
      return;
    }
    
    // Skip if persistedFocus already matches (we're in sync)
    if (persistedFocus === activeWorkout.last_workout_exercise_id) {
      return;
    }
    
    // Find the exercise by workout_exercise.id
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
      // Exercise not loaded yet, skip for now (will retry when exercises load)
      return;
    }
    
    // Update via sync - context will handle echo detection and idle checking
    const focusId = foundExercise.id || foundExercise.exercise_id;
    if (focusId) {
      setFocusedExerciseId(focusId, foundSection || undefined, 'sync');
    }
  }, [activeWorkout?.last_workout_exercise_id, persistedFocus, setFocusedExerciseId, sectionExercises]);

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
        />

        {/* Training Section */}
        <ActiveWorkoutSection
          section="training"
          onSectionComplete={handleSectionComplete}
        />

        {/* Cooldown Section */}
        <ActiveWorkoutSection
          section="cooldown"
          onSectionComplete={handleSectionComplete}
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
