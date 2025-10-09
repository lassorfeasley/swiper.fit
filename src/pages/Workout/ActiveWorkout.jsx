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
import SwiperDialog from "@/components/molecules/swiper-dialog";
import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import SwiperProgress from "@/components/molecules/swiper-progress";
import { toast } from "sonner";
 
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import ActiveWorkoutSection from "./ActiveWorkoutSection";
import { WorkoutNavigationProvider, useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";
import { useWorkoutAutoScroll } from "@/hooks/useAutoScroll";

const DEBUG_LOG = false; // set to true to enable verbose logging

function debug(...args) {
  if (DEBUG_LOG) console.log("[ActiveWorkout]", ...args);
}

const ActiveWorkoutContent = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    loading,
    endWorkout: contextEndWorkout,
    updateLastExercise,
    lastExerciseIdChangeTrigger,
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

  
  const { isDelegated, returnToSelf } = useAccount();
  const { user } = useAuth();
  
  

  // List container ref (kept – may be used by the replacement implementation)
  const listRef = useRef(null);

  useEffect(() => {
    // Only redirect after loading has finished
    if (loading) return;
    if (!isWorkoutActive) {
      console.log('[ActiveWorkout] Workout not active, checking auto-redirect...');
      console.log('[ActiveWorkout] skipAutoRedirectRef.current:', skipAutoRedirectRef.current);
      console.log('[ActiveWorkout] Current user:', user?.id);
      
      // Skip auto-redirect if user just ended workout
      if (skipAutoRedirectRef.current) {
        console.log('[ActiveWorkout] Skipping auto-redirect (user ended workout)');
        skipAutoRedirectRef.current = false;
        return;
      }
      // Delegates should remain on the active workout route on refresh
      if (isDelegated) {
        console.log('[ActiveWorkout] Delegate detected – staying on active workout route after refresh');
        return;
      }
      console.log('[ActiveWorkout] Auto-redirecting to routines');
      navigate("/routines", { replace: true });
    }
  }, [loading, isWorkoutActive, navigate, user?.id, isDelegated]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  // Use the dedicated autoscroll hook
  useWorkoutAutoScroll({
    focusedExercise,
    viewportPosition: 0.2
  });
  // Auto-focus on first exercise when starting a new workout, or restore focus to last exercise
  const isRestoringFocusRef = useRef(false);
  const didWarmupOverrideRef = useRef(false);
  
  // Reset restoration flag when workout changes
  useEffect(() => {
    isRestoringFocusRef.current = false;
  }, [activeWorkout?.id]);

  // Reset restoration flag when lastExerciseId changes via real-time subscription (cross-device sync)
  useEffect(() => {
    if (lastExerciseIdChangeTrigger > 0) {
      console.log('[ActiveWorkout] Cross-device focus change detected, resetting restoration flag');
      isRestoringFocusRef.current = false;
    }
  }, [lastExerciseIdChangeTrigger]);
  
  useEffect(() => {
    if (!activeWorkout?.id) return;

    // Prevent multiple restoration attempts
    if (isRestoringFocusRef.current) return;

    // Fresh workout: wait for warmup to load, then prefer warmup explicitly and persist it
    const isFreshWorkout = (elapsedTime ?? 0) < 120;
    if (isFreshWorkout && !didWarmupOverrideRef.current) {
      if (!loadedSections?.warmup) return; // wait until we know if warmup exists
      const warm = sectionExercises?.warmup || [];
      if (warm.length > 0) {
        const firstWarm = warm[0];
        isRestoringFocusRef.current = true;
        didWarmupOverrideRef.current = true;
        setFocusedExerciseId(firstWarm.exercise_id, 'warmup');
        try { if (firstWarm.id) updateLastExercise(firstWarm.id); } catch (_) {}
        return;
      }
      // If no warmup, fall through to training/cooldown order
    }

    // Standard restore flow
    const timer = setTimeout(() => {
      if (activeWorkout?.lastExerciseId) {
        isRestoringFocusRef.current = true;
        setFocusedExerciseId(activeWorkout.lastExerciseId, null);
      } else {
        const order = ['warmup', 'training', 'cooldown'];
        for (const section of order) {
          if (!loadedSections[section]) return;
          const exercises = sectionExercises[section] || [];
          if (exercises.length > 0) {
            const firstExercise = exercises[0];
            isRestoringFocusRef.current = true;
            setFocusedExerciseId(firstExercise.exercise_id, section);
            break;
          }
        }
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [activeWorkout?.id, elapsedTime, loadedSections?.warmup, loadedSections?.training, loadedSections?.cooldown, sectionExercises, setFocusedExerciseId, updateLastExercise]);

  // Reactive trigger: Restore focus as soon as sections have loaded exercises
  useEffect(() => {
    // If we’ve enforced warmup-first, don’t revert to lastExerciseId
    if (didWarmupOverrideRef.current) return;
    if (!activeWorkout?.lastExerciseId || isRestoringFocusRef.current) return;
    
    // Check if any sections have loaded exercises
    const hasExercises = Object.values(sectionExercises).some(exercises => exercises.length > 0);
    
    if (hasExercises) {
      // Sections are ready, restore focus with a small delay to avoid render-phase state updates
      console.log('[ActiveWorkout] Sections loaded, restoring focus to:', activeWorkout.lastExerciseId);
      isRestoringFocusRef.current = true;
      
      // Use setTimeout to defer the state update to the next tick
      setTimeout(() => {
        // Add a small delay to give timer-based restoration priority
        setTimeout(() => {
          console.log('[ActiveWorkout] Reactive restoration setting focus to:', activeWorkout.lastExerciseId);
          setFocusedExerciseId(activeWorkout.lastExerciseId, null);
        }, 100);
      }, 0);
    }
  }, [sectionExercises, activeWorkout?.lastExerciseId, setFocusedExerciseId]);

  // Fallback rule: If no exercise is focused, focus the first exercise of the first section
  useEffect(() => {
    if (!focusedExercise && !isRestoringFocusRef.current) {
      // Prefer warmup once it has loaded. Do not skip ahead unless warmup loaded and is empty.
      const order = ['warmup', 'training', 'cooldown'];
      for (const section of order) {
        if (!loadedSections[section]) {
          return; // wait for this section (especially warmup) to load
        }
        const exercises = sectionExercises[section] || [];
        if (exercises.length > 0) {
          const firstExercise = exercises[0];
          console.log(`[ActiveWorkout] Defaulting initial focus to first exercise of ${section}:`, firstExercise.exercise_id);
          setFocusedExerciseId(firstExercise.exercise_id, section);
          break;
        }
        // if loaded and empty, continue
      }
    }
  }, [sectionExercises, loadedSections, focusedExercise, setFocusedExerciseId]);

  const handleEndWorkout = () => {
    setEndConfirmOpen(true);
  };

  const handleConfirmEnd = async () => {
    // Prevent the auto-redirect effect from firing
    skipAutoRedirectRef.current = true;
    try {
      const saved = await contextEndWorkout();
      const wid = activeWorkout?.id;
      if (saved && wid) {
        // Workout had completed sets – go to summary
        navigate(`/history/${wid}`, { replace: true });
      } else {
        // No sets completed – route based on role
        if (isDelegated) {
          navigate('/sharing', { replace: true });
        } else {
          navigate('/routines', { replace: true });
        }
      }
    } catch (error) {
      console.error("Error ending workout:", error);
      alert("There was an error ending your workout. Please try again.");
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
        navigate("/routines");
      }
    } catch (err) {
      alert("Failed to delete workout: " + err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Handle section completion
  const handleSectionComplete = (sectionName) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(sectionName);

      // Use the navigation context to find the next exercise
      const nextExercise = navigationHandleSectionComplete(sectionName);
      
      if (nextExercise) {
        // There are more exercises to complete, continue the workout
        console.log(`Section ${sectionName} complete. Next exercise:`, nextExercise);
      } else {
        // All exercises are complete, end the workout
        if (!workoutAutoEnded) {
          setWorkoutAutoEnded(true);
          (async () => {
            const wid = activeWorkout?.id;
            // Prevent the auto-redirect effect from firing
            skipAutoRedirectRef.current = true;
            // End workout first to clear active context and prevent redirects
            const saved = await contextEndWorkout();
            if (saved && wid) {
              if (isDelegated) {
                // For delegates, return to their own sharing page
                returnToSelf();
              } else {
                navigate(`/history/${wid}`);
              }
            } else {
              if (isDelegated) {
                returnToSelf();
              } else {
                navigate("/routines");
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

  return (
    <AppLayout
      hideHeader={true}
      showAddButton={false}
      showPlusButton={false}
      pageNameEditable={false}
      showBackButton={false}
      title={activeWorkout?.routines?.routine_name || "Active Workout"}
      showAdd={false}
      showSettings={false}
      onSettings={undefined}
      onTitleChange={undefined}
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
      <ActiveWorkoutNav onEnd={handleEndWorkout} />

      <div ref={listRef} className="flex flex-col min-h-screen bg-transparent px-0">
        {/* Spacer to clear sticky subheader – removed */}
        <div className="h-0" aria-hidden="true" />
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

      {/* Bottom progress bar */}
      <SwiperProgress completedSets={completedSets} totalSets={totalSets} />

      
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
