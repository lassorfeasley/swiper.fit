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
import ActiveWorkoutWarmup from "./active-workout-warmup/ActiveWorkoutWarmup";
import ActiveWorkoutTraining from "./active-workout-training/ActiveWorkoutTraining";
import ActiveWorkoutCooldown from "./active-workout-cooldown/ActiveWorkoutCooldown";

const DEBUG_LOG = false; // set to true to enable verbose logging

function debug(...args) {
  if (DEBUG_LOG) console.log("[ActiveWorkout]", ...args);
}

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    loading,
    endWorkout: contextEndWorkout,
    workoutProgress,
    setWorkoutProgress,
    saveSet,
    fetchWorkoutSets,
    updateWorkoutProgress,
    updateLastExercise,
  } = useActiveWorkout();

  const [exercises, setExercises] = useState([]);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [completedExercises, setCompletedExercises] = useState(new Set());
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

  // Simplified loading logic - just load exercises from snapshot
  const loadSnapshotExercises = useCallback(async () => {
    if (!activeWorkout) {
      setExercises([]);
      return;
    }

    // Load snapshot of exercises for this workout
    const { data: snapExs, error: snapErr } = await supabase
      .from("workout_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         snapshot_name,
         name_override,
         section_override,
         exercises!workout_exercises_exercise_id_fkey(
           name,
           section
         )`
      )
      .eq("workout_id", activeWorkout.id)
      .order("exercise_order", { ascending: true });

    if (snapErr || !snapExs) {
      console.error("Error fetching workout snapshot exercises:", snapErr);
      setExercises([]);
      return;
    }

    // Load template sets for each exercise
    const { data: tmplExs, error: tmplErr } = await supabase
      .from("routine_exercises")
      .select(
        `exercise_id,
         routine_sets!fk_routine_sets__routine_exercises(
           id,
           set_order,
           reps,
           weight,
           weight_unit,
           set_variant,
           set_type,
           timed_set_duration
         )`
      )
      .eq("routine_id", activeWorkout.programId)
      .order("set_order", { foreignTable: "routine_sets", ascending: true });

    if (tmplErr) console.error("Error fetching template sets:", tmplErr);

    // Load actual saved sets for this workout
    const { data: savedSets, error: savedErr } = await supabase
      .from("sets")
      .select("*")
      .eq("workout_id", activeWorkout.id);

    if (savedErr) console.error("Error fetching saved sets:", savedErr);

    // Group template sets by exercise_id
    const setsMap = {};
    (tmplExs || []).forEach((re) => {
      setsMap[re.exercise_id] = (re.routine_sets || []).map((rs) => ({
        id: null,
        routine_set_id: rs.id,
        reps: rs.reps,
        weight: rs.weight,
        unit: rs.weight_unit,
        set_variant: rs.set_variant,
        set_type: rs.set_type,
        timed_set_duration: rs.timed_set_duration,
      }));
    });

    // Group saved sets by exercise_id
    const savedSetsMap = {};
    (savedSets || []).forEach((set) => {
      if (!savedSetsMap[set.exercise_id]) {
        savedSetsMap[set.exercise_id] = [];
      }
      savedSetsMap[set.exercise_id].push(set);
    });

    // Also include sets from workoutProgress context (for newly added sets)
    Object.entries(workoutProgress).forEach(([exerciseId, sets]) => {
      if (!savedSetsMap[exerciseId]) {
        savedSetsMap[exerciseId] = [];
      }
      sets.forEach((set) => {
        // Only add if not already present (avoid duplicates)
        const exists = savedSetsMap[exerciseId].some(
          (existing) =>
            existing.id === set.id ||
            (existing.routine_set_id &&
              set.routine_set_id &&
              String(existing.routine_set_id) === String(set.routine_set_id))
        );
        if (!exists) {
          savedSetsMap[exerciseId].push(set);
        }
      });
    });

    // Build exercise cards with template sets merged with saved sets
    const cards = snapExs.map((we) => {
      const templateConfigs = setsMap[we.exercise_id] || [];
      const savedSetsForExercise = savedSetsMap[we.exercise_id] || [];

      // Merge template sets with saved sets here, preserving template order
      const mergedSetConfigs = [];

      // Start with template sets in their original order
      templateConfigs.forEach((template) => {
        // Look for a saved set that matches this template
        const savedSet = savedSetsForExercise.find(
          (saved) => saved.routine_set_id === template.routine_set_id
        );

        if (savedSet) {
          // Use saved set data but preserve template order
          mergedSetConfigs.push({
            id: savedSet.id,
            routine_set_id: savedSet.routine_set_id,
            reps: savedSet.reps,
            weight: savedSet.weight,
            unit: savedSet.weight_unit,
            weight_unit: savedSet.weight_unit,
            set_variant: savedSet.set_variant,
            set_type: savedSet.set_type,
            timed_set_duration: savedSet.timed_set_duration,
            status: savedSet.status || "default",
          });
        } else {
          // Use template set
          mergedSetConfigs.push({
            ...template,
            unit: template.unit || "lbs",
            weight_unit: template.unit || "lbs", // Ensure weight_unit is set for SwipeSwitch
          });
        }
      });

      // Add any orphaned saved sets (sets without matching templates) at the end
      savedSetsForExercise.forEach((saved) => {
        const hasTemplateCounterpart = templateConfigs.some(
          (template) => template.routine_set_id === saved.routine_set_id
        );

        if (!hasTemplateCounterpart) {
          mergedSetConfigs.push({
            id: saved.id,
            routine_set_id: saved.routine_set_id,
            reps: saved.reps,
            weight: saved.weight,
            unit: saved.weight_unit,
            weight_unit: saved.weight_unit,
            set_variant: saved.set_variant,
            set_type: saved.set_type,
            timed_set_duration: saved.timed_set_duration,
            status: saved.status || "default",
          });
        }
      });

      // console.log(`[DEBUG] Exercise ${we.exercise_id}: merged ${templateConfigs.length} template sets + ${savedSetsForExercise.length} saved sets = ${mergedSetConfigs.length} total sets`);
      // console.log(`[DEBUG] Template sets:`, templateConfigs);
      // console.log(`[DEBUG] Saved sets:`, savedSetsForExercise);
      // console.log(`[DEBUG] Merged sets:`, mergedSetConfigs);

      const setConfigs = mergedSetConfigs;

      return {
        id: we.id,
        exercise_id: we.exercise_id,
        section: (() => {
          // Prefer section_override if it exists, otherwise use the original exercise section
          if (we.section_override) {
            const override = we.section_override.toLowerCase().trim();
            if (override === "training" || override === "workout")
              return "training";
            if (override === "warmup") return "warmup";
            if (override === "cooldown") return "cooldown";
            return "training";
          }

          const raw = ((we.exercises || {}).section || "").toLowerCase().trim();
          if (raw === "training" || raw === "workout") return "training";
          if (raw === "warmup") return "warmup";
          if (raw === "cooldown") return "cooldown";
          return "training";
        })(),
        name: we.name_override || we.snapshot_name,
        setConfigs: setConfigs,
      };
    });

    setExercises(cards);
  }, [activeWorkout, workoutProgress]);

  useEffect(() => {
    // console.log('[ActiveWorkout] loadSnapshotExercises called, workoutProgress:', workoutProgress);
    loadSnapshotExercises();
  }, [loadSnapshotExercises]);

  // Simple real-time sync for workout changes
  useEffect(() => {
    if (!activeWorkout?.id) return;

    const chan = supabase
      .channel(`workout-${activeWorkout.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "workouts",
          filter: `id=eq.${activeWorkout.id}`,
        },
        (payload) => {
          console.log("[Real-time] Workout change:", payload);

          // Sync focus state when last_workout_exercise_id changes in real-time
          if (
            payload.new &&
            payload.new.last_workout_exercise_id !==
              payload.old?.last_workout_exercise_id
          ) {
            const newWorkoutExerciseId = payload.new.last_workout_exercise_id;
            console.log(
              "[Real-time] Focus changed to workout_exercise_id:",
              newWorkoutExerciseId
            );

            // Convert workout_exercise_id to exercise_id for UI focus
            const targetExercise = exercises.find(
              (ex) => ex.id === newWorkoutExerciseId
            );
            if (targetExercise) {
              const targetExerciseId = targetExercise.exercise_id;

              // Only update focus if this change came from another window (not this one)
              if (targetExerciseId && targetExerciseId !== focusedExerciseId) {
                setFocusedExerciseId(targetExerciseId);

                // Scroll to the focused exercise after a brief delay
                setTimeout(() => {
                  const element = document.getElementById(
                    `exercise-${targetExerciseId}`
                  );
                  if (element) {
                    element.scrollIntoView({
                      behavior: "smooth",
                      block: "center",
                    });
                  }
                }, 300);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      void chan.unsubscribe();
    };
  }, [activeWorkout?.id]);

  const handleSetComplete = async (exerciseId, setConfig) => {
    // Find this exercise's config and current progress
    const ex = exercises.find((e) => e.exercise_id === exerciseId);
    const exerciseName = ex?.name || "Exercise";
    const totalSets = ex?.setConfigs?.length || 0;
    const prevCount = (workoutProgress[exerciseId] || []).length;

    try {
      // Save the set with optimistic updates
      await saveSet(exerciseId, setConfig);
    } catch (error) {
      console.error("Failed to save set:", error);
      // Show user-friendly error message
      toast.error(`Failed to save set. Please try again.`);
    }
  };

  const handleSetDataChange = async (
    exerciseId,
    setIdOrUpdates,
    field,
    value
  ) => {
    toast.info("Set editing feature is under construction");
  };

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

  // Group exercises by section
  const sectionsOrder = ["warmup", "training", "cooldown"];
  const exercisesBySection = sectionsOrder
    .map((section) => {
      const sectionExercises = exercises.filter((ex) => {
        if (section === "training") {
          return ex.section === "training" || ex.section === "workout";
        }
        return ex.section === section;
      });
      return { section, exercises: sectionExercises };
    })
    .filter((group) => group.exercises.length > 0);

  const handleExerciseCompleteNavigate = (exerciseId) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      newSet.add(exerciseId);

      // Auto-end workout if all complete
      if (!workoutAutoEnded) {
        const allDone = exercises.every((ex) => newSet.has(ex.exercise_id));
        if (allDone) {
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

    // Cross-section navigation logic can be handled here if needed
    // For now, each section handles its own navigation internally
  };

  // Compute progress counts for nav
  // Total sets = number of template setConfigs currently in the workout cards
  const totalSets = exercises.reduce(
    (sum, ex) => sum + (ex.setConfigs?.length || 0),
    0
  );

  /*
    Each logged row in workoutProgress represents an instance a user swiped
    a set to complete.  For a “progress” bar we only want to count a template
    set once, no matter how many times a user logs it (e.g. timed stretches).

    Strategy: for every set that came from a routine template we use its
    routine_set_id as the unique key.  For ad-hoc body-weight or added sets
    (no routine_set_id) we fall back to the `id` so they still register once.
  */
  const completedKeys = new Set();
  Object.values(workoutProgress).forEach((list) => {
    list.forEach((row) => {
      if (row.status !== "complete") return;
      const key = row.routine_set_id || row.id;
      if (key) completedKeys.add(String(key));
    });
  });
  const completedSets = completedKeys.size;

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
        {exercisesBySection.length > 0 ? (
          <>
            {/* Warmup Section */}
            {exercisesBySection.find((group) => group.section === "warmup") && (
              <ActiveWorkoutWarmup
                sectionExercises={
                  exercisesBySection.find((group) => group.section === "warmup")
                    .exercises
                }
                onSetComplete={handleSetComplete}
                onSetDataChange={handleSetDataChange}
                onExerciseComplete={handleExerciseCompleteNavigate}
                onUpdateLastExercise={updateLastExercise}
                onRefreshExercises={loadSnapshotExercises}
              />
            )}

            {/* Training Section */}
            {exercisesBySection.find(
              (group) => group.section === "training"
            ) && (
              <ActiveWorkoutTraining
                sectionExercises={
                  exercisesBySection.find(
                    (group) => group.section === "training"
                  ).exercises
                }
                onSetComplete={handleSetComplete}
                onSetDataChange={handleSetDataChange}
                onExerciseComplete={handleExerciseCompleteNavigate}
                onUpdateLastExercise={updateLastExercise}
                onRefreshExercises={loadSnapshotExercises}
              />
            )}

            {/* Cooldown Section */}
            {exercisesBySection.find(
              (group) => group.section === "cooldown"
            ) && (
              <ActiveWorkoutCooldown
                sectionExercises={
                  exercisesBySection.find(
                    (group) => group.section === "cooldown"
                  ).exercises
                }
                onSetComplete={handleSetComplete}
                onSetDataChange={handleSetDataChange}
                onExerciseComplete={handleExerciseCompleteNavigate}
                onUpdateLastExercise={updateLastExercise}
                onRefreshExercises={loadSnapshotExercises}
              />
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p>No exercises found.</p>
          </div>
        )}
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

ActiveWorkout.propTypes = {
  // PropTypes can be re-added if needed
};

export default ActiveWorkout;
