import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { Reorder } from "framer-motion";
import { PageNameContext } from "@/App";
import { FormHeader } from "@/components/atoms/sheet";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import ExerciseCard from "@/components/common/Cards/ExerciseCard";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import DrawerManager from "@/components/organisms/drawer-manager";

const ProgramBuilder = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { setPageName } = useContext(PageNameContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState("");
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [search, setSearch] = useState("");
  const [isDeleteProgramConfirmOpen, setDeleteProgramConfirmOpen] =
    useState(false);
  const [isDeleteExerciseConfirmOpen, setDeleteExerciseConfirmOpen] =
    useState(false);
  const isUnmounted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    setPageName("ProgramBuilder");
  }, [setPageName]);

  useEffect(() => {
    async function fetchProgramAndExercises() {
      setLoading(true);
      const { data: programData } = await supabase
        .from("programs")
        .select("program_name")
        .eq("id", programId)
        .single();
      setProgramName(programData?.program_name || "");

      const { data: progExs, error } = await supabase
        .from("program_exercises")
        .select(
          "id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order, set_variant, set_type, timed_set_duration)"
        )
        .eq("program_id", programId)
        .order("exercise_order", { ascending: true });
      if (error) {
        setExercises([]);
        setLoading(false);
        return;
      }
      const items = (progExs || []).map((pe) => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        name: pe.exercises?.name || "[Exercise name]",
        sets: pe.program_sets?.length || 0,
        order: pe.exercise_order || 0,
        setConfigs: (pe.program_sets || [])
          .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
          .map((set) => ({
            reps: set.reps,
            weight: set.weight,
            unit: set.weight_unit || "lbs",
            set_variant: set.set_variant || `Set ${set.set_order}`,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
          })),
      }));
      setExercises(items);
      setLoading(false);
    }
    fetchProgramAndExercises();
    return () => {
      isUnmounted.current = true;
      saveOrder();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const saveOrder = async () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await supabase
        .from("program_exercises")
        .update({ exercise_order: i + 1 })
        .eq("id", ex.id);
    }
  };

  const handleBack = () => {
    if (exercises.length === 0) {
      alert("You must add at least one exercise to save this program.");
      return;
    }
    saveOrder();
    navigate(-1);
  };

  const handleAddExercise = async (exerciseData) => {
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
          .insert([{ name: exerciseData.name }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }
      const { data: progEx, error: progExError } = await supabase
        .from("program_exercises")
        .insert({
          program_id: programId,
          exercise_id,
          exercise_order: exercises.length + 1,
        })
        .select("id")
        .single();
      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${idx + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("program_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to save set details: " + setError.message);
      }
      setShowAddExercise(false);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      await supabase
        .from("exercises")
        .update({ name: exerciseData.name })
        .eq("id", editingExercise.exercise_id);
      await supabase
        .from("program_sets")
        .delete()
        .eq("program_exercise_id", editingExercise.id);
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id: editingExercise.id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
        set_variant: cfg.set_variant || `Set ${idx + 1}`,
        set_type: cfg.set_type,
        timed_set_duration: cfg.timed_set_duration,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase
          .from("program_sets")
          .insert(setRows);
        if (setError)
          throw new Error("Failed to update set details: " + setError.message);
      }
      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to update exercise");
    }
  };

  const handleDeleteExercise = () => {
    if (!editingExercise) return;
    setDeleteExerciseConfirmOpen(true);
  };

  const handleConfirmDeleteExercise = async () => {
    try {
      if (!editingExercise) return;

      // Delete the program exercise and its associated sets
      const { error: deleteError } = await supabase
        .from("program_exercises")
        .delete()
        .eq("id", editingExercise.id);

      if (deleteError) throw new Error("Failed to delete exercise");

      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      alert(err.message || "Failed to delete exercise");
    } finally {
      setDeleteExerciseConfirmOpen(false);
    }
  };

  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from("program_exercises")
      .select(
        "id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order, set_variant, set_type, timed_set_duration)"
      )
      .eq("program_id", programId)
      .order("exercise_order", { ascending: true });
    const items = (progExs || []).map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: pe.exercises?.name || "[Exercise name]",
      sets: pe.program_sets?.length || 0,
      order: pe.exercise_order || 0,
      setConfigs: (pe.program_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => ({
          reps: set.reps,
          weight: set.weight,
          unit: set.weight_unit || "lbs",
          set_variant: set.set_variant || `Set ${set.set_order}`,
          set_type: set.set_type,
          timed_set_duration: set.timed_set_duration,
        })),
    }));
    setExercises(items);
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleModalClose = () => {
    setShowAddExercise(false);
    setEditingExercise(null);
  };

  // Handler to update setConfigs for an exercise and persist to Supabase
  const handleSetConfigsChange = async (exerciseId, newSetConfigs) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId
          ? { ...ex, setConfigs: newSetConfigs }
          : ex
      )
    );
    // Find the program_exercise_id for this exercise
    const programExercise = exercises.find(
      (ex) => ex.exercise_id === exerciseId
    );
    if (!programExercise) return;
    const program_exercise_id = programExercise.id;
    // Delete old sets
    await supabase
      .from("program_sets")
      .delete()
      .eq("program_exercise_id", program_exercise_id);
    // Insert new sets
    const setRows = (newSetConfigs || []).map((cfg, idx) => ({
      program_exercise_id,
      set_order: idx + 1,
      reps: Number(cfg.reps),
      weight: Number(cfg.weight),
      weight_unit: cfg.unit,
      set_variant: cfg.set_variant || `Set ${idx + 1}`,
      set_type: cfg.set_type,
      timed_set_duration: cfg.timed_set_duration,
    }));
    if (setRows.length > 0) {
      await supabase.from("program_sets").insert(setRows);
    }
  };

  const handleTitleChange = async (newTitle) => {
    try {
      const { error } = await supabase
        .from("programs")
        .update({ program_name: newTitle })
        .eq("id", programId);

      if (error) throw error;
      setProgramName(newTitle);
    } catch (err) {
      alert("Failed to update program name: " + err.message);
    }
  };

  const handleDeleteProgram = () => {
    setDeleteProgramConfirmOpen(true);
  };

  const handleConfirmDeleteProgram = async () => {
    try {
      const { error } = await supabase
        .from("programs")
        .update({ is_archived: true })
        .eq("id", programId);

      if (error) {
        throw error;
      }

      navigate("/programs");
    } catch (err) {
      alert("Failed to delete program: " + err.message);
    }
  };

  return (
    <>
      <AppLayout
        appHeaderTitle={programName || "Program"}
        showAddButton={true}
        addButtonText="Add exercise"
        pageNameEditable={true}
        showBackButton={true}
        onBack={handleBack}
        onAction={() => setShowAddExercise(true)}
        onTitleChange={handleTitleChange}
        onDelete={handleDeleteProgram}
        showDeleteOption={true}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        pageContext="programBuilder"
        data-component="AppHeader"
      >
        <CardWrapper>
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : filteredExercises.length === 0 && !loading ? (
            <div className="text-gray-400 text-center py-8">
              No exercises found. Try adding one!
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              values={filteredExercises}
              onReorder={setExercises}
              className="flex flex-col gap-4 w-full"
            >
              {filteredExercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  mode="default"
                  exerciseName={ex.name}
                  setConfigs={ex.setConfigs}
                  onEdit={() => setEditingExercise(ex)}
                  onSetConfigsChange={(newSetConfigs) =>
                    handleSetConfigsChange(ex.exercise_id, newSetConfigs)
                  }
                  reorderable={true}
                  reorderValue={ex}
                  onCardClick={() => setEditingExercise(ex)}
                />
              ))}
            </Reorder.Group>
          )}
        </CardWrapper>
        <DrawerManager
          open={showAddExercise || !!editingExercise}
          onOpenChange={handleModalClose}
          title={showAddExercise ? "Exercise" : "Edit"}
          leftAction={handleModalClose}
          rightAction={() => formRef.current?.requestSubmit?.()}
          rightEnabled={dirty}
          rightText={showAddExercise ? "Add" : "Save"}
          leftText="Cancel"
        >
          <div className="flex flex-col h-full overflow-y-scroll md:overflow-y-auto">
            <div className="overflow-y-scroll md:overflow-auto px-1 h-[650px] md:h-full">
              <AddNewExerciseForm
                ref={formRef}
                key={editingExercise ? editingExercise.id : "add-new"}
                formPrompt={
                  showAddExercise ? "Add a new exercise" : "Edit exercise"
                }
                onActionIconClick={
                  showAddExercise ? handleAddExercise : handleEditExercise
                }
                onDelete={editingExercise ? handleDeleteExercise : undefined}
                initialName={editingExercise?.name}
                initialSets={editingExercise?.setConfigs?.length}
                initialSetConfigs={editingExercise?.setConfigs}
                onDirtyChange={setDirty}
                hideActionButtons
                showAddToProgramToggle={false}
              />
            </div>
          </div>
        </DrawerManager>
      </AppLayout>
      <SwiperAlertDialog
        open={isDeleteProgramConfirmOpen}
        onOpenChange={setDeleteProgramConfirmOpen}
        onConfirm={handleConfirmDeleteProgram}
        title="Confirm deletion"
        description="Deleting this program will not affect your completed workout history."
        confirmText="Delete"
        cancelText="Cancel"
      />
      <SwiperAlertDialog
        open={isDeleteExerciseConfirmOpen}
        onOpenChange={setDeleteExerciseConfirmOpen}
        onConfirm={handleConfirmDeleteExercise}
        title="Are you sure you want to delete this exercise?"
        description="This action cannot be undone and the exercise will be removed from this program."
        confirmText="Delete"
      />
    </>
  );
};

export default ProgramBuilder;
