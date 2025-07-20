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
import { useAuth } from "@/contexts/AuthContext";

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
    setWorkoutProgress,
    saveSet,
    fetchWorkoutSets,
    updateWorkoutProgress,
  } = useActiveWorkout();
  

  
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedSection, setSelectedSection] = useState("training");
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
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);
  const [exerciseUpdateType, setExerciseUpdateType] = useState('today');
  const [isEndConfirmOpen, setEndConfirmOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [setUpdateType, setSetUpdateType] = useState('today');
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);

  // Memoize initial values for SetEditForm to prevent unnecessary resets
  const setEditFormInitialValues = React.useMemo(() => {
    if (!editingSet?.setConfig) return {};
    const initialValues = {
      ...editingSet.setConfig,
      unit: editingSet.setConfig.weight_unit || editingSet.setConfig.unit || "lbs",
      set_type: editingSet.setConfig.set_type || "reps",
      timed_set_duration: editingSet.setConfig.timed_set_duration || 30
    };
    console.log('SetEditForm initial values:', initialValues);
    return initialValues;
  }, [
    editingSet?.setConfig?.routine_set_id, 
    editingSet?.setConfig?.weight_unit, 
    editingSet?.setConfig?.unit, 
    editingSet?.setConfig?.weight, 
    editingSet?.setConfig?.reps,
    editingSet?.setConfig?.timed_set_duration,
    editingSet?.setConfig?.set_type,
    editingSet?.setConfig?.set_variant
  ]);

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
  const { user } = useAuth();
  // Sync local name when workoutName changes
  useEffect(() => { setNewWorkoutName(activeWorkout?.workoutName || ""); }, [activeWorkout?.workoutName]);

  // Ref for add exercise form
  const addExerciseFormRef = useRef(null);

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

  // After exercises load, autoscroll to the last exercise or first exercise if no last exercise (once per mount)
  useEffect(() => {
    if (hasAutoScrolledRef.current) return;
    if (!exercises.length) return;
    
    const lastWExId = activeWorkout?.lastExerciseId;
    let targetExercise;
    
    if (lastWExId) {
      // Try to find the last exercise
      targetExercise = exercises.find(ex => ex.id === lastWExId);
    }
    
    // If no last exercise found or no last exercise ID, focus on the first exercise
    if (!targetExercise) {
      targetExercise = exercises[0];
    }
    
    if (targetExercise) {
      const exerciseName = targetExercise.name || 'Unknown';
      setInitialScrollTargetId(targetExercise.exercise_id);
      hasAutoScrolledRef.current = true;
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
        const exists = savedSetsMap[exerciseId].some(existing => 
          existing.id === set.id || 
          (existing.routine_set_id && set.routine_set_id && 
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
          saved => saved.routine_set_id === template.routine_set_id
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
            status: savedSet.status || 'default',
          });
        } else {
          // Use template set
          mergedSetConfigs.push({
            ...template,
            unit: template.unit || 'lbs',
            weight_unit: template.unit || 'lbs', // Ensure weight_unit is set for SwipeSwitch
          });
        }
      });
      
      // Add any orphaned saved sets (sets without matching templates) at the end
      savedSetsForExercise.forEach((saved) => {
        const hasTemplateCounterpart = templateConfigs.some(
          template => template.routine_set_id === saved.routine_set_id
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
            status: saved.status || 'default',
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
            if (override === "training" || override === "workout") return "training";
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
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workouts',
          filter: `id=eq.${activeWorkout.id}`,
        },
        (payload) => {
          console.log('[Real-time] Workout change:', payload);
        }
      )
      .subscribe();
      
    return () => {
      void chan.unsubscribe();
    };
  }, [activeWorkout?.id]);

  const handleSetDataChange = async (exerciseId, setIdOrUpdates, field, value) => {
    toast.info("Set editing feature is under construction");
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
    // This function is no longer needed as we handle routine updates directly in handleSetEditFormSave
    console.log("handleSetProgrammaticUpdate called but not used");
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
    // After collapse animation completes, open new card
    setTimeout(() => {
      setFocusedExerciseId(newId);
    }, collapseDurationMs);
  }, []);

  const handleEditSet = (index, setConfig) => {
    setEditingSet({ exerciseId: editingExercise.exercise_id, setConfig, index, fromEditExercise: true });
    setEditingSetIndex(index);
    setEditSheetOpen(true);
    // Format the initial values properly
    const initialValues = {
      ...setConfig,
      unit: setConfig.weight_unit || setConfig.unit || "lbs",
      set_type: setConfig.set_type || "reps",
      timed_set_duration: setConfig.timed_set_duration || 30
    };
    setCurrentFormValues(initialValues);
  };

  const openSetEdit = (exerciseId, setConfig, index) => {
    setEditingSet({ exerciseId, setConfig, index });
    setEditSheetOpen(true);
    // Format the initial values properly
    const initialValues = {
      ...setConfig,
      unit: setConfig.weight_unit || setConfig.unit || "lbs",
      set_type: setConfig.set_type || "reps",
      timed_set_duration: setConfig.timed_set_duration || 30
    };
    setCurrentFormValues(initialValues);
  };

  const handleSetEditFormSave = async (values) => {
    if (!editingSet) return;
    
    try {
      const { exerciseId, setConfig, index } = editingSet;
      console.log('[handleSetEditFormSave] Starting with:', { exerciseId, setConfig, index, values });
      
      // Declare variables at function level so they're accessible throughout
      let savedSetId = null;
      let isNewSet = false;
      let savedSetData = null;
      
      // Check if this is a "permanent" update (routine template update)
      if (setUpdateType === 'future' && setConfig.routine_set_id) {
        // Update the routine template for future workouts
        const routineSetData = {
          reps: values.reps || 0,
          weight: values.weight || 0,
          weight_unit: values.unit || 'lbs',
          set_type: values.set_type || 'reps',
          set_variant: values.set_variant || '',
          timed_set_duration: values.timed_set_duration || 30,
        };
        
        const { error: routineError } = await supabase
          .from('routine_sets')
          .update(routineSetData)
          .eq('id', setConfig.routine_set_id);
          
        if (routineError) throw routineError;
        
        toast.success("Set updated in routine template");
        
        // Also save to current workout
        const setData = {
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          routine_set_id: setConfig.routine_set_id,
          reps: values.reps || 0,
          weight: values.weight || 0,
          weight_unit: values.unit || 'lbs',
          set_type: values.set_type || 'reps',
          set_variant: values.set_variant || '',
          timed_set_duration: values.timed_set_duration || 30,
          status: 'default'
        };

        // If this set already has an ID, update it; otherwise create new
        if (setConfig.id) {
          console.log('[handleSetEditFormSave] PERMANENT: Updating set with ID:', setConfig.id);
          console.log('[handleSetEditFormSave] PERMANENT: Update data:', setData);
          
          const { data, error } = await supabase
            .from('sets')
            .update(setData)
            .eq('id', setConfig.id)
            .select('*')
            .single();
            
          if (error) {
            console.error('[handleSetEditFormSave] PERMANENT: Update error:', error);
            throw error;
          }
          savedSetId = setConfig.id;
          savedSetData = data;
        } else {
          console.log('[handleSetEditFormSave] PERMANENT: Creating new set');
          console.log('[handleSetEditFormSave] PERMANENT: Insert data:', setData);
          
          const { data, error } = await supabase
            .from('sets')
            .insert(setData)
            .select('*')
            .single();
            
          if (error) {
            console.error('[handleSetEditFormSave] PERMANENT: Insert error:', error);
            throw error;
          }
          savedSetId = data.id;
          savedSetData = data;
          isNewSet = true;
        }
      } else {
        // Just save to current workout (today only)
        const setData = {
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          routine_set_id: setConfig.routine_set_id,
          reps: values.reps || 0,
          weight: values.weight || 0,
          weight_unit: values.unit || 'lbs',
          set_type: values.set_type || 'reps',
          set_variant: values.set_variant || '',
          timed_set_duration: values.timed_set_duration || 30,
          status: setConfig.status || 'default'  // Preserve original status
        };

        // If this set already has an ID, update it; otherwise create new
        if (setConfig.id) {
          console.log('[handleSetEditFormSave] TODAY: Updating set with ID:', setConfig.id);
          console.log('[handleSetEditFormSave] TODAY: Update data:', setData);
          
          const { data, error } = await supabase
            .from('sets')
            .update(setData)
            .eq('id', setConfig.id)
            .select('*')
            .single();
            
          if (error) {
            console.error('[handleSetEditFormSave] TODAY: Update error:', error);
            throw error;
          }
          savedSetId = setConfig.id;
          savedSetData = data;
          toast.success("Set updated successfully");
        } else {
          console.log('[handleSetEditFormSave] TODAY: Creating new set');
          console.log('[handleSetEditFormSave] TODAY: Insert data:', setData);
          
          const { data, error } = await supabase
            .from('sets')
            .insert(setData)
            .select('*')
            .single();
            
          if (error) {
            console.error('[handleSetEditFormSave] TODAY: Insert error:', error);
            throw error;
          }
          savedSetId = data.id;
          savedSetData = data;
          isNewSet = true;
          toast.success("Set saved successfully");
        }
      }

      // Create the updated set config with all necessary fields
      const updatedSetConfig = {
        id: savedSetId,
        routine_set_id: setConfig.routine_set_id,
        reps: savedSetData.reps,
        weight: savedSetData.weight,
        unit: savedSetData.weight_unit,
        weight_unit: savedSetData.weight_unit,
        set_type: savedSetData.set_type,
        set_variant: savedSetData.set_variant,
        timed_set_duration: savedSetData.timed_set_duration,
        status: savedSetData.status || 'complete'
      };

      // Optimistically update local state with the correct data
      setExercises(prev => prev.map(ex => {
        if (ex.exercise_id !== exerciseId) return ex;
        
        const newSetConfigs = [...ex.setConfigs];
        
        if (isNewSet) {
          // For new sets, replace the template set at the same index
          // This prevents duplicates by replacing the template set with the saved version
          if (index >= 0 && index < newSetConfigs.length) {
            newSetConfigs[index] = updatedSetConfig;
          } else {
            // Fallback: find by routine_set_id and replace
            const templateIdx = newSetConfigs.findIndex(s => 
              s.routine_set_id === setConfig.routine_set_id && !s.id
            );
            if (templateIdx !== -1) {
              newSetConfigs[templateIdx] = updatedSetConfig;
            } else {
              // If no template found, add to the end
              newSetConfigs.push(updatedSetConfig);
            }
          }
        } else {
          // For existing sets, update the matching set by ID
          const idx = newSetConfigs.findIndex(s => s.id === savedSetId);
          if (idx !== -1) {
            newSetConfigs[idx] = updatedSetConfig;
          } else {
            // Fallback: if ID not found, try to match by routine_set_id and index
            const fallbackIdx = newSetConfigs.findIndex(s => 
              s.routine_set_id === setConfig.routine_set_id && 
              newSetConfigs.indexOf(s) === index
            );
            if (fallbackIdx !== -1) {
              newSetConfigs[fallbackIdx] = updatedSetConfig;
            }
          }
        }
        
        return { ...ex, setConfigs: newSetConfigs };
      }));
      
      // Update the workout progress context to reflect the changes
      setWorkoutProgress(prev => {
        const newProgress = { ...prev };
        const exerciseProgress = newProgress[exerciseId] || [];
        
        if (isNewSet) {
          // For new sets, add to the context
          newProgress[exerciseId] = [...exerciseProgress, updatedSetConfig];
        } else {
          // For existing sets, update in the context
          const idx = exerciseProgress.findIndex(s => s.id === savedSetId);
          if (idx !== -1) {
            exerciseProgress[idx] = updatedSetConfig;
            newProgress[exerciseId] = exerciseProgress;
          } else {
            // If not found, add it
            newProgress[exerciseId] = [...exerciseProgress, updatedSetConfig];
          }
        }
        
        return newProgress;
      });
      
      setEditSheetOpen(false);
      setEditingSet(null);
      setEditingSetIndex(null);
      setCurrentFormValues({});
      setFormDirty(false);
      
    } catch (error) {
      console.error("Failed to save set:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      toast.error("Failed to save set. Please try again.");
    }
  };

  const handleSetEditFormClose = () => {
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  const handleSetDelete = async () => {
    if (!editingSet?.setConfig?.id) {
      toast.error("Cannot delete unsaved set");
      setEditSheetOpen(false);
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sets')
        .delete()
        .eq('id', editingSet.setConfig.id);
        
      if (error) throw error;
      
      toast.success("Set deleted successfully");
      
      setExercises(prev => prev.map(ex => {
        if (ex.exercise_id !== editingSet.exerciseId) return ex;
        return { ...ex, setConfigs: ex.setConfigs.filter(s => s.id !== editingSet.setConfig.id) };
      }));
      
      setEditSheetOpen(false);
      setEditingSet(null);
      setEditingSetIndex(null);
      
    } catch (error) {
      console.error("Failed to delete set:", error);
      toast.error("Failed to delete set. Please try again.");
    }
  };

  // Handle complex set configuration changes when editing an exercise
  const handleSetConfigChanges = async (exerciseId, newSetConfigs, oldSetConfigs) => {
    try {
      // Create maps for easy lookup
      const oldSetsMap = new Map();
      oldSetConfigs.forEach((set, index) => {
        const key = set.id || set.routine_set_id || `template_${index}`;
        oldSetsMap.set(key, { ...set, originalIndex: index });
      });
      
      const newSetsMap = new Map();
      newSetConfigs.forEach((set, index) => {
        const key = set.id || set.routine_set_id || `new_${index}`;
        newSetsMap.set(key, { ...set, newIndex: index });
      });
      
      // Find sets to update, create, and delete
      const setsToUpdate = [];
      const setsToCreate = [];
      const setsToDelete = [];
      
      // Check for updates and creations
      newSetConfigs.forEach((newSet, index) => {
        const key = newSet.id || newSet.routine_set_id || `new_${index}`;
        const oldSet = oldSetsMap.get(key);
        
        if (oldSet) {
          // Set exists - check if it needs updating
          const hasChanges = JSON.stringify(newSet) !== JSON.stringify(oldSet);
          if (hasChanges) {
            setsToUpdate.push({ id: oldSet.id, data: newSet });
          }
        } else {
          // Create database records for new template sets so they can be tracked
          // This allows them to be updated when completed
          setsToCreate.push(newSet);
        }
      });
      
      // Check for deletions
      oldSetConfigs.forEach((oldSet, index) => {
        const key = oldSet.id || oldSet.routine_set_id || `template_${index}`;
        if (!newSetsMap.has(key)) {
          // Set was removed
          if (oldSet.id) {
            setsToDelete.push(oldSet.id);
          }
        }
      });
      
      // Execute database operations
      const operations = [];
      
      // Update existing sets
      for (const { id, data } of setsToUpdate) {
        if (id) {
          const setData = {
            reps: data.reps || 0,
            weight: data.weight || 0,
            weight_unit: data.unit || data.weight_unit || 'lbs',
            set_type: data.set_type || 'reps',
            set_variant: data.set_variant || '',
            timed_set_duration: data.timed_set_duration || 30,
          };
          operations.push(
            supabase.from('sets').update(setData).eq('id', id)
          );
        }
      }
      
      // Create new sets
      for (const newSet of setsToCreate) {
        const setData = {
          workout_id: activeWorkout.id,
          exercise_id: exerciseId,
          routine_set_id: newSet.routine_set_id,
          reps: newSet.reps || 0,
          weight: newSet.weight || 0,
          weight_unit: newSet.unit || newSet.weight_unit || 'lbs',
          set_type: newSet.set_type || 'reps',
          set_variant: newSet.set_variant || '',
          timed_set_duration: newSet.timed_set_duration || 30,
          status: newSet.status || 'default'
        };
        

        
        operations.push(
          supabase.from('sets').insert(setData).select('*').single()
        );
      }
      
      // Delete removed sets
      for (const setId of setsToDelete) {
        operations.push(
          supabase.from('sets').delete().eq('id', setId)
        );
      }
      
      // Execute all operations
      const results = await Promise.all(operations);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Set operation errors:', errors);
        throw new Error('Some set operations failed');
      }
      
      console.log(`Set changes applied: ${setsToUpdate.length} updated, ${setsToCreate.length} created, ${setsToDelete.length} deleted`);
      console.log('Sets to create:', setsToCreate);
      console.log('Sets to update:', setsToUpdate);
      console.log('Database operation results:', results);
      
    } catch (error) {
      console.error('Failed to handle set config changes:', error);
      throw error;
    }
  };

  const handleAddExerciseToday = async (data) => {
    toast.info("Adding exercises feature is under construction");
    setShowAddExercise(false);
  };

  const handleAddExerciseFuture = async (data) => {
    toast.info("Adding exercises to routine feature is under construction");
    setShowAddExercise(false);
  };

    // ------------------------------------------------------------------
  //  Save exercise edit (today vs future)
  // ------------------------------------------------------------------
  const handleSaveExerciseEdit = async (data, type = "today") => {
    if (!editingExercise) return;
    
    try {
      const { id: workoutExerciseId, exercise_id } = editingExercise;
      const newName = data.name?.trim();
      const newSection = data.section;
      const newSetConfigs = data.setConfigs || [];
      
      if (!newName) {
        toast.error("Exercise name cannot be empty");
        return;
      }
      
      // Check if this is a "permanent" update (routine template update)
      if (type === 'future') {
        // Update the exercise in the routine template
        const { error: exerciseError } = await supabase
          .from("exercises")
          .update({ 
            name: newName,
            section: newSection 
          })
          .eq("id", exercise_id);
          
        if (exerciseError) throw exerciseError;
        
        // Update routine sets for this exercise
        // First, get the routine_exercise_id
        const { data: routineExercise, error: routineExError } = await supabase
          .from("routine_exercises")
          .select("id")
          .eq("routine_id", activeWorkout.programId)
          .eq("exercise_id", exercise_id)
          .single();
          
        if (routineExError) throw routineExError;
        
        if (routineExercise) {
          // Delete existing routine sets
          const { error: deleteError } = await supabase
            .from("routine_sets")
            .delete()
            .eq("routine_exercise_id", routineExercise.id);
            
          if (deleteError) throw deleteError;
          
          // Insert new routine sets
          const routineSetRows = newSetConfigs.map((config, idx) => ({
            routine_exercise_id: routineExercise.id,
            set_order: idx + 1,
            reps: config.reps || 0,
            weight: config.weight || 0,
            weight_unit: config.unit || config.weight_unit || 'lbs',
            set_type: config.set_type || 'reps',
            set_variant: config.set_variant || `Set ${idx + 1}`,
            timed_set_duration: config.timed_set_duration || 30,
          }));
          
          if (routineSetRows.length > 0) {
            const { error: insertError } = await supabase
              .from("routine_sets")
              .insert(routineSetRows);
              
            if (insertError) throw insertError;
          }
        }
        
        toast.success("Exercise updated in routine template");
      }
      
      // Always update the current workout (for both today and future)
      // Prepare update payload for workout_exercises table
      const updatePayload = { name_override: newName };
      
      // Add section_override if section changed
      if (newSection && newSection !== editingExercise.section) {
        updatePayload.section_override = newSection;
      }
      
      // Update the workout_exercises table
      const { error } = await supabase
        .from("workout_exercises")
        .update(updatePayload)
        .eq("id", workoutExerciseId);
        
      if (error) throw error;
      
      // Handle set changes - this is the complex part
      await handleSetConfigChanges(exercise_id, newSetConfigs, editingExercise.setConfigs);
      
      // Optimistically update local state immediately with the new set configurations
      setExercises(prev => prev.map(ex => {
        if (ex.id === workoutExerciseId) {
          return { 
            ...ex, 
            name: newName,
            section: newSection || ex.section,
            setConfigs: newSetConfigs
          };
        }
        return ex;
      }));
      
      // Immediately update workoutProgress context with synthetic "default" status rows for new sets
      // This ensures the UI shows the correct number of sets immediately without waiting for refresh
      setWorkoutProgress(prev => {
        const updated = { ...prev };
        updated[exercise_id] = newSetConfigs.map(cfg => ({
          id: cfg.id ?? null,
          routine_set_id: cfg.routine_set_id ?? null,
          reps: cfg.reps,
          weight: cfg.weight,
          unit: cfg.unit || cfg.weight_unit || 'lbs',
          weight_unit: cfg.unit || cfg.weight_unit || 'lbs',
          set_variant: cfg.set_variant,
          set_type: cfg.set_type,
          timed_set_duration: cfg.timed_set_duration,
          status: 'default', // not yet completed
        }));
        return updated;
      });
      
      // Refresh the workout progress context to include the newly saved sets
      await fetchWorkoutSets();
      
      // Force reload of exercises to get the updated merged data
      await loadSnapshotExercises();
      
      if (type === 'today') {
        toast.success("Exercise updated successfully");
      }
      setEditingExercise(null);
      
    } catch (error) {
      console.error("Failed to update exercise:", error);
      toast.error("Failed to update exercise. Please try again.");
    }
  };

  const handleOpenAddExercise = (section) => {
    setSelectedSection(section);
    setShowAddExercise(true);
    toast.info("Adding exercises feature is under construction - form is read-only");
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
                    setData={workoutProgress[ex.exercise_id] || []}
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
                      setEditingExercise({
                        id: ex.id,
                        exercise_id: ex.exercise_id,
                        name: ex.name,
                        section: ex.section,
                        setConfigs: ex.setConfigs
                      });
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

      <SwiperForm
        open={showAddExercise}
        onOpenChange={setShowAddExercise}
        title="Add Exercise"
        leftAction={() => setShowAddExercise(false)}
        rightAction={() => addExerciseFormRef.current?.requestSubmit?.()}
        rightEnabled={false}
        rightText="Add"
        leftText="Cancel"
        padding={0}
        className="add-exercise-drawer"
      >
        <div className="flex-1 overflow-y-auto">
          <AddNewExerciseForm
            ref={addExerciseFormRef}
            key="add-exercise"
            formPrompt="Add a new exercise"
            onActionIconClick={(data, type) => {
              if (type === "future") handleAddExerciseFuture(data);
              else handleAddExerciseToday(data);
            }}
            initialSets={3}
            initialSection={selectedSection}
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
          <SetEditForm
            key={`edit-${editingSet?.setConfig?.routine_set_id || editingSet?.setConfig?.id}`}
            initialValues={setEditFormInitialValues}
            onValuesChange={setCurrentFormValues}
            onDirtyChange={setFormDirty}
            showSetNameField={true}
            hideActionButtons={true}
            hideInternalHeader={true}
            isChildForm={true}
            isUnscheduled={!!editingSet?.setConfig?.routine_set_id}
            hideToggle={editingSet?.fromEditExercise}
            addType={setUpdateType}
            onAddTypeChange={setSetUpdateType}
            onDelete={handleSetDelete}
          />
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
