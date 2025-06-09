import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppHeader from "@/components/layout/AppHeader";
import CardWrapper from "@/components/common/CardsAndTiles/Cards/CardWrapper";
import { Reorder, useDragControls } from "framer-motion";
import { useNavBarVisibility } from "@/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { PlusCircleIcon, TrashIcon, PencilIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddNewExerciseForm from "@/components/common/forms/compound-fields/AddNewExerciseForm";
import ExerciseCard from "@/components/common/CardsAndTiles/Cards/ExerciseCard";

const ProgramBuilder = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { setNavBarVisible } = useNavBarVisibility();
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
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible, setPageName]);

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
        .single();
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

  return (
    <div className="flex flex-col h-screen">
      <AppHeader
        appHeaderTitle={programName || "Program"}
        subhead={true}
        subheadText={`${exercises.length} exercise${
          exercises.length === 1 ? "" : "s"
        }`}
        showActionBar={true}
        actionBarText="Add an exercise"
        showBackButton={true}
        onBack={handleBack}
        onAction={() => setShowAddExercise(true)}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        data-component="AppHeader"
      />
      <CardWrapper
        reorderable={true}
        items={filteredExercises}
        onReorder={setExercises}
        className="px-4"
      >
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredExercises.length === 0 && !loading ? (
          <div className="text-gray-400 text-center py-8">
            No exercises found. Try adding one!
          </div>
        ) : (
          filteredExercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              mode="default"
              exerciseName={ex.name}
              setConfigs={ex.setConfigs}
              onEdit={() => setEditingExercise(ex)}
              isReorderable={true}
            />
          ))
        )}
      </CardWrapper>
      {(showAddExercise || editingExercise) && (
        <Sheet open={showAddExercise || !!editingExercise} onOpenChange={handleModalClose}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>{showAddExercise ? "Add a new exercise" : "Edit exercise"}</SheetTitle>
              <SheetDescription>
                {showAddExercise
                  ? "Fill out the form below to add a new exercise to your program."
                  : "Edit the details for this exercise."}
              </SheetDescription>
            </SheetHeader>
            <AddNewExerciseForm
              key={editingExercise ? editingExercise.id : 'add-new'}
              formPrompt={showAddExercise ? "Add a new exercise" : "Edit exercise"}
              onActionIconClick={showAddExercise ? handleAddExercise : handleEditExercise}
              onDelete={editingExercise ? handleDeleteExercise : undefined}
              initialName={editingExercise?.name}
              initialSets={editingExercise?.setConfigs?.length}
              initialSetConfigs={editingExercise?.setConfigs}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default ProgramBuilder;
