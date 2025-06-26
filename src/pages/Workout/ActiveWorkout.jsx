import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { CARD_WRAPPER_GAP_PX } from "@/components/common/Cards/Wrappers/CardWrapper";
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

  // Ref to ensure automatic scroll only happens once per mount
  const autoScrolledRef = useRef(false);
  const listRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const TOP_BUFFER_PX = -2; // slight negative offset to tuck card flush with nav

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

  // After exercises are loaded, automatically navigate to the last exercise if applicable (only once)
  useEffect(() => {
    if (autoScrolledRef.current) return; // already done for this mount
    if (!activeWorkout?.lastExerciseId) return; // nothing to scroll to
    if (!exercises.length) return; // exercises not loaded yet

    const targetExercise = exercises.find(
      (ex) => ex.exercise_id === activeWorkout.lastExerciseId
    );
    if (!targetExercise) return;

    // Switch the section nav to the correct section so the card is visible
    setSectionFilter(targetExercise.section);

    // Delay and then use focusCard for consistent positioning logic
    setTimeout(() => {
      focusCard(document.getElementById(`exercise-${targetExercise.exercise_id}`));
    }, 250);

    autoScrolledRef.current = true;
  }, [exercises, activeWorkout?.lastExerciseId]);

  // Snap-to-card logic when user stops scrolling inside workout
  useEffect(() => {
    debug('Registering scroll snap listener');
    const containerEl = getScrollContainer();
    if (!containerEl) return;

    const handleScroll = () => {
      debug('Scroll event detected');
      if (!listRef.current) { debug('listRef missing'); return; }
      const scrollParent = getScrollContainer();
      if (!scrollParent) return;
      const isWindowScroll = scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body;
      const containerTop = isWindowScroll
        ? (listRef.current?.closest("main")?.getBoundingClientRect().top ?? 0)
        : scrollParent.getBoundingClientRect().top;
      const listStyle = window.getComputedStyle(listRef.current);
      // We will align based on the distance between card top and container top.
      // Find the card whose top is closest to container top
      let closestCard = null;
      let minDistance = Infinity;
      listRef.current?.querySelectorAll('[data-exercise-card="true"]').forEach((card) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.top - containerTop);
        if (distance < minDistance) {
          minDistance = distance;
          closestCard = card;
        }
      });

      if (closestCard) {
        const cardRect = closestCard.getBoundingClientRect();
        const listStyleSnap = window.getComputedStyle(listRef.current);
        const paddingSnap = parseInt(listStyleSnap.paddingTop || 0, 10) || 0;
        const topSpaceSnap = paddingSnap + TOP_BUFFER_PX;
        const delta = cardRect.top - (containerTop + topSpaceSnap);
        debug('closestCard', { cardRectTop: cardRect.top, containerTop, delta });
        if (Math.abs(delta) > 1) {
          scrollCardToTop(closestCard);
        }
      }
    };

    // If we're listening on the document's scrolling element, attach to window for compatibility
    const targetForListener = (containerEl === document.scrollingElement || containerEl === document.documentElement || containerEl === document.body)
      ? window
      : containerEl;
    targetForListener.addEventListener("scroll", handleScroll, { passive: true });
    debug('Scroll listener attached to', targetForListener === window ? 'window' : targetForListener);

    return () => {
      targetForListener.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [exercises]);

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

  // Scroll helper that aligns the given card flush to the scroll container's top (plus padding + TOP_BUFFER_PX)
  const scrollCardToTop = (cardEl) => {
    if (!cardEl) return;
    const scrollParent = getScrollContainer();
    const isWindowScroll = scrollParent === document.scrollingElement || scrollParent === document.documentElement || scrollParent === document.body;
    // First, bring the card flush to the very top of the scroll container
    cardEl.scrollIntoView({ block: 'start', behavior: 'smooth' });

    // Determine required offset to place card just below header
    let offset = TOP_BUFFER_PX; // desktop default (negative slight tuck)
    const headerEl = document.querySelector('.page-header-fixed');
    if (isWindowScroll && headerEl) {
      const headerHeight = headerEl.offsetHeight || 0;
      const desiredGap = 20; // distance below header
      offset = headerHeight + desiredGap; // scroll downward
    }

    const target = isWindowScroll ? window : scrollParent;
    try {
      if (offset !== 0) target.scrollBy({ top: offset, behavior: 'smooth' });
    } catch (_) {
      if (offset !== 0) target.scrollBy(0, offset);
    }
  };

  const focusCard = (cardEl) => {
    debug('focusCard invoked', cardEl);
    if (!cardEl) return;
    scrollCardToTop(cardEl);
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
        setTimeout(() => focusCard(document.getElementById(`exercise-${ex.exercise_id}`)), 100);
        return;
      }
    }

    // 2. Look backward in same section for incomplete (nearest previous)
    for (let i = idx - 1; i >= 0; i--) {
      const ex = exercises[i];
      if (ex.section !== currentSection) break; // before section begins
      if (!isExerciseComplete(ex)) {
        setSectionFilter(currentSection);
        setTimeout(() => focusCard(document.getElementById(`exercise-${ex.exercise_id}`)), 100);
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
        // Wait for section nav update then focus
        setTimeout(() => focusCard(document.getElementById(`exercise-${targetEx.exercise_id}`)), 150);
        return;
      }
    }
    // No remaining incomplete exercises
  };

  // Helper to determine the element that actually scrolls (main element in desktop, body/document on some mobile browsers)
  const getScrollContainer = () => {
    const mainEl = listRef.current?.closest("main");
    if (mainEl) {
      const style = window.getComputedStyle(mainEl);
      const overflowY = style.overflowY;
      if (["auto", "scroll", "overlay"].includes(overflowY)) {
        return mainEl;
      }
      if (mainEl.scrollHeight - mainEl.clientHeight > 1) {
        return mainEl;
      }
    }
    // Fallback to the browser's scrolling element (typically <html> or <body>)
    return document.scrollingElement || document.documentElement;
  };

  const safeScrollBy = (scrollTarget, deltaY) => {
    if (!deltaY) return;

    // Window / document scrolling
    const isWindow = scrollTarget === window || scrollTarget === document.scrollingElement || scrollTarget === document.body;

    // Native smooth scrolling when supported (browser & element)
    const canSmoothScroll = () => {
      try {
        scrollTarget.scrollBy({ top: 0, behavior: "instant" });
        return true;
      } catch (e) {
        return false;
      }
    };

    if (canSmoothScroll()) {
      try {
        scrollTarget.scrollBy({ top: deltaY, behavior: "smooth" });
        return;
      } catch (_) {}
    }

    // Fallbacks
    if (isWindow) {
      window.scrollTo(0, window.scrollY + deltaY);
    } else {
      scrollTarget.scrollTop += deltaY;
    }
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
      >
        <div
          ref={listRef}
          className="p-4 md:p-0 card-container flex flex-col gap-5"
        >
          {filteredExercises.map((exercise) => (
            <CardWrapper
              key={exercise.id}
              id={`exercise-${exercise.exercise_id}`}
              data-exercise-card="true"
              onClick={(e) => focusCard(e.currentTarget)}
              gap={0}
              marginTop={0}
              marginBottom={0}
            >
              <ActiveExerciseCard
                exerciseId={exercise.exercise_id}
                exerciseName={exercise.name}
                initialSetConfigs={exercise.setConfigs}
                setData={workoutProgress[exercise.exercise_id] || []}
                onSetComplete={handleSetComplete}
                onSetDataChange={handleSetDataChange}
                onSetProgrammaticUpdate={handleSetProgrammaticUpdate}
                onExerciseComplete={handleExerciseCompleteNavigate}
              />
            </CardWrapper>
          ))}
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
