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
import SwiperForm from "@/components/molecules/swiper-form";
import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { toast } from "sonner";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
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
  } = useActiveWorkout();

  const {
    focusedExercise,
    setFocusedExerciseId,
    handleSectionComplete: navigationHandleSectionComplete,
    isWorkoutComplete,
    getProgressStats,
    sectionExercises
  } = useWorkoutNavigation();

  // Remove user activity tracking - simplified approach
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);
  const [isEndConfirmOpen, setEndConfirmOpen] = useState(false);
  const skipAutoRedirectRef = useRef(false);

  // State for settings sheet
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState(
    activeWorkout?.workoutName || ""
  );
  const { isDelegated } = useAccount();
  const { user } = useAuth();
  
  // Sync local name when workoutName changes
  useEffect(() => {
    setNewWorkoutName(activeWorkout?.workoutName || "");
  }, [activeWorkout?.workoutName]);

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
      console.log('[ActiveWorkout] Auto-redirecting to routines');
      navigate("/routines", { replace: true });
    }
  }, [loading, isWorkoutActive, navigate, user?.id]);

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

    // Reduced delay to allow sections to load their exercises
    const timer = setTimeout(() => {
      if (activeWorkout?.lastExerciseId) {
        // No database query needed - exercise_id is already loaded in ActiveWorkoutContext
        console.log('[ActiveWorkout] Timer-based restoration setting focus to:', activeWorkout.lastExerciseId);
        isRestoringFocusRef.current = true;
        setFocusedExerciseId(activeWorkout.lastExerciseId, null);
      } else {
        // Fallback: If no lastExerciseId, focus the first exercise of the first section
        const hasExercises = Object.values(sectionExercises).some(exercises => exercises.length > 0);
        
        if (hasExercises) {
          const sections = ['warmup', 'training', 'cooldown'];
          let firstExercise = null;
          
          for (const section of sections) {
            const exercises = sectionExercises[section] || [];
            if (exercises.length > 0) {
              firstExercise = exercises[0];
              console.log(`[ActiveWorkout] Timer-based restoration defaulting to first exercise of ${section}:`, firstExercise.exercise_id);
              isRestoringFocusRef.current = true;
              setFocusedExerciseId(firstExercise.exercise_id, section);
              break;
            }
          }
        }
      }
      // No else clause needed - all workouts now have lastExerciseId set
    }, 300); // Reduced from 1500ms to 300ms
    
    return () => clearTimeout(timer);
  }, [activeWorkout?.id, setFocusedExerciseId]);

  // Reactive trigger: Restore focus as soon as sections have loaded exercises
  useEffect(() => {
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
      // Check if any sections have loaded exercises
      const hasExercises = Object.values(sectionExercises).some(exercises => exercises.length > 0);
      
      if (hasExercises) {
        // Find the first exercise of the first section with exercises
        const sections = ['warmup', 'training', 'cooldown'];
        let firstExercise = null;
        
        for (const section of sections) {
          const exercises = sectionExercises[section] || [];
          if (exercises.length > 0) {
            firstExercise = exercises[0];
            console.log(`[ActiveWorkout] No exercise focused, defaulting to first exercise of ${section}:`, firstExercise.exercise_id);
            setFocusedExerciseId(firstExercise.exercise_id, section);
            break;
          }
        }
      }
    }
  }, [sectionExercises, focusedExercise, setFocusedExerciseId]);

  const handleEndWorkout = () => {
    setEndConfirmOpen(true);
  };

  const handleConfirmEnd = async () => {
    // Prevent the auto-redirect effect from firing
    skipAutoRedirectRef.current = true;
    try {
      const saved = await contextEndWorkout();
      if (saved && activeWorkout?.id) {
        navigate(`/history/${activeWorkout.id}`);
      } else {
        // No sets saved – redirect back to routines
        navigate("/routines");
      }
    } catch (error) {
      console.error("Error ending workout:", error);
      alert("There was an error ending your workout. Please try again.");
    } finally {
      setEndConfirmOpen(false);
    }
  };

  const handleTitleChange = async (newTitle) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ workout_name: newTitle })
        .eq("id", activeWorkout.id);

      if (error) throw error;
      // Update the active workout context with new name
      // Note: You might need to add a method to update the workout name in the context
    } catch (err) {
      alert("Failed to update workout name: " + err.message);
    }
  };

  const handleDeleteWorkout = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      // End the workout without saving (this will clear the context)
      await contextEndWorkout();
      navigate("/routines");
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
              navigate(`/history/${wid}`);
            } else {
              navigate("/routines");
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
      pageNameEditable={true}
      showBackButton={false}
      title=""
      showAdd={false}
      showSettings={true}
      onSettings={() => setSettingsOpen(true)}
      onTitleChange={handleTitleChange}
      onDelete={handleDeleteWorkout}
      showDeleteOption={true}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="workout"
      enableScrollSnap={true}
      noTopPadding={!isDelegated}
      showSidebar={false}
    >
      <div ref={listRef}>
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
        onConfirm={() => setEndConfirmOpen(false)}
        onCancel={handleConfirmEnd}
        title="End workout?"
        confirmText="Keep working out"
        cancelText="End workout"
        confirmVariant="outline"
        cancelVariant="destructive"
      />

      {/* Persistent bottom nav for active workout */}
      <ActiveWorkoutNav
        completedSets={completedSets}
        totalSets={totalSets}
        onEnd={handleEndWorkout}
        onSettings={() => setSettingsOpen(true)}
      />

      {/* Settings sheet for renaming workout */}
      <SwiperForm
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title="Workout"
        leftAction={() => setSettingsOpen(false)}
        leftText="Cancel"
        rightAction={() => handleTitleChange(newWorkoutName)}
        rightText="Save"
        rightEnabled={
          newWorkoutName.trim() !== (activeWorkout?.workoutName || "").trim()
        }
        padding={0}
        className="settings-drawer"
      >
        <div className="p-4">
          <TextInput
            label="Workout Name"
            value={newWorkoutName}
            onChange={(e) => setNewWorkoutName(e.target.value)}
            placeholder="Enter workout name"
          />
        </div>
      </SwiperForm>
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
