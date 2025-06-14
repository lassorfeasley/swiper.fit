import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import PageHeader from "@/components/layout/PageHeader";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import { Reorder, useDragControls } from "framer-motion";
import { PageNameContext } from "@/App";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SwiperSheet } from '@/components/ui/swiper-sheet';
import { SwiperCard, SwiperCardTitle } from '@/components/molecules/swiper-card';
import { Badge } from '@/components/ui/badge';
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import AppLayout from '@/components/layout/AppLayout';

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
  const isUnmounted = useRef(false);

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
          "id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order)"
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
      alert('You must add at least one exercise to save this program.');
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

  const handleDeleteExercise = async () => {
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
    }
  };

  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from("program_exercises")
      .select(
        "id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order)"
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
    setExercises(prev => prev.map(ex =>
      ex.exercise_id === exerciseId ? { ...ex, setConfigs: newSetConfigs } : ex
    ));
    // Find the program_exercise_id for this exercise
    const programExercise = exercises.find(ex => ex.exercise_id === exerciseId);
    if (!programExercise) return;
    const program_exercise_id = programExercise.id;
    // Delete old sets
    await supabase
      .from('program_sets')
      .delete()
      .eq('program_exercise_id', program_exercise_id);
    // Insert new sets
    const setRows = (newSetConfigs || []).map((cfg, idx) => ({
      program_exercise_id,
      set_order: idx + 1,
      reps: Number(cfg.reps),
      weight: Number(cfg.weight),
      weight_unit: cfg.unit,
    }));
    if (setRows.length > 0) {
      await supabase.from('program_sets').insert(setRows);
    }
  };

  return (
    <AppLayout
      appHeaderTitle={programName || "Program"}
      showActionBar={true}
      actionBarText="Add an exercise"
      showBackButton={true}
      onBack={handleBack}
      onAction={() => setShowAddExercise(true)}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="programBuilder"
      data-component="AppHeader"
    >
      <CardWrapper className="px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredExercises.length === 0 && !loading ? (
          <div className="text-gray-400 text-center py-8">
            No exercises found. Try adding one!
          </div>
        ) : (
          <Reorder.Group axis="y" values={filteredExercises} onReorder={setExercises} className="flex flex-col gap-4 w-full">
            {filteredExercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                mode="default"
                exerciseName={ex.name}
                setConfigs={ex.setConfigs}
                onEdit={() => setEditingExercise(ex)}
                onSetConfigsChange={newSetConfigs => handleSetConfigsChange(ex.exercise_id, newSetConfigs)}
                reorderable={true}
                reorderValue={ex}
                onCardClick={() => setEditingExercise(ex)}
              />
            ))}
          </Reorder.Group>
        )}
      </CardWrapper>
      {(showAddExercise || editingExercise) && (
        <SwiperSheet open={showAddExercise || !!editingExercise} onOpenChange={handleModalClose}>
            <AddNewExerciseForm
              key={editingExercise ? editingExercise.id : 'add-new'}
              formPrompt={showAddExercise ? "Add a new exercise" : "Edit exercise"}
              onActionIconClick={showAddExercise ? handleAddExercise : handleEditExercise}
              onDelete={editingExercise ? handleDeleteExercise : undefined}
              initialName={editingExercise?.name}
              initialSets={editingExercise?.setConfigs?.length}
              initialSetConfigs={editingExercise?.setConfigs}
            />
        </SwiperSheet>
      )}
    </AppLayout>
  );
};

export default ProgramBuilder;
