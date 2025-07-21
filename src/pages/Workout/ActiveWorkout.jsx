import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { toast } from "sonner";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { useAccount } from "@/contexts/AccountContext";
import { useAuth } from "@/contexts/AuthContext";
import ActiveWorkoutSection from "./ActiveWorkoutSection";
import { WorkoutNavigationProvider, useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";

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
  } = useActiveWorkout();



  const {
    handleSectionComplete: navigationHandleSectionComplete,
    isWorkoutComplete,
    getProgressStats,
    setFocusedExerciseId: originalSetFocusedExerciseId,
    focusFirstExercise
  } = useWorkoutNavigation();

  // Wrapper to track user focus activity
  const setFocusedExerciseId = useCallback((exerciseId, section) => {
    userActiveFocusRef.current = true;
    originalSetFocusedExerciseId(exerciseId, section);
    
    // Reset the flag after a short delay to allow for sync focus
    setTimeout(() => {
      userActiveFocusRef.current = false;
    }, 2000);
  }, [originalSetFocusedExerciseId]);

  // Handle user actively focusing on exercises
  const handleUserFocus = useCallback(() => {
    userActiveFocusRef.current = true;
    
    // Reset the flag after a short delay
    setTimeout(() => {
      userActiveFocusRef.current = false;
    }, 2000);
  }, []);

  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [completedSections, setCompletedSections] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);

  const [isEndConfirmOpen, setEndConfirmOpen] = useState(false);

  const skipAutoRedirectRef = useRef(false);
  const userActiveFocusRef = useRef(false); // Track if user is actively focusing

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
      // Skip auto-redirect if user just ended workout
      if (skipAutoRedirectRef.current) {
        skipAutoRedirectRef.current = false;
        return;
      }
      navigate("/routines", { replace: true });
    }
  }, [loading, isWorkoutActive, navigate]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  // Auto-scroll to last exercise on page load/refresh or when synced from other clients
  useEffect(() => {
    if (!activeWorkout?.lastExerciseId) return;

    console.log('[ActiveWorkout] Attempting to scroll to last exercise:', activeWorkout.lastExerciseId);

    // Function to find the exercise_id from workout_exercise_id
    const findExerciseIdFromWorkoutExerciseId = async (workoutExerciseId) => {
      try {
        const { data, error } = await supabase
          .from('workout_exercises')
          .select('exercise_id, section_override, snapshot_name')
          .eq('id', workoutExerciseId)
          .single();
        
        if (error) {
          console.error('[ActiveWorkout] Error finding exercise_id:', error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error('[ActiveWorkout] Exception finding exercise_id:', err);
        return null;
      }
    };

    // Function to attempt scrolling
    const attemptScroll = async () => {
      // First, try to find the exercise_id from the workout_exercise_id
      const { exercise_id, section_override, snapshot_name } = await findExerciseIdFromWorkoutExerciseId(activeWorkout.lastExerciseId);
      
      if (!exercise_id) {
        console.log('[ActiveWorkout] Could not find exercise_id for workout_exercise_id:', activeWorkout.lastExerciseId);
        return false;
      }

      console.log('[ActiveWorkout] Found exercise:', snapshot_name || exercise_id, 'for workout_exercise_id:', activeWorkout.lastExerciseId);
      
      const lastExerciseElement = document.getElementById(`exercise-${exercise_id}`);
      
      if (lastExerciseElement) {
        console.log('[ActiveWorkout] Found exercise element, scrolling to it');
        lastExerciseElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Set focus on this exercise immediately
        console.log('[ActiveWorkout] Setting focus on exercise:', snapshot_name || exercise_id);
        if (setFocusedExerciseId) {
          setFocusedExerciseId(exercise_id, section_override);
        }
        
        return true;
      } else {
        console.log('[ActiveWorkout] Exercise element not found, will retry');
        // Let's see what exercise elements exist
        const allExerciseElements = document.querySelectorAll('[id^="exercise-"]');
        console.log('[ActiveWorkout] Available exercise elements:', Array.from(allExerciseElements).map(el => el.id));
        return false;
      }
    };

    // Try immediately
    attemptScroll().then((success) => {
      if (!success) {
        // If not found, try with increasing delays
        const delays = [500, 1000, 2000, 3000];
        
        delays.forEach((delay, index) => {
          setTimeout(() => {
            attemptScroll().then((retrySuccess) => {
              if (!retrySuccess && index === delays.length - 1) {
                console.log('[ActiveWorkout] Failed to find exercise element after all attempts');
              }
            });
          }, delay);
        });
      }
    });
  }, [activeWorkout?.lastExerciseId]);

  // Auto-focus on synced last exercise when it changes from other clients
  useEffect(() => {
    if (!activeWorkout?.lastExerciseId) return;

    // Don't auto-focus if user is actively focusing on exercises
    if (userActiveFocusRef.current) {
      console.log('[ActiveWorkout] Skipping sync focus - user is actively focusing');
      return;
    }

    console.log('[ActiveWorkout] Last exercise synced from other client, focusing on:', activeWorkout.lastExerciseId);
    
    // Add a small delay to allow sections to load their exercises
    const timer = setTimeout(() => {
      // Find the exercise_id from workout_exercise_id
      const findExerciseIdFromWorkoutExerciseId = async (workoutExerciseId) => {
        try {
          const { data, error } = await supabase
            .from('workout_exercises')
            .select('exercise_id, section_override, snapshot_name')
            .eq('id', workoutExerciseId)
            .single();
          
          if (error) {
            console.error('[ActiveWorkout] Error finding exercise_id:', error);
            return null;
          }
          
          return data;
        } catch (err) {
          console.error('[ActiveWorkout] Exception finding exercise_id:', err);
          return null;
        }
      };

      // Set focus on the synced exercise
      findExerciseIdFromWorkoutExerciseId(activeWorkout.lastExerciseId).then(({ exercise_id, section_override, snapshot_name }) => {
        if (exercise_id && setFocusedExerciseId) {
          console.log('[ActiveWorkout] Setting focus on synced exercise:', snapshot_name || exercise_id);
          setFocusedExerciseId(exercise_id, section_override);
        }
      });
    }, 500); // Shorter delay for sync updates
    
    return () => clearTimeout(timer);
  }, [activeWorkout?.lastExerciseId, setFocusedExerciseId]);

  // Auto-focus on first exercise when starting a new workout
  useEffect(() => {
    // Only trigger for new workouts (no lastExerciseId) and when we have an active workout
    if (activeWorkout?.id && !activeWorkout?.lastExerciseId) {
      console.log('[ActiveWorkout] New workout detected, focusing on first exercise');
      
      // Add a small delay to allow sections to load their exercises
      const timer = setTimeout(() => {
        focusFirstExercise();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [activeWorkout?.id, activeWorkout?.lastExerciseId, focusFirstExercise]);

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
      showAddButton={true}
      addButtonText="Add exercise"
      pageNameEditable={true}
      showBackButton={false}
      title=""
      showAdd={true}
      showSettings={true}
      onAdd={() => setShowAddExercise(true)}
      onSettings={() => setSettingsOpen(true)}
      onAction={() => setShowAddExercise(true)}
      onTitleChange={handleTitleChange}
      onDelete={handleDeleteWorkout}
      showDeleteOption={true}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="workout"
      enableScrollSnap={true}
      noTopPadding={true}
      showSidebar={false}
    >
      <div ref={listRef} style={{ paddingTop: isDelegated ? "88px" : "44px" }}>
        {/* Warmup Section */}
        <ActiveWorkoutSection
          section="warmup"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
          onUserFocus={handleUserFocus}
        />

        {/* Training Section */}
        <ActiveWorkoutSection
          section="training"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
          onUserFocus={handleUserFocus}
        />

        {/* Cooldown Section */}
        <ActiveWorkoutSection
          section="cooldown"
          onSectionComplete={handleSectionComplete}
          onUpdateLastExercise={updateLastExercise}
          onUserFocus={handleUserFocus}
        />
      </div>

      <SwiperAlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Workout?"
        description="Are you sure you want to delete this workout? This will end the workout without saving any progress."
        confirmText="Delete"
        cancelText="Cancel"
      />

      <SwiperAlertDialog
        open={isEndConfirmOpen}
        onOpenChange={setEndConfirmOpen}
        onConfirm={handleConfirmEnd}
        title="End Workout?"
        description="Are you sure you want to end this workout? Your progress will be saved."
        confirmText="End Workout"
        cancelText="Cancel"
      />

      {/* Persistent bottom nav for active workout */}
      <ActiveWorkoutNav
        completedSets={completedSets}
        totalSets={totalSets}
        onEnd={handleEndWorkout}
        onSettings={() => setSettingsOpen(true)}
        onAdd={() => {
          // Add exercise functionality is now handled by individual sections
          // This could open a section selector or default to training
          console.log("Add exercise button clicked - handled by sections");
        }}
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
