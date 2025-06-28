import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import DeckWrapper from "@/components/common/Cards/Wrappers/DeckWrapper";
import ActiveExerciseCard from "@/components/common/Cards/ActiveExerciseCard";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import SectionNav from "@/components/molecules/section-nav";

const DEBUG_LOG = false; // set to true to enable verbose logging

function debug(...args) { if (DEBUG_LOG) console.log('[ActiveWorkout]', ...args); }

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    endWorkout: contextEndWorkout,
    workoutProgress,
    updateWorkoutProgress,
    saveSet,
    updateSet,
    updateLastExercise,
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [sectionFilter, setSectionFilter] = useState("warmup");
  const [canAddExercise, setCanAddExercise] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);
  const [initialScrollTargetId, setInitialScrollTargetId] = useState(null);
  const [focusedExerciseId, setFocusedExerciseId] = useState(null);
  const [focusedCardHeight, setFocusedCardHeight] = useState(0);

  const focusedCardRef = useCallback((node) => {
    if (node !== null) {
      const resizeObserver = new ResizeObserver(() => {
        setFocusedCardHeight(node.offsetHeight);
      });
      resizeObserver.observe(node);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // List container ref (kept – may be used by the replacement implementation)
  const listRef = useRef(null);

  // === Scroll-snap helpers (new implementation) ===
  const hasAutoScrolledRef = useRef(false);

  const scrollCardIntoView = (cardEl, behavior = "smooth") => {
    if (!cardEl) return;

    // 1. Get header height from our CSS variable for precise alignment.
    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-height"
      ) || "0",
      10
    );

    // 2. Find the true scroll container (works for both mobile and desktop).
    const mainEl = cardEl.closest("main");
    const rootEl = cardEl.closest("#root");
    let scrollContainer = document.documentElement; // Fallback
    if (rootEl && rootEl.scrollHeight > rootEl.clientHeight) {
      scrollContainer = rootEl;
    }
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      scrollContainer = mainEl; // Override for desktop
    }

    // 3. Get the card's current position relative to the viewport.
    const cardTop = cardEl.getBoundingClientRect().top;

    // 4. Calculate the exact distance to scroll.
    const scrollDistance = cardTop - headerHeight;

    // 5. Scroll the container by that precise amount.
    scrollContainer.scrollBy({
      top: scrollDistance,
      behavior,
    });
  };

  // After exercises load, restore last interacted exercise (once per mount)
  useEffect(() => {
    if (hasAutoScrolledRef.current) return;
    if (!activeWorkout?.lastExerciseId) return;
    if (!exercises.length) return;

    const targetExercise = exercises.find(
      (ex) => ex.exercise_id === activeWorkout.lastExerciseId
    );

    if (targetExercise) {
      setInitialScrollTargetId(targetExercise.exercise_id);
      setSectionFilter(targetExercise.section);
      hasAutoScrolledRef.current = true; // Mark as done so this only runs once
    }
  }, [exercises, activeWorkout?.lastExerciseId]);

  // After the section has been updated and component re-rendered, perform the scroll.
  useEffect(() => {
    if (!initialScrollTargetId) return;

    // A small timeout to ensure the DOM is fully painted after section change
    const scrollTimeout = setTimeout(() => {
      const targetEl = document.getElementById(`exercise-${initialScrollTargetId}`);
      if (targetEl) {
        scrollCardIntoView(targetEl, "auto");
      }
      // Reset the target so this doesn't run on subsequent section changes
      setInitialScrollTargetId(null);
    }, 150);

    return () => clearTimeout(scrollTimeout);
  }, [initialScrollTargetId]);

  useEffect(() => {
    if (!isWorkoutActive) {
      navigate("/workout", { replace: true });
    }
  }, [isWorkoutActive, navigate]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  useEffect(() => {
    if (activeWorkout) {
      supabase
        .from("program_exercises")
        .select(
          `
          *,
          exercises(name, section),
          program_sets(id, reps, weight, weight_unit, set_order, set_variant, set_type, timed_set_duration)
        `
        )
        .eq("program_id", activeWorkout.programId)
        .then(async ({ data: progExs, error }) => {
          if (error || !progExs) {
            setExercises([]);
            return;
          }
          const exerciseIds = progExs.map((pe) => pe.exercise_id);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from("exercises")
            .select("id, name")
            .in("id", exerciseIds);

          if (exercisesError) {
            setExercises([]);
            return;
          }

          const uniqueProgExs = progExs.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          );

          const cards = uniqueProgExs.map((pe) => ({
            id: pe.id,
            exercise_id: pe.exercise_id,
            section: (() => {
              const raw = ((pe.exercises || {}).section || "").toLowerCase();
              return raw === "training" ? "workout" : raw;
            })(),
            name:
              (exercisesData.find((e) => e.id === pe.exercise_id) || {}).name ||
              "Unknown",
            setConfigs: (pe.program_sets || [])
              .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
              .map((set) => ({
                id: set.id,
                reps: set.reps,
                weight: (set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs')) === 'body' ? 0 : set.weight,
                unit: set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs'),
                set_variant: set.set_variant || `Set ${set.set_order}`,
                set_type: set.set_type,
                timed_set_duration: set.timed_set_duration,
              })),
          }));
          setExercises(cards);
        });
    } else {
      setExercises([]);
    }
  }, [activeWorkout]);

  // TODO: re-implement automatic navigation to last interacted exercise

  const handleSetDataChange = (exerciseId, setIdOrUpdates, field, value) => {
    if (Array.isArray(setIdOrUpdates)) {
      // New signature: an array of update objects
      updateWorkoutProgress(exerciseId, setIdOrUpdates);
      // Persist each update to the database if the set has an id
      setIdOrUpdates.forEach((update) => {
        if (
          update.id &&
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            update.id
          )
        ) {
          updateSet(update.id, update.changes);
        }
      });
    } else {
      // Legacy signature: single field update, convert to new format
      const updates = [
        {
          id: setIdOrUpdates,
          changes: { [field]: value },
        },
      ];
      updateWorkoutProgress(exerciseId, updates);
      if (setIdOrUpdates) {
        updateSet(setIdOrUpdates, { [field]: value });
      }
    }
  };

  const handleSetComplete = (exerciseId, setConfig) => {
    // Update last exercise interacted with
    updateLastExercise?.(exerciseId);

    const exerciseName =
      exercises.find((e) => e.exercise_id === exerciseId)?.name || "Exercise";
    // Call saveSet and then log upon completion
    Promise.resolve(saveSet(exerciseId, setConfig)).then(() => {
      console.log(
        `${setConfig.set_variant} of ${exerciseName} logged to database.`
      );
    });
  };

  const handleSetProgrammaticUpdate = async (exerciseId, setId, formValues) => {
    if (!activeWorkout || !activeWorkout.programId) return;

    // Ensure setId is a valid UUID
    if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        setId
      )
    ) {
      console.error("Invalid UUID for setId:", setId);
      return;
    }

    try {
      // Update only columns that exist in program_sets
      const { data, error } = await supabase
        .from("program_sets")
        .update({
          reps: formValues.reps,
          weight: formValues.weight,
          weight_unit: formValues.unit, // use weight_unit, not unit
          set_type: formValues.set_type,
          timed_set_duration: formValues.timed_set_duration,
          set_variant: formValues.set_variant, // set name
        })
        .eq("id", setId); // only use id to identify the row

      if (error) throw error;
    } catch (error) {
      console.error("Error updating program set:", error);
      // Optionally, show an error to the user
    }
  };

  const handleEndWorkout = async () => {
    const workoutId = activeWorkout?.id;
    try {
      if (workoutId) {
        navigate(`/history/${workoutId}`);
      } else {
        navigate("/history");
      }
      await contextEndWorkout();
    } catch (error) {
      console.error("Error ending workout:", error);
      alert("There was an error ending your workout. Please try again.");
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
      navigate("/workout");
    } catch (err) {
      alert("Failed to delete workout: " + err.message);
    } finally {
      setDeleteConfirmOpen(false);
    }
  };

  // Filter exercises based on search
  const filteredExercises = exercises
    .filter((ex) => ex.section === sectionFilter)
    .filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()));

  const handleAddExercise = async (exerciseData, updateType = "today") => {
    try {
      let { data: existing } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", exerciseData.name)
        .maybeSingle();
      let exercise_id = existing?.id;
      if (!exercise_id) {
        const { data: newEx, error: insertError } = await supabase
          .from("exercises")
          .insert([{ name: exerciseData.name, section: exerciseData.section }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }

      let progEx;
      let progExError;
      // Attempt insert with section attribute first
      ({ data: progEx, error: progExError } = await supabase
        .from("program_exercises")
        .insert({
          program_id: activeWorkout.programId,
          exercise_id,
          exercise_order: exercises.length + 1,
        })
        .select("id")
        .single());

      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: `Set ${idx + 1}`,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("program_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to save set details: " + setError.message);
      }

      setShowAddExercise(false);

      // Refresh exercises to show the new one
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleAddExerciseToday = (exerciseData) => {
    handleAddExercise(exerciseData, "today");
  };

  const handleAddExerciseFuture = (exerciseData) => {
    handleAddExercise(exerciseData, "future");
  };

  const handleCancelAddExercise = () => {
    setShowAddExercise(false);
  };

  const refreshExercises = async () => {
    if (!activeWorkout) return;

    const { data: progExs, error } = await supabase
      .from("program_exercises")
      .select(
        `
        *,
        exercises(name, section),
        program_sets(id, reps, weight, weight_unit, set_order, set_variant, set_type, timed_set_duration)
      `
      )
      .eq("program_id", activeWorkout.programId);

    if (error || !progExs) {
      setExercises([]);
      return;
    }

    const exerciseIds = progExs.map((pe) => pe.exercise_id);
    const { data: exercisesData, error: exercisesError } = await supabase
      .from("exercises")
      .select("id, name")
      .in("id", exerciseIds);

    if (exercisesError) {
      setExercises([]);
      return;
    }

    const uniqueProgExs = progExs.filter(
      (v, i, a) => a.findIndex((t) => t.id === v.id) === i
    );

    const cards = uniqueProgExs.map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      section: (() => {
        const raw = ((pe.exercises || {}).section || "").toLowerCase();
        return raw === "training" ? "workout" : raw;
      })(),
      name:
        (exercisesData.find((e) => e.id === pe.exercise_id) || {}).name ||
        "Unknown",
      setConfigs: (pe.program_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => ({
          id: set.id,
          reps: set.reps,
          weight: (set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs')) === 'body' ? 0 : set.weight,
          unit: set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs'),
          set_variant: set.set_variant || `Set ${set.set_order}`,
          set_type: set.set_type,
          timed_set_duration: set.timed_set_duration,
        })),
    }));
    setExercises(cards);
  };

  const sectionsOrder = ["warmup", "workout", "cooldown"];

  const handleExerciseCompleteNavigate = (exerciseId) => {
    // update completed set
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      newSet.add(exerciseId);

      // Auto-end workout check
      if (!workoutAutoEnded) {
        const allIds = exercises.map((e) => e.exercise_id);
        const allDone = allIds.every((id) => newSet.has(id));
        if (allDone) {
          setWorkoutAutoEnded(true);
          (async () => {
            const workoutId = activeWorkout?.id;
            if (workoutId) {
              navigate(`/history/${workoutId}`);
            } else {
              navigate("/history");
            }
            await contextEndWorkout();
          })();
        }
      }

      return newSet;
    });

    // Determine current exercise and section
    const idx = exercises.findIndex((e) => e.exercise_id === exerciseId);
    if (idx === -1) return;
    const currentSection = exercises[idx].section;

    // Helper to check if exercise complete
    const isExerciseComplete = (ex) => completedExercises.has(ex.exercise_id) || ex.exercise_id === exerciseId;

    // 1. Look forward in same section for incomplete
    for (let i = idx + 1; i < exercises.length; i++) {
      const ex = exercises[i];
      if (ex.section !== currentSection) break; // beyond current section
      if (!isExerciseComplete(ex)) {
        setSectionFilter(currentSection);
        // TODO: scroll to upcoming incomplete exercise
        return;
      }
    }

    // 2. Look backward in same section for incomplete (nearest previous)
    for (let i = idx - 1; i >= 0; i--) {
      const ex = exercises[i];
      if (ex.section !== currentSection) break; // before section begins
      if (!isExerciseComplete(ex)) {
        setSectionFilter(currentSection);
        // TODO: scroll to previous incomplete exercise
        return;
      }
    }

    // 3. All exercises in current section complete: move to next section with incomplete exercises
    const currentSectionIndex = sectionsOrder.indexOf(currentSection);
    for (let j = currentSectionIndex + 1; j < sectionsOrder.length; j++) {
      const sectionName = sectionsOrder[j];
      const targetEx = exercises.find((ex) => ex.section === sectionName && !isExerciseComplete(ex));
      if (targetEx) {
        setSectionFilter(sectionName);
        // TODO: scroll to first incomplete exercise in next section
        return;
      }
    }
    // No remaining incomplete exercises
  };

  return (
    <>
      <AppLayout
        showAddButton={true}
        addButtonText="Add exercise"
        pageNameEditable={true}
        showBackButton={false}
        appHeaderTitle={activeWorkout?.name || "Workout"}
        onAction={() => setShowAddExercise(true)}
        onTitleChange={handleTitleChange}
        onDelete={handleDeleteWorkout}
        showDeleteOption={true}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="workout"
        showSectionNav={true}
        sectionNavValue={sectionFilter}
        onSectionNavChange={setSectionFilter}
        enableScrollSnap={true}
      >
        <div ref={listRef}>
          {filteredExercises.length > 0 ? (
            <DeckWrapper>
              {filteredExercises.map((ex, index) => {
                const exerciseProgress = workoutProgress[ex.exercise_id] || {
                  sets: [],
                };
                const focusedIndex = filteredExercises.findIndex(
                  (e) => e.exercise_id === focusedExerciseId
                );
                const isFocused = focusedIndex === index;

                const collapsedHeight = 64;
                let topOffset = 80;
                if (focusedIndex !== -1 && index > focusedIndex) {
                  topOffset = 80 + focusedCardHeight - collapsedHeight;
                }

                return (
                  <ActiveExerciseCard
                    ref={isFocused ? focusedCardRef : null}
                    key={ex.id}
                    exerciseId={ex.exercise_id}
                    exerciseName={ex.name}
                    initialSetConfigs={ex.setConfigs}
                    setData={exerciseProgress.sets}
                    onSetComplete={handleSetComplete}
                    onSetDataChange={handleSetDataChange}
                    onExerciseComplete={() =>
                      handleExerciseCompleteNavigate(ex.exercise_id)
                    }
                    isUnscheduled={!!activeWorkout?.is_unscheduled}
                    onSetProgrammaticUpdate={handleSetProgrammaticUpdate}
                    isFocused={isFocused}
                    onFocus={() => {
                      setFocusedExerciseId(ex.exercise_id);
                      updateLastExercise?.(ex.exercise_id);
                    }}
                    index={index}
                    focusedIndex={focusedIndex}
                    totalCards={filteredExercises.length}
                    topOffset={topOffset}
                  />
                );
              })}
            </DeckWrapper>
          ) : (
            <div className="text-center py-10">
              <p>No exercises found.</p>
            </div>
          )}
        </div>

        {showAddExercise &&
          (() => {
            const formRef = React.createRef();

            return (
              <SwiperForm
                open={showAddExercise}
                onOpenChange={() => setShowAddExercise(false)}
                title="Exercise"
                leftAction={() => setShowAddExercise(false)}
                rightAction={() => formRef.current?.requestSubmit?.()}
                rightEnabled={canAddExercise}
                rightText="Add"
                leftText="Cancel"
                padding={0}
                className="add-exercise-drawer"
              >
                <div className="flex-1 overflow-y-auto">
                  <AddNewExerciseForm
                    ref={formRef}
                    key="add-exercise"
                    formPrompt="Add a new exercise"
                    onActionIconClick={(data, type) => {
                      if (type === "future") handleAddExerciseFuture(data);
                      else handleAddExerciseToday(data);
                    }}
                    initialSets={3}
                    initialSection={(sectionFilter === "workout" ? "training" : sectionFilter)}
                    initialSetConfigs={Array.from({ length: 3 }, () => ({
                      reps: 10,
                      weight: 25,
                      unit: "lbs",
                    }))}
                    hideActionButtons={true}
                    onDirtyChange={(ready) => setCanAddExercise(ready)}
                  />
                </div>
              </SwiperForm>
            );
          })()}
      </AppLayout>
      <SwiperAlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Workout?"
        description="Are you sure you want to delete this workout? This will end the workout without saving any progress."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

ActiveWorkout.propTypes = {
  // PropTypes can be re-added if needed
};

export default ActiveWorkout;
