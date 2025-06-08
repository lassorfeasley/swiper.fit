import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppHeader from "@/components/layout/AppHeader";
import CardWrapper from "@/components/common/CardsAndTiles/Cards/CardWrapper";
import { Reorder, useDragControls } from "framer-motion";
import ExerciseSetConfiguration from "@/components/common/forms/compound-fields/ExerciseSetConfiguration";
import { useNavBarVisibility } from "@/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import { PlusCircleIcon, TrashIcon, PencilIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ConfigureProgramExercises = () => {
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
    setPageName("ConfigureProgramExercises");
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
            <Reorder.Item key={ex.id} value={ex}>
              <div
                data-layer="ProgramExerciseCard"
                className="Programexercisecard self-stretch px-3 py-2 bg-stone-50 rounded-lg inline-flex flex-col justify-start items-start gap-5"
              >
                <div
                  data-layer="NameAndIconWrapper"
                  className="Nameandiconwrapper self-stretch inline-flex justify-start items-center gap-2"
                >
                  <div
                    data-layer="[Exercise name]"
                    className="ExerciseName flex-1 justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose"
                  >
                    {ex.name}
                  </div>
                  <div
                    data-svg-wrapper
                    data-layer="pencil"
                    className="Pencil relative cursor-pointer"
                    onClick={() => setEditingExercise(ex)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.586 3.58599C13.7705 3.39497 13.9912 3.24261 14.2352 3.13779C14.4792 3.03297 14.7416 2.9778 15.0072 2.97549C15.2728 2.97319 15.5361 3.02379 15.7819 3.12435C16.0277 3.22491 16.251 3.37342 16.4388 3.5612C16.6266 3.74899 16.7751 3.97229 16.8756 4.21809C16.9762 4.46388 17.0268 4.72724 17.0245 4.9928C17.0222 5.25836 16.967 5.5208 16.8622 5.7648C16.7574 6.00881 16.605 6.2295 16.414 6.41399L15.621 7.20699L12.793 4.37899L13.586 3.58599V3.58599ZM11.379 5.79299L3 14.172V17H5.828L14.208 8.62099L11.378 5.79299H11.379Z"
                        fill="var(--slate-600, #2F3640)"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  data-layer="SetPillWrapper"
                  className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-2 flex-wrap content-center"
                >
                  {(ex.setConfigs || []).map((set, index) => (
                    <div
                      key={index}
                      data-layer="SetPill"
                      className="Setpill size- px-1 py-0.5 bg-grey-200 rounded-sm flex justify-start items-center"
                    >
                      <div
                        data-layer="RepsXWeight"
                        className="Repsxweight text-center justify-center text-slate-500 text-xs font-normal font-['Space_Grotesk'] leading-none"
                      >
                        {`${set.reps || "0"}×${set.weight || "0"} ${
                          set.unit || "lbs"
                        }`}
                      </div>
                    </div>
                  ))}
                  {(ex.setConfigs || []).length === 0 && (
                    <div className="text-slate-400 text-xs font-normal font-['Space_Grotesk'] leading-none">
                      No sets configured. Click the pencil to edit.
                    </div>
                  )}
                </div>
              </div>
            </Reorder.Item>
          ))
        )}
      </CardWrapper>
      {(showAddExercise || editingExercise) && (
        <Sheet open={showAddExercise || !!editingExercise} onOpenChange={handleModalClose}>
          <SheetContent>
            <ExerciseSetConfiguration
              formPrompt={showAddExercise ? "Add a new exercise" : "Edit exercise"}
              onActionIconClick={showAddExercise ? handleAddExercise : handleEditExercise}
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

export default ConfigureProgramExercises;
