import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import SwiperForm from "@/components/molecules/swiper-form";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { toast } from "sonner";

const EditExercise = () => {
  const navigate = useNavigate();
  const { exerciseId } = useParams();
  const { activeWorkout, updateWorkoutExercises, loadWorkoutExercises, loading } = useActiveWorkout();
  
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);
  const [exerciseUpdateType, setExerciseUpdateType] = useState('today');
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [editingSetIndex, setEditingSetIndex] = useState(null);
  const [setUpdateType, setSetUpdateType] = useState('today');
  const [currentFormValues, setCurrentFormValues] = useState({});
  const [formDirty, setFormDirty] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const formRef = useRef();

  // Redirect if no active workout after loading completes
  useEffect(() => {
    if (!loading && !activeWorkout) {
      const timer = setTimeout(() => {
        navigate('/routines');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, activeWorkout, navigate]);

  // Load exercise data when component mounts
  useEffect(() => {
    if (activeWorkout && exerciseId) {
      getFreshExerciseData(exerciseId);
    }
  }, [activeWorkout, exerciseId]);

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

  // Function to get fresh exercise data directly from database
  const getFreshExerciseData = async (exerciseId) => {
    if (!activeWorkout) return null;
    
    setPageLoading(true);
    
    try {
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
      (actualSets || []).forEach((s) => {
        if (!actualSetsMap[s.routine_set_id]) {
          actualSetsMap[s.routine_set_id] = [];
        }
        actualSetsMap[s.routine_set_id].push(s);
      });

      // Merge template with actual sets
      const allConfigs = templateConfigs.map((tmplCfg) => {
        const actual = actualSetsMap[tmplCfg.routine_set_id]?.[0]; // Take first match
        return actual
          ? {
              ...tmplCfg,
              ...actual,
              id: actual.id,
              unit: actual.weight_unit || tmplCfg.unit,
              weight_unit: actual.weight_unit || tmplCfg.unit,
            }
          : tmplCfg;
      });

      // Add any "today only" sets (no routine_set_id)
      const todayOnlySets = (actualSets || []).filter((s) => !s.routine_set_id);
      todayOnlySets.forEach((s) => {
        allConfigs.push({
          id: s.id,
          routine_set_id: null,
          reps: s.reps,
          weight: s.weight,
          unit: s.weight_unit,
          weight_unit: s.weight_unit,
          set_variant: s.set_variant,
          set_type: s.set_type,
          timed_set_duration: s.timed_set_duration,
          status: s.status,
        });
      });

      const freshExercise = {
        id: snapEx.id,
        exercise_id: snapEx.exercise_id,
        name: snapEx.name_override || snapEx.exercises?.name || "Exercise",
        section: snapEx.exercises?.section || "training",
        setConfigs: allConfigs,
      };

      setEditingExercise(freshExercise);
      setPageLoading(false);
      return freshExercise;
    } catch (error) {
      console.error("Error in getFreshExerciseData:", error);
      setPageLoading(false);
      return null;
    }
  };

  // Memoize initial values for SetEditForm to prevent unnecessary resets
  const setEditFormInitialValues = React.useMemo(() => {
    if (!editingSet?.setConfig) return {};
    return {
      ...editingSet.setConfig,
      unit: editingSet.setConfig.weight_unit || editingSet.setConfig.unit || "lbs"
    };
  }, [editingSet?.setConfig?.routine_set_id, editingSet?.setConfig?.weight_unit, editingSet?.setConfig?.unit, editingSet?.setConfig?.weight, editingSet?.setConfig?.reps]);

  const handleCancel = () => {
    navigate('/workout/active');
  };

  const handleFormSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleEditSet = (index, setConfig) => {
    setEditingSet({ exerciseId: editingExercise.exercise_id, setConfig, index });
    setEditingSetIndex(index);
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
    }
    setEditSheetOpen(false);
    setEditingSet(null);
    setEditingSetIndex(null);
  };

  // Save exercise edit (today vs future)
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
          console.log('[DEBUG] Creating new sets for updated configs');
          const setsToCreate = updatedConfigs.map((cfg, index) => ({
            workout_id: activeWorkout.id,
            exercise_id: exerciseId,
            routine_set_id: cfg.routine_set_id || null,
            reps: cfg.reps,
            weight: cfg.weight,
            weight_unit: cfg.unit,
            set_variant: cfg.set_variant,
            set_type: cfg.set_type,
            timed_set_duration: cfg.timed_set_duration,
            status: 'pending'
          }));

          const { data: newSets, error: createError } = await supabase
            .from('sets')
            .insert(setsToCreate)
            .select();

          if (createError) {
            console.error('Error creating new sets:', createError);
            throw createError;
          } else {
            console.log('[DEBUG] Successfully created new sets:', newSets);
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
        for (const cfg of configsToUpdate) {
          await supabase.from('routine_sets')
            .update({
              reps: cfg.reps,
              weight: cfg.weight,
              weight_unit: cfg.unit,
              set_variant: cfg.set_variant,
              set_type: cfg.set_type,
              timed_set_duration: cfg.timed_set_duration,
            })
            .eq('id', cfg.routine_set_id);

          // Also update corresponding workout set if it exists
          await supabase.from('sets')
            .update({
              reps: cfg.reps,
              weight: cfg.weight,
              weight_unit: cfg.unit,
              set_variant: cfg.set_variant,
              set_type: cfg.set_type,
              timed_set_duration: cfg.timed_set_duration,
            })
            .eq('workout_id', activeWorkout.id)
            .eq('routine_set_id', cfg.routine_set_id);
        }

        // === 5. Insert new template rows ===
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
      await loadWorkoutExercises();

      // Navigate back to active workout
      navigate('/workout/active');
    } catch (err) {
      console.error("Error saving exercise edit:", err);
      toast.error(err.message || "Failed to save exercise edits.");
    }
  };

  if (loading || pageLoading) {
    return (
      <div className="text-center py-10">
        <p>Loading...</p>
      </div>
    );
  }

  if (!activeWorkout) {
    return (
      <div className="text-center py-10">
        <p>No active workout found. Redirecting...</p>
      </div>
    );
  }

  if (!editingExercise) {
    return (
      <div className="text-center py-10">
        <p>Exercise not found. Redirecting...</p>
      </div>
    );
  }

  return (
    <>
      <SwiperForm
        open={true}
        onOpenChange={handleCancel}
        title="Edit"
        leftAction={handleCancel}
        rightAction={handleFormSubmit}
        rightEnabled={editingExerciseDirty}
        rightText="Save"
        leftText="Close"
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

      {/* Set edit sheet */}
      <SwiperForm
        open={isEditSheetOpen}
        onOpenChange={handleSetEditFormClose}
        title="Set"
        leftAction={handleSetEditFormClose}
        rightAction={() => handleSetEditFormSave(currentFormValues)}
        rightEnabled={formDirty}
        rightText="Save"
        leftText="Cancel"
        padding={0}
        className="edit-set-drawer"
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
    </>
  );
};

export default EditExercise; 