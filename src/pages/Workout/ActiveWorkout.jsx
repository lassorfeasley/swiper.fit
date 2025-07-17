import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import ActiveExerciseCard, { CARD_ANIMATION_DURATION_MS } from "@/components/common/Cards/ActiveExerciseCard";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import SetEditForm from "@/components/common/forms/SetEditForm";
import ActiveWorkoutNav from "@/components/molecules/active-workout-nav";
import { toast } from "sonner";
import { TextInput } from "@/components/molecules/text-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { useAccount } from "@/contexts/AccountContext";

const DEBUG_LOG = false; // set to true to enable verbose logging

function debug(...args) { if (DEBUG_LOG) console.log('[ActiveWorkout]', ...args); }

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    loading,
    endWorkout: contextEndWorkout,
    workoutProgress,
    updateWorkoutProgress,
    saveSet,
    updateSet,
    updateLastExercise,
    workoutExercises: exercises, // Use exercises from context
    focusedExerciseId,
    setFocusedExerciseId,
    updateWorkoutExercises,
    loadWorkoutExercises
  } = useActiveWorkout();
  // REMOVED: const [exercises, setExercises] = useState([]); - now from context
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);
  const [initialScrollTargetId, setInitialScrollTargetId] = useState(null);
  // REMOVED: const [focusedExerciseId, setFocusedExerciseId] = useState(null); - now from context
  const [focusedCardHeight, setFocusedCardHeight] = useState(0);
  const [focusedNode, setFocusedNode] = useState(null);
  const focusedCardRef = useCallback(node => {
    if (node !== null) {
      setFocusedNode(node);
    }
  }, []);

  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [isEndConfirmOpen, setEndConfirmOpen] = useState(false);
  const [setUpdateType, setSetUpdateType] = useState('today');
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);

  // Memoize initial values for SetEditForm to prevent unnecessary resets
  const setEditFormInitialValues = React.useMemo(() => {
    if (!editingSet?.setConfig) return {};
    return {
      ...editingSet.setConfig,
      unit: editingSet.setConfig.weight_unit || editingSet.setConfig.unit || "lbs"
    };
  }, [editingSet?.setConfig?.routine_set_id, editingSet?.setConfig?.weight_unit, editingSet?.setConfig?.unit, editingSet?.setConfig?.weight, editingSet?.setConfig?.reps]);

  useEffect(() => {
    if (editingSet) {
      setSetUpdateType('today');
    }
  }, [editingSet]);

  const skipAutoRedirectRef = useRef(false);

  // State for settings sheet
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState(activeWorkout?.workoutName || "");
  const { isDelegated } = useAccount();
  // Sync local name when workoutName changes
  useEffect(() => { setNewWorkoutName(activeWorkout?.workoutName || ""); }, [activeWorkout?.workoutName]);

  useEffect(() => {
    if (focusedNode) {
      const resizeObserver = new ResizeObserver(() => {
        setFocusedCardHeight(focusedNode.offsetHeight);
      });
      resizeObserver.observe(focusedNode);
      return () => resizeObserver.disconnect();
    }
  }, [focusedNode]);

  // List container ref (kept – may be used by the replacement implementation)
  const listRef = useRef(null);

  // === Scroll-snap helpers (new implementation) ===
  const hasAutoScrolledRef = useRef(false);

  // Scroll the card to the top of the viewport
  const scrollCardIntoView = (cardEl, behavior = "smooth") => {
    if (cardEl?.scrollIntoView) {
      cardEl.scrollIntoView({ behavior, block: "start" });
    }
  };

  // Focus whenever the last_exercise_id in workflow context changes
  useEffect(() => {
    const remoteWExId = activeWorkout?.lastExerciseId; // This is workout_exercise_id
    if (remoteWExId) {
      const targetExercise = exercises.find(ex => ex.id === remoteWExId);
      if (targetExercise) {
        setFocusedExerciseId(targetExercise.exercise_id);
      }
    }
  }, [activeWorkout?.lastExerciseId, exercises]);

  // After exercises load, autoscroll only to the card stored as lastExerciseId (once per mount)
  useEffect(() => {
    if (hasAutoScrolledRef.current) return;
    const lastWExId = activeWorkout?.lastExerciseId;
    if (!lastWExId) return;
    if (!exercises.length) return;
    
    const targetExercise = exercises.find(ex => ex.id === lastWExId);
    if (!targetExercise) return;

    const lastExName = targetExercise.name || 'Unknown';
    setInitialScrollTargetId(targetExercise.exercise_id);
    hasAutoScrolledRef.current = true;
  }, [exercises, activeWorkout?.lastExerciseId]);

  // After the section has been updated and component re-rendered, perform the scroll.
  useEffect(() => {
    if (!initialScrollTargetId) return;

    // A small timeout to ensure the DOM is fully painted after section change
    const scrollTimeout = setTimeout(() => {
      const targetEl = document.getElementById(`exercise-${initialScrollTargetId}`);
      if (targetEl) {
        scrollCardIntoView(targetEl, "auto");
        setFocusedExerciseId(initialScrollTargetId);
      }
      // Reset the target so this doesn't run on subsequent section changes
      setInitialScrollTargetId(null);
    }, 150);

    return () => clearTimeout(scrollTimeout);
  }, [initialScrollTargetId]);

  // Scroll any newly focused card 25% down the viewport
  useEffect(() => {
    if (!focusedNode) return;
    
    // A timeout is needed to allow the card's expand animation to complete
    // before we calculate its position and scroll to it.
    const scrollTimeout = setTimeout(() => {
      // Smoothly scroll the focused card into view at 25% down
      scrollCardIntoView(focusedNode, "smooth");
    }, CARD_ANIMATION_DURATION_MS + 50); // Add a 50ms buffer

    return () => clearTimeout(scrollTimeout);
  }, [focusedNode]);

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




  // REMOVED: loadSnapshotExercises function - now handled in ActiveWorkoutContext



  // REMOVED: Real-time subscriptions - now handled in ActiveWorkoutContext

  const handleSetDataChange = async (exerciseId, setIdOrUpdates, field, value) => {
    if (Array.isArray(setIdOrUpdates)) {
      // New signature: an array of update objects
      // --------------------------------------------------
      //  Update local exercises array for immediate UI sync
      // --------------------------------------------------
      updateWorkoutExercises((prev) =>
        prev.map((ex) => {
          if (ex.exercise_id !== exerciseId) return ex;
          const newConfigs = ex.setConfigs.map((cfg) => {
            const upd = setIdOrUpdates.find((u) => {
              // Match by id if both have ids, otherwise match by routine_set_id
              if (u.id && cfg.id) return u.id === cfg.id;
              return String(u.changes.routine_set_id || u.id) === String(cfg.routine_set_id);
            });
            return upd ? { ...cfg, ...upd.changes } : cfg;
          });
          return { ...ex, setConfigs: newConfigs };
        })
      );

      try {
        await updateWorkoutProgress(exerciseId, setIdOrUpdates);
        // Persist each update to the database if the set has an id
        for (const update of setIdOrUpdates) {
          if (
            update.id &&
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
              update.id
            )
          ) {
            // Set exists in database - update it
            await updateSet(update.id, update.changes);
          } else if (update.changes.routine_set_id) {
            // Set doesn't exist in database yet - create it
            const setConfigForSave = {
              reps: update.changes.reps,
              weight: update.changes.weight,
              unit: update.changes.unit || update.changes.weight_unit,
              set_variant: update.changes.set_variant,
              set_type: update.changes.set_type,
              timed_set_duration: update.changes.timed_set_duration,
              routine_set_id: update.changes.routine_set_id,
              status: 'pending' // Mark as pending since it's just a config change, not completion
            };
            await saveSet(exerciseId, setConfigForSave);
          }
        }
      } catch (error) {
        console.error("Failed to update set data:", error);
        toast.error("Failed to save changes. Please try again.");
      }
    } else {
      // Legacy signature: single field update, convert to new format
      const updates = [
        {
          id: setIdOrUpdates,
          changes: { [field]: value },
        },
      ];
      
      try {
        await updateWorkoutProgress(exerciseId, updates);
        if (setIdOrUpdates && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(setIdOrUpdates)) {
          // Set exists in database - update it
          await updateSet(setIdOrUpdates, { [field]: value });
        } else {
          // Set doesn't exist in database yet - find the routine_set_id and create it
          const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
          const setConfig = exercise?.setConfigs?.find(cfg => 
            String(cfg.routine_set_id) === String(setIdOrUpdates) || 
            cfg.id === setIdOrUpdates
          );
          
          if (setConfig?.routine_set_id) {
            const setConfigForSave = {
              reps: setConfig.reps,
              weight: setConfig.weight,
              unit: setConfig.unit,
              set_variant: setConfig.set_variant,
              set_type: setConfig.set_type,
              timed_set_duration: setConfig.timed_set_duration,
              [field]: value, // Apply the specific field change
              routine_set_id: setConfig.routine_set_id,
              status: 'pending'
            };
            await saveSet(exerciseId, setConfigForSave);
          }
        }
        
        // Sync to exercises array as well
        updateWorkoutExercises((prev) =>
          prev.map((ex) => {
            if (ex.exercise_id !== exerciseId) return ex;
            const newConfigs = ex.setConfigs.map((cfg) => {
              // Match by id if available, otherwise by routine_set_id
              if (setIdOrUpdates && cfg.id) return cfg.id === setIdOrUpdates ? { ...cfg, [field]: value } : cfg;
              return String(cfg.routine_set_id) === String(setIdOrUpdates) ? { ...cfg, [field]: value } : cfg;
            });
            return { ...ex, setConfigs: newConfigs };
          })
        );
      } catch (error) {
        console.error("Failed to update set data:", error);
        toast.error("Failed to save changes. Please try again.");
      }
    }
  };

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
      // 1. Update the routine template (for future workouts)
      const { data, error } = await supabase
        .from("routine_sets")
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

      // 2. Also update the current workout instance (so changes show immediately)
      // Find if there's already a set for this routine_set_id in the current workout
      const { data: existingWorkoutSet, error: checkError } = await supabase
        .from('sets')
        .select('id')
        .eq('workout_id', activeWorkout.id)
        .eq('routine_set_id', setId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing workout set:", checkError);
      }

      const setValues = {
        reps: formValues.reps,
        weight: formValues.weight,
        weight_unit: formValues.unit,
        set_variant: formValues.set_variant,
        set_type: formValues.set_type,
        timed_set_duration: formValues.timed_set_duration,
      };

      if (existingWorkoutSet) {
        // Update existing workout set
        const { error: updateError } = await supabase
          .from('sets')
          .update(setValues)
          .eq('id', existingWorkoutSet.id);

        if (updateError) {
          console.error("Error updating existing workout set:", updateError);
        }
      } else {
        // Create new workout set
        const { error: insertError } = await supabase
          .from('sets')
          .insert({
            ...setValues,
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            routine_set_id: setId,
            status: 'pending'
          });

        if (insertError) {
          console.error("Error creating new workout set:", insertError);
        }
      }

      toast.success("Routine updated successfully!");
    } catch (error) {
      console.error("Error updating routine set:", error);
      toast.error("Failed to update routine.");
    }
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

  // Handle opening add exercise page from section plus buttons
  const handleOpenAddExercise = (section) => {
    navigate(`/workout/exercise/add?section=${section}`);
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

      // Find the current section group
      const groupIndex = exercisesBySection.findIndex((group) =>
        group.exercises.some((ex) => ex.exercise_id === exerciseId)
      );
      if (groupIndex !== -1) {
        const group = exercisesBySection[groupIndex].exercises;
        const idx = group.findIndex((ex) => ex.exercise_id === exerciseId);
        let target;

        // 1. Next in same section
        for (let i = idx + 1; i < group.length; i++) {
          if (!newSet.has(group[i].exercise_id)) {
            target = group[i];
            break;
          }
        }
        // 2. Previous in same section
        if (!target) {
          for (let i = idx - 1; i >= 0; i--) {
            if (!newSet.has(group[i].exercise_id)) {
              target = group[i];
              break;
            }
          }
        }
        // 3. First in next section
        if (!target) {
          for (let j = groupIndex + 1; j < exercisesBySection.length; j++) {
            const found = exercisesBySection[j].exercises.find((ex) => !newSet.has(ex.exercise_id));
            if (found) {
              target = found;
              break;
            }
          }
        }
        if (target) {
          changeFocus(target.exercise_id);
          // The scroll is now handled by the useEffect on [focusedNode]
          /*
          setTimeout(() => {
            const el = document.getElementById(`exercise-${target.exercise_id}`);
            if (el) scrollCardIntoView(el);
          }, collapseDurationMs + 50);
          */
        }
      }
      return newSet;
    });
  };

  // Time (ms) to wait for collapse animation before opening another card
  const collapseDurationMs = CARD_ANIMATION_DURATION_MS;
  // Helper to collapse current focused card then open a new one
  const changeFocus = useCallback((newId) => {
    // Collapse any open card
    setFocusedExerciseId(null);
    // After collapse animation completes, open new card and update last exercise if incomplete
    setTimeout(() => {
      setFocusedExerciseId(newId);
      // Check if this exercise still has incomplete sets
      const ex = exercises.find((e) => e.exercise_id === newId);
      const totalSets = ex?.setConfigs?.length || 0;
      const completed = (workoutProgress[newId] || []).length;
      if (completed < totalSets) {
        console.log(`[ActiveWorkout] changeFocus updating lastExercise to ${ex?.name}`);
        updateLastExercise?.(ex.id);
      }
    }, collapseDurationMs);
  }, [setFocusedExerciseId, updateLastExercise, exercises, workoutProgress]);



  const openSetEdit = (exerciseId, setConfig, index) => {
    setEditingSet({ exerciseId, setConfig, index });
    setEditSheetOpen(true);
    setCurrentFormValues(setConfig);
  };

  const handleSetEditFormSave = async (values) => {
    if (editingSet) {
      // Logic for when editing from ActiveExerciseCard
      try {
        // Check if this should be a permanent change (routine template update)
        if (setUpdateType === "future" && editingSet.setConfig.routine_set_id) {
          // Update routine template permanently
          await handleSetProgrammaticUpdate(
            editingSet.exerciseId,
            editingSet.setConfig.routine_set_id,
            values
          );
        } else {
          // Just for today - update only the workout instance
          
          if (editingSet.setConfig.id) {
            // Set exists in database - update it
            const dbValues = {
              reps: values.reps,
              weight: values.weight,
              weight_unit: values.unit,
              set_variant: values.set_variant,
              set_type: values.set_type,
              timed_set_duration: values.timed_set_duration,
            };
            await updateSet(editingSet.setConfig.id, dbValues);
          } else {
            // Set doesn't exist in database yet - create it
            const setConfigForSave = {
              reps: values.reps,
              weight: values.weight,
              unit: values.unit,
              set_variant: values.set_variant,
              set_type: values.set_type,
              timed_set_duration: values.timed_set_duration,
              routine_set_id: editingSet.setConfig.routine_set_id,
              status: 'pending' // Mark as pending since it's just a config change, not completion
            };
            await saveSet(editingSet.exerciseId, setConfigForSave);
          }
        }
        
        // Also update local exercises state to reflect changes in UI
        // Convert form fields (unit) to database fields (weight_unit) for consistency
        const normalizedValues = {
          ...values,
          weight_unit: values.unit, // Map form's unit to database's weight_unit
          unit: values.unit, // Keep unit for backward compatibility
        };
        
        updateWorkoutExercises((prev) =>
          prev.map((ex) => {
            if (ex.exercise_id !== editingSet.exerciseId) return ex;
            const newConfigs = ex.setConfigs.map((cfg) => {
              // Match by routine_set_id to find the correct set
              if (String(cfg.routine_set_id) === String(editingSet.setConfig.routine_set_id)) {
                return { ...cfg, ...normalizedValues };
              }
              return cfg;
            });
            return { ...ex, setConfigs: newConfigs };
          })
        );
      } catch (error) {
        console.error("Failed to update set:", error);
        toast.error("Failed to save changes. Please try again.");
      }
    }
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetEditFormClose = () => {
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetDelete = () => {
    if (editingSet) {
      // Deleting from active exercise card - this would require more complex logic
      // For now, we'll just close the form as this is a more complex scenario
      console.log('Delete set from active workout not implemented yet');
    }
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };





  // Compute progress counts for nav
  // Total sets = number of template setConfigs currently in the workout cards
  const totalSets = exercises.reduce((sum, ex) => sum + (ex.setConfigs?.length || 0), 0);

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
      if (row.status !== 'complete') return;
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
      onAdd={() => navigate('/workout/exercise/add')}
      onSettings={() => setSettingsOpen(true)}
      onAction={() => navigate('/workout/exercise/add')}
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
      <div ref={listRef} style={{ paddingTop: isDelegated ? '88px' : '44px' }}>
        {exercisesBySection.length > 0 ? (
          exercisesBySection.map(({ section, exercises: sectionExercises }, index) => (
            <PageSectionWrapper
              key={section}
              section={section}
              showPlusButton={true}
              onPlus={() => handleOpenAddExercise(section)}
              stickyTopClass="top-11"
              isFirst={index === 0}
            >
              {sectionExercises.map((ex, index) => {
                const exerciseProgress = workoutProgress[ex.exercise_id] || [];
                const focusedIndex = sectionExercises.findIndex(
                  (e) => e.exercise_id === focusedExerciseId
                );
                const isFocused = focusedIndex === index;
                const isExpanded = isFocused || index === sectionExercises.length - 1;

                const STACKING_OFFSET_PX = 64;
                let topOffset = 80 + index * STACKING_OFFSET_PX;

                if (focusedIndex !== -1) {
                  const collapsedHeight = 80; 
                  const extraHeight = Math.max(0, focusedCardHeight - collapsedHeight);
                  if (index > focusedIndex) {
                    topOffset = 80 + focusedIndex * STACKING_OFFSET_PX + focusedCardHeight + (index - focusedIndex - 1) * STACKING_OFFSET_PX;
                  }
                }

                return (
                  <ActiveExerciseCard
                    ref={isFocused ? focusedCardRef : null}
                    key={ex.id}
                    exerciseId={ex.exercise_id}
                    exerciseName={ex.name}
                    initialSetConfigs={ex.setConfigs}
                    setData={[]} // Empty to prevent double-merge since setConfigs already includes completion status
                    onSetComplete={handleSetComplete}
                    onSetDataChange={handleSetDataChange}
                    onExerciseComplete={() =>
                      handleExerciseCompleteNavigate(ex.exercise_id)
                    }
                    onSetPress={openSetEdit}
                    isUnscheduled={!!activeWorkout?.is_unscheduled}
                    onSetProgrammaticUpdate={handleSetProgrammaticUpdate}
                    isFocused={isFocused}
                    isExpanded={isExpanded}
                    onFocus={() => {
                      if (!isFocused) changeFocus(ex.exercise_id);
                    }}
                    onEditExercise={() => {
                      navigate(`/workout/exercise/${ex.exercise_id}/edit`);
                    }}
                    index={index}
                    focusedIndex={focusedIndex}
                    totalCards={sectionExercises.length}
                    topOffset={topOffset}
                  />
                );
              })}
            </PageSectionWrapper>
          ))
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

      <SwiperForm
        open={isEditSheetOpen}
        onOpenChange={setEditSheetOpen}
        title="Edit Set"
        leftAction={handleSetEditFormClose}
        rightAction={() => handleSetEditFormSave(currentFormValues)}
        rightEnabled={formDirty}
        leftText="Cancel"
        rightText="Save"
        padding={0}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <SetEditForm
              key={`edit-${editingSet?.setConfig?.routine_set_id || editingSet?.setConfig?.id}`}
              initialValues={setEditFormInitialValues}
              onValuesChange={setCurrentFormValues}
              onDirtyChange={setFormDirty}
              showSetNameField={true}
              hideActionButtons={true}
              hideInternalHeader={true}
              isUnscheduled={!!editingSet?.setConfig?.routine_set_id}
              addType={setUpdateType}
              onAddTypeChange={setSetUpdateType}
            />
          </div>
          <div className="border-t border-neutral-300">
            <div className="p-4">
              <SwiperButton
                onClick={handleSetDelete}
                variant="destructive"
                className="w-full"
              >
                Delete Set
              </SwiperButton>
            </div>
          </div>
        </div>
      </SwiperForm>

      {/* Persistent bottom nav for active workout */}
      <ActiveWorkoutNav
        completedSets={completedSets}
        totalSets={totalSets}
        onEnd={handleEndWorkout}
        onSettings={() => setSettingsOpen(true)}
        onAdd={() => navigate('/workout/exercise/add')}
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
        rightEnabled={newWorkoutName.trim() !== (activeWorkout?.workoutName || "").trim()}
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
