import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useNavBarVisibility } from "@/contexts/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import ActiveExerciseCard, { CARD_ANIMATION_DURATION_MS } from "@/components/common/Cards/ActiveExerciseCard";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
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
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const [canAddExercise, setCanAddExercise] = useState(false);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [workoutAutoEnded, setWorkoutAutoEnded] = useState(false);
  const [initialScrollTargetId, setInitialScrollTargetId] = useState(null);
  const [focusedExerciseId, setFocusedExerciseId] = useState(null);
  const [focusedCardHeight, setFocusedCardHeight] = useState(0);
  const [focusedNode, setFocusedNode] = useState(null);
  const focusedCardRef = useCallback(node => {
    if (node !== null) {
      setFocusedNode(node);
    }
  }, []);

  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);
  const [exerciseUpdateType, setExerciseUpdateType] = useState('today');
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
    if (editingExercise) {
      setExerciseUpdateType('today');
    }
  }, [editingExercise]);

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

  // Function to get fresh exercise data directly from database
  const getFreshExerciseData = async (exerciseId) => {
    if (!activeWorkout) return null;
    
    // Fetch the specific exercise data fresh from the database
    const { data: snapEx, error: snapErr } = await supabase
      .from("workout_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         snapshot_name,
         name_override,
         exercises!workout_exercises_exercise_id_fkey(
           name,
           section
         )`
      )
      .eq("workout_id", activeWorkout.id)
      .eq("exercise_id", exerciseId)
      .single();
      
    if (snapErr || !snapEx) {
      console.error("Error fetching fresh exercise data:", snapErr);
      return null;
    }

    // Fetch template sets for this exercise
    const { data: tmplEx, error: tmplErr } = await supabase
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
      .eq("exercise_id", exerciseId)
      .order("set_order", { foreignTable: "routine_sets", ascending: true })
      .single();

    // Fetch actual sets for this exercise in current workout
    const { data: actualSets, error: setsErr } = await supabase
      .from("sets")
      .select("*")
      .eq("workout_id", activeWorkout.id)
      .eq("exercise_id", exerciseId);

    // Process the data same way as loadSnapshotExercises
    const templateConfigs = (tmplEx?.routine_sets || []).map((rs) => ({
      id: null,
      routine_set_id: rs.id,
      reps: rs.reps,
      weight: rs.weight,
      unit: rs.weight_unit,
      set_variant: rs.set_variant,
      set_type: rs.set_type,
      timed_set_duration: rs.timed_set_duration,
    }));

    // Group actual sets by routine_set_id
    const actualSetsMap = {};
    const todayOnlySets = []; // Sets without routine_set_id (just for today)
    (actualSets || []).forEach((set) => {
      if (set.routine_set_id) {
        // Set has a template reference
        actualSetsMap[set.routine_set_id] = {
          ...set,
          unit: set.weight_unit || 'lbs',
          weight_unit: set.weight_unit || 'lbs',
        };
      } else {
        // Set is "just for today" - no template reference
        todayOnlySets.push({
          ...set,
          unit: set.weight_unit || 'lbs',
          weight_unit: set.weight_unit || 'lbs',
        });
      }
    });

    // Merge actual sets into template sets
    const mergedConfigs = templateConfigs.map((tmplCfg) => {
      const actual = actualSetsMap[tmplCfg.routine_set_id];
      return actual
        ? {
            ...tmplCfg,
            ...actual,
            id: actual.id,
            unit: actual.unit,
            weight_unit: actual.weight_unit,
          }
        : tmplCfg;
    });
    
    // Add any "today only" sets at the end
    const allConfigs = [...mergedConfigs, ...todayOnlySets];

    return {
      id: snapEx.id,
      exercise_id: snapEx.exercise_id,
      section: (() => {
        const raw = ((snapEx.exercises || {}).section || "").toLowerCase().trim();
        if (raw === "training" || raw === "workout") return "training";
        if (raw === "warmup") return "warmup";
        if (raw === "cooldown") return "cooldown";
        return "training";
      })(),
      name: snapEx.name_override || snapEx.snapshot_name,
      setConfigs: allConfigs,
    };
  };

  // Extracted loading logic into reusable function to fix set duplication
  const loadSnapshotExercises = useCallback(async () => {
    if (!activeWorkout) {
      setExercises([]);
      return;
    }
    // 1) Load snapshot of exercises for this workout
    const { data: snapExs, error: snapErr } = await supabase
      .from("workout_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         snapshot_name,
         name_override,
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
    // 2) Fetch template sets from routine_exercises → routine_sets, ordered by set_order
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
    // 3) Fetch actual sets for this workout
    const { data: actualSets, error: setsErr } = await supabase
      .from("sets")
      .select("*")
      .eq("workout_id", activeWorkout.id);
    if (setsErr) console.error("Error fetching actual sets:", setsErr);
    
    // 4) Group template sets by exercise_id
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
    
    // 5) Group actual sets by exercise_id and routine_set_id
    const actualSetsMap = {};
    const todayOnlySets = {}; // Sets without routine_set_id (just for today)
    (actualSets || []).forEach((set) => {
      if (!actualSetsMap[set.exercise_id]) actualSetsMap[set.exercise_id] = {};
      if (!todayOnlySets[set.exercise_id]) todayOnlySets[set.exercise_id] = [];
      
      if (set.routine_set_id) {
        // Set has a template reference
        actualSetsMap[set.exercise_id][set.routine_set_id] = {
          ...set,
          unit: set.weight_unit || 'lbs',
          weight_unit: set.weight_unit || 'lbs',
        };
      } else {
        // Set is "just for today" - no template reference
        todayOnlySets[set.exercise_id].push({
          ...set,
          unit: set.weight_unit || 'lbs',
          weight_unit: set.weight_unit || 'lbs',
        });
      }
    });
    
    // 6) Merge actual sets into template sets for each exercise
    const cards = snapExs.map((we) => {
      const templateConfigs = setsMap[we.exercise_id] || [];
      const mergedConfigs = templateConfigs.map((tmplCfg) => {
        const actual = actualSetsMap[we.exercise_id]?.[tmplCfg.routine_set_id];
        const merged = actual
          ? {
              ...tmplCfg,
              ...actual,
              id: actual.id,
              unit: actual.unit,
              weight_unit: actual.weight_unit,
            }
          : tmplCfg;
        
        return merged;
      });
      
      // Add any "today only" sets at the end
      const exerciseTodayOnlySets = todayOnlySets[we.exercise_id] || [];
      const allConfigs = [...mergedConfigs, ...exerciseTodayOnlySets];
      
      return {
        id: we.id,
        exercise_id: we.exercise_id,
        section: (() => {
          const raw = ((we.exercises || {}).section || "").toLowerCase().trim();
          if (raw === "training" || raw === "workout") return "training";
          if (raw === "warmup") return "warmup";
          if (raw === "cooldown") return "cooldown";
          return "training";
        })(),
        name: we.name_override || we.snapshot_name,
        setConfigs: allConfigs,
      };
    });
    
    setExercises(cards);
  }, [activeWorkout]);

  useEffect(() => {
    loadSnapshotExercises();
  }, [loadSnapshotExercises]);



  // Real-time sync for exercise name changes
  useEffect(() => {
    if (!activeWorkout?.id) return;
    // Subscribe to changes in workout_exercises for this workout
    const chan = supabase
      .channel(`public:workout_exercises:workout_id=eq.${activeWorkout.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_exercises',
          filter: `workout_id=eq.${activeWorkout.id}`,
        },
        async (payload) => {
          // Defer state update to avoid React's render phase warning
          setTimeout(() => loadSnapshotExercises(), 0);
        }
      )
      .subscribe();
    return () => {
      void chan.unsubscribe();
    };
  }, [activeWorkout?.id, loadSnapshotExercises]);

  // Real-time sync for set template (routine_sets) changes
  useEffect(() => {
    if (!activeWorkout?.programId) return;
    // Subscribe to changes in routine_sets for this routine
    const chan = supabase
      .channel(`public:routine_sets:routine_id=eq.${activeWorkout.programId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'routine_sets',
          // No direct filter for routine_id, but we reload all sets on any change
        },
        async (payload) => {
          // Defer state update to avoid React's render phase warning
          setTimeout(() => loadSnapshotExercises(), 0);
        }
      )
      .subscribe();
    return () => {
      void chan.unsubscribe();
    };
  }, [activeWorkout?.programId, loadSnapshotExercises]);

  const handleSetDataChange = async (exerciseId, setIdOrUpdates, field, value) => {
    if (Array.isArray(setIdOrUpdates)) {
      // New signature: an array of update objects
      // --------------------------------------------------
      //  Update local exercises array for immediate UI sync
      // --------------------------------------------------
      setExercises((prev) =>
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
        setExercises((prev) =>
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
  }, [updateLastExercise, exercises, workoutProgress]);

  const handleEditSet = (index, setConfig) => {
    setEditingSet({ exerciseId: editingExercise.exercise_id, setConfig, index });
    setEditingSetIndex(index);
    setEditSheetOpen(true);
    setCurrentFormValues(setConfig);
  };

  const openSetEdit = (exerciseId, setConfig, index) => {
    setEditingSet({ exerciseId, setConfig, index });
    setEditSheetOpen(true);
    setCurrentFormValues(setConfig);
  };

  const handleSetEditFormSave = async (values) => {
    if (editingExercise) {
      const newSetConfigs = [...(editingExercise.setConfigs || [])];
      if (editingSetIndex !== null) {
        newSetConfigs[editingSetIndex] = values;
        setEditingExercise({
          ...editingExercise,
          setConfigs: newSetConfigs,
        });
      }
    } else if (editingSet) {
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
        
        setExercises((prev) =>
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
    if (editingExercise) {
      // Deleting from exercise edit form
      const newSetConfigs = [...(editingExercise.setConfigs || [])];
      if (editingSetIndex !== null) {
        newSetConfigs.splice(editingSetIndex, 1);
        setEditingExercise({
          ...editingExercise,
          setConfigs: newSetConfigs,
        });
      }
    } else if (editingSet) {
      // Deleting from active exercise card - this would require more complex logic
      // For now, we'll just close the form as this is a more complex scenario
      console.log('Delete set from active workout not implemented yet');
    }
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleAddExerciseToday = async (data) => {
    try {
      // Ensure an exercise row exists (re-use by name if already present)
      let exerciseId;
      const { data: existing, error: findErr } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", data.name.trim())
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        exerciseId = existing.id;
      } else {
        const { data: newEx, error: insertErr } = await supabase
          .from("exercises")
          .insert({ name: data.name.trim(), section: data.section })
          .select()
          .single();
        if (insertErr) throw insertErr;
        exerciseId = newEx.id;
      }

      // Append to local list only (not routine)
      const newCard = {
        id: `temp-${Date.now()}`,
        exercise_id: exerciseId,
        section: data.section,
        name: data.name.trim(),
        setConfigs: data.setConfigs,
      };
      setExercises((prev) => [...prev, newCard]);
      setShowAddExercise(false);
    } catch (err) {
      console.error("Error adding exercise for today:", err);
      alert(err.message || "Failed to add exercise.");
    }
  };

  const handleAddExerciseFuture = async (data) => {
    try {
      if (!activeWorkout?.programId) {
        alert("No routine associated with this workout – cannot add permanently.");
        return;
      }
      // Step 1: ensure exercise exists
      let exerciseRow;
      const { data: existing, error: findErr } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", data.name.trim())
        .maybeSingle();
      if (findErr) throw findErr;
      if (existing) {
        exerciseRow = existing;
      } else {
        const { data: newEx, error: insertErr } = await supabase
          .from("exercises")
          .insert({ name: data.name.trim(), section: data.section })
          .select()
          .single();
        if (insertErr) throw insertErr;
        exerciseRow = newEx;
      }

      // Insert into program's routine_exercises
      const { count: existingCount, error: countErr } = await supabase
        .from("routine_exercises")
        .select("*", { count: "exact", head: true })
        .eq("routine_id", activeWorkout.programId);
      if (countErr) throw countErr;
      const exerciseOrder = (existingCount || 0) + 1;
      const { data: progEx, error: progExErr } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: activeWorkout.programId,
          exercise_id: exerciseRow.id,
          exercise_order: exerciseOrder,
        })
        .select("id")
        .single();
      if (progExErr) throw progExErr;
      // Insert default sets into program (routine_sets)
      const setRows = data.setConfigs.map((cfg, idx) => ({
        routine_exercise_id: progEx.id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setErr } = await supabase
          .from("routine_sets")
          .insert(setRows);
        if (setErr) throw setErr;
      }

      // Step 2: insert snapshot workout_exercises row
      const { data: snapEx, error: snapErr } = await supabase
        .from("workout_exercises")
        .insert({
          workout_id: activeWorkout.id,
          exercise_id: exerciseRow.id,
          exercise_order: exercises.length + 1,
          snapshot_name: data.name.trim(),
        })
        .select()
        .single();
      if (snapErr) throw snapErr;

      // Step 3: update local state (so card appears immediately)
      const newCard = {
        id: snapEx.id,
        exercise_id: exerciseRow.id,
        section: data.section,
        name: data.name.trim(),
        setConfigs: data.setConfigs,
      };
      setExercises((prev) => [...prev, newCard]);
      setShowAddExercise(false);
    } catch (err) {
      console.error("Error adding exercise permanently:", err);
      alert(err.message || "Failed to add exercise to routine.");
    }
  };

  // ------------------------------------------------------------------
  //  Save exercise edit (today vs future)
  // ------------------------------------------------------------------
  const handleSaveExerciseEdit = async (data, type = "today") => {
    if (!editingExercise) return;

    console.log('[DEBUG] handleSaveExerciseEdit called with:', { data, type, editingExercise });

    try {
      // Persist exercise-level edits: name and section
      const exerciseId = editingExercise.exercise_id;
      if (type === "today") {
        // 1) Update exercise name override
        const { data: updated, error: updateErr } = await supabase
          .from("workout_exercises")
          .update({ name_override: data.name.trim() })
          .eq("id", editingExercise.id)
          .select()
          .single();
        if (updateErr) throw updateErr;
      }
      if (type === "future") {
        // Update both the exercise template (for future workouts) and current workout
        try {
          // 1. Update the exercise template permanently
          await supabase
            .from('exercises')
            .update({ name: data.name.trim(), section: data.section })
            .eq('id', exerciseId);
          
          // 2. Also update the current workout so the change appears immediately
          await supabase
            .from("workout_exercises")
            .update({ name_override: data.name.trim() })
            .eq("id", editingExercise.id);
            
        } catch (err) {
          console.error('Error updating exercise name/section:', err);
          throw err; // Re-throw so the user sees the error
        }
      }

      // Persist set config changes (reps, weight, etc.)
      const originalConfigs = editingExercise.setConfigs || [];
      const updatedConfigs = data.setConfigs || [];

      console.log('[DEBUG] Set configs:', {
        originalCount: originalConfigs.length,
        updatedCount: updatedConfigs.length,
        originalConfigs,
        updatedConfigs
      });

      if (type === "today") {
        console.log('[DEBUG] Processing "today" set changes');
        
        // For "today" updates - we need to handle set count changes properly
        // Strategy: Delete all existing sets for this exercise in current workout, then create fresh ones
        
        // First, delete all existing sets for this exercise in current workout
        const { error: deleteAllError } = await supabase
          .from('sets')
          .delete()
          .eq('workout_id', activeWorkout.id)
          .eq('exercise_id', exerciseId);
          
        if (deleteAllError) {
          console.error('Error deleting all sets for exercise:', deleteAllError);
        } else {
          console.log('[DEBUG] Deleted all existing sets for exercise in current workout');
        }

        // Create new sets based on updated configs
        if (updatedConfigs.length > 0) {
          const setsToInsert = updatedConfigs.map((cfg, idx) => ({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            routine_set_id: cfg.routine_set_id,
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit || 'lbs',
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
            status: 'pending'
          }));

          console.log('[DEBUG] Creating new sets:', setsToInsert);

          const { error: insertError } = await supabase
            .from('sets')
            .insert(setsToInsert);
            
          if (insertError) {
            console.error('Error creating new sets:', insertError);
          } else {
            console.log('[DEBUG] Successfully created new sets');
          }
        }
      }

      if (type === "future") {
        console.log('[DEBUG] Processing "future" set changes (DIFF MODE)');

        // === 1. Map originals & updated ===
        const originalTemplate = (editingExercise.setConfigs || []).filter(c => c.routine_set_id);
        const originalById = Object.fromEntries(originalTemplate.map(c => [c.routine_set_id, c]));
        const originalIds = Object.keys(originalById);
        // updatedConfigs already prepared above
        const updatedById = Object.fromEntries(updatedConfigs.filter(c => c.routine_set_id).map(c => [c.routine_set_id, c]));
        const updatedIds = Object.keys(updatedById);

        // === 2. Determine deletes / updates / inserts ===
        const idsToDelete = originalIds.filter(id => !updatedIds.includes(id));
        const configsToUpdate = updatedConfigs.filter(c => c.routine_set_id && originalIds.includes(c.routine_set_id));
        const configsToInsert = updatedConfigs.filter(c => !c.routine_set_id);

        // Get routine_exercise_id for inserts once
        const { data: rxRow, error: rxErr } = await supabase
          .from('routine_exercises')
          .select('id')
          .eq('routine_id', activeWorkout.programId)
          .eq('exercise_id', exerciseId)
          .single();
        if (rxErr) throw rxErr;
        const routineExerciseId = rxRow.id;

        // === 3. Delete removed template rows & their workout sets ===
        if (idsToDelete.length) {
          await supabase.from('routine_sets').delete().in('id', idsToDelete);
          await supabase.from('sets')
            .delete()
            .eq('workout_id', activeWorkout.id)
            .in('routine_set_id', idsToDelete);
        }

        // === 4. Update existing template rows ===
        for (let i = 0; i < configsToUpdate.length; i++) {
          const cfg = configsToUpdate[i];
          const payload = {
            set_order: i + 1, // will re-order sequentially
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
          };
          await supabase.from('routine_sets').update(payload).eq('id', cfg.routine_set_id);
          // mirror to workout set
          await supabase.from('sets').update({
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
          }).eq('workout_id', activeWorkout.id).eq('routine_set_id', cfg.routine_set_id);
        }

        // === 5. Insert new template rows & matching workout sets ===
        for (let i = 0; i < configsToInsert.length; i++) {
          const cfg = configsToInsert[i];
          const payload = {
            routine_exercise_id: routineExerciseId,
            set_order: configsToUpdate.length + i + 1,
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
          };
          const { data: newSetRow, error: insErr } = await supabase
            .from('routine_sets')
            .insert(payload)
            .select()
            .single();
          if (insErr) throw insErr;

          await supabase.from('sets').insert({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            routine_set_id: newSetRow.id,
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
            status: 'pending'
          });
        }
      }

      // Reload exercises to ensure consistency and prevent set duplication
      await loadSnapshotExercises();

      setEditingExercise(null);
    } catch (err) {
      console.error("Error saving exercise edit:", err);
      alert(err.message || "Failed to save exercise edits.");
    }
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
                    setData={exerciseProgress}
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
                    onEditExercise={async () => {
                      // Get absolutely fresh exercise data from database
                      const freshExercise = await getFreshExerciseData(ex.exercise_id);
                      if (freshExercise) {
                        console.log('[DEBUG] Opening edit for exercise with fresh data:', freshExercise);
                        setEditingExercise(freshExercise);
                      } else {
                        // Fallback to current state
                        const latestExercise = exercises.find(e => e.exercise_id === ex.exercise_id) || ex;
                        console.log('[DEBUG] Opening edit for exercise (fallback):', latestExercise);
                        setEditingExercise(latestExercise);
                      }
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
                  initialSection={"training"}
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

        {/* Exercise edit sheet */}
        {editingExercise && (() => {
          const formRef = React.createRef();
          return (
            <SwiperForm
              open={!!editingExercise}
              onOpenChange={() => setEditingExercise(null)}
              title="Edit"
              leftAction={() => setEditingExercise(null)}
              leftText="Close"
              rightAction={() => formRef.current?.requestSubmit?.()}
              rightText="Save"
              rightEnabled={editingExerciseDirty}
              padding={0}
              className="edit-exercise-drawer"
            >
              <div className="flex-1 overflow-y-auto">
                <AddNewExerciseForm
                  ref={formRef}
                  key={`edit-${editingExercise.id}`}
                  formPrompt="Edit exercise"
                  initialName={editingExercise.name}
                  initialSection={editingExercise.section === 'workout' ? 'training' : editingExercise.section}
                  initialSets={editingExercise.setConfigs?.length}
                  initialSetConfigs={editingExercise.setConfigs}
                  hideActionButtons={true}
                  showAddToProgramToggle={false}
                  onActionIconClick={(data, _type) => handleSaveExerciseEdit(data, exerciseUpdateType)}
                  onDirtyChange={setEditingExerciseDirty}
                  showUpdateTypeToggle={true}
                  updateType={exerciseUpdateType}
                  onUpdateTypeChange={setExerciseUpdateType}
                  onEditSet={handleEditSet}
                />
              </div>
            </SwiperForm>
          );
        })()}

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
        onAdd={() => setShowAddExercise(true)}
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
