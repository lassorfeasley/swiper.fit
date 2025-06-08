import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import AppHeader from "@/components/layout/AppHeader";
import CardWrapper from "@/components/common/CardsAndTiles/Cards/CardWrapper";
import { Reorder, useDragControls } from "framer-motion";
import ExerciseSetConfiguration from "@/components/common/forms/compound-fields/ExerciseSetConfiguration";
import { useNavBarVisibility } from "@/NavBarVisibilityContext";
import { PageNameContext } from "@/App";
import SlideUpForm from "@/components/common/forms/SlideUpForm";
import NumericInput from "@/components/common/forms/NumericInput";
import ToggleGroup from "@/components/common/forms/ToggleGroup";
import FormGroupWrapper from "@/components/common/forms/FormWrappers/FormGroupWrapper";
import SetPill from "@/components/common/CardsAndTiles/SetPill";
import WeightCompoundField from "@/components/common/forms/compound-fields/WeightCompoundField";

const ConfigureProgramExercisesIndex = () => {
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

  const [editingSetInfo, setEditingSetInfo] = useState(null);
  const [currentSetEditData, setCurrentSetEditData] = useState({
    reps: 0,
    weight: 0,
    unit: "lbs",
  });

  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setPageName("ConfigureProgramExercises");
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible, setPageName]);

  const mapProgramSetData = (programSets) => {
    return (programSets || [])
      .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
      .map((set) => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight,
        unit: set.weight_unit || "lbs",
      }));
  };

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
        console.error("Error fetching program exercises:", error);
        setExercises([]);
        setLoading(false);
        return;
      }
      const items = (progExs || []).map((pe) => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        name: pe.exercises?.name || "[Exercise name]",
        order: pe.exercise_order || 0,
        setConfigs: mapProgramSetData(pe.program_sets),
      }));
      setExercises(items);
      setLoading(false);
    }
    fetchProgramAndExercises();
    return () => {
      isUnmounted.current = true;
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
        if (insertError || !newEx)
          throw new Error(
            "Failed to create exercise: " +
              (insertError?.message || "Unknown error")
          );
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
        throw new Error(
          "Failed to link exercise to program: " +
            (progExError?.message || "Unknown error")
        );
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
      console.error("handleAddExercise error:", err);
    }
  };

  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      if (exerciseData.name !== editingExercise.name) {
        await supabase
          .from("exercises")
          .update({ name: exerciseData.name })
          .eq("id", editingExercise.exercise_id);
      }

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
      console.error("handleEditExercise error:", err);
    }
  };

  const refreshExercises = async () => {
    if (isUnmounted.current) return;
    setLoading(true);
    const { data: progExs, error } = await supabase
      .from("program_exercises")
      .select(
        "id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order)"
      )
      .eq("program_id", programId)
      .order("exercise_order", { ascending: true });

    if (error) {
      console.error("Error refreshing exercises:", error);
      setExercises([]);
      setLoading(false);
      return;
    }
    const items = (progExs || []).map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: pe.exercises?.name || "[Exercise name]",
      order: pe.exercise_order || 0,
      setConfigs: mapProgramSetData(pe.program_sets),
    }));
    setExercises(items);
    setLoading(false);
  };

  const filteredExercises = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleModalClose = () => {
    setShowAddExercise(false);
    setEditingExercise(null);
  };

  const handleSetPillClick = (exerciseId, setIndex) => {
    setShowAddExercise(false);
    setEditingExercise(null);
    const exercise = exercises.find((ex) => ex.id === exerciseId);
    if (exercise && exercise.setConfigs && exercise.setConfigs[setIndex]) {
      const setData = exercise.setConfigs[setIndex];
      setEditingSetInfo({
        exerciseId,
        setIndexInExercise: setIndex,
        setData,
      });
      setCurrentSetEditData({ ...setData });
    }
  };

  const handleSaveSetEdit = async () => {
    if (!editingSetInfo) return;

    const { exerciseId, setIndexInExercise, setData } = editingSetInfo;
    const { reps, weight, unit } = currentSetEditData;
    const setId = setData.id;

    try {
      const { error } = await supabase
        .from("program_sets")
        .update({
          reps: Number(reps),
          weight: unit === "body" ? null : Number(weight),
          weight_unit: unit,
        })
        .eq("id", setId);

      if (error) {
        throw new Error("Failed to update set: " + error.message);
      }

      setExercises((prevExercises) => {
        return prevExercises.map((ex) => {
          if (ex.id === exerciseId) {
            const updatedSetConfigs = [...ex.setConfigs];
            updatedSetConfigs[setIndexInExercise] = {
              ...updatedSetConfigs[setIndexInExercise],
              reps: Number(reps),
              weight: unit === "body" ? null : Number(weight),
              unit: unit,
            };
            return { ...ex, setConfigs: updatedSetConfigs };
          }
          return ex;
        });
      });
      setEditingSetInfo(null);
      setEditingExercise(null);
      setShowAddExercise(false);
    } catch (err) {
      alert(err.message || "Failed to save set changes.");
      console.error("handleSaveSetEdit error:", err);
    }
  };

  const handleSetEditFormChange = (field, value) => {
    setCurrentSetEditData((prev) => ({ ...prev, [field]: value }));
    if (field === "unit" && value === "body") {
      setCurrentSetEditData((prev) => ({ ...prev, weight: 0 }));
    }
  };

  const handleCardClick = (e, exercise) => {
    if (!isDragging) {
      setEditingExercise(exercise);
    }
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
        className="px-4"
        reorderable={true}
        items={filteredExercises}
        onReorder={setExercises}
      >
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : (
          filteredExercises.map((ex, exerciseIndex) => (
            <Reorder.Item
              key={ex.id}
              value={ex}
              className="w-full"
              dragControls={dragControls}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
            >
              <div
                data-layer="ProgramExerciseCard"
                className="Programexercisecard self-stretch w-full px-3 py-2 bg-stone-50 rounded-lg inline-flex flex-col justify-start items-start gap-5 cursor-pointer"
                onClick={(e) => handleCardClick(e, ex)}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingExercise(ex);
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.586 3.58598C13.7705 3.39496 13.9912 3.24259 14.2352 3.13778C14.4792 3.03296 14.7416 2.97779 15.0072 2.97548C15.2728 2.97317 15.5361 3.02377 15.7819 3.12434C16.0277 3.2249 16.251 3.3734 16.4388 3.56119C16.6266 3.74897 16.7751 3.97228 16.8756 4.21807C16.9762 4.46386 17.0268 4.72722 17.0245 4.99278C17.0222 5.25834 16.967 5.52078 16.8622 5.76479C16.7574 6.0088 16.605 6.22949 16.414 6.41398L15.621 7.20698L12.793 4.37898L13.586 3.58598V3.58598ZM11.379 5.79298L3 14.172V17H5.828L14.208 8.62098L11.378 5.79298H11.379Z"
                        fill="var(--slate-600, #2F3640)"
                      />
                    </svg>
                  </div>
                </div>
                <div
                  data-layer="SetPillWrapper"
                  className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-2 flex-wrap content-center"
                >
                  {(ex.setConfigs || []).map((set, setIndex) => (
                    <SetPill
                      key={set.id || `set-${setIndex}`}
                      reps={set.reps}
                      weight={set.unit === "body" ? undefined : set.weight}
                      unit={set.unit}
                      onClick={() => handleSetPillClick(ex.id, setIndex)}
                      className="cursor-pointer"
                    />
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

      {editingSetInfo && currentSetEditData ? (
        <SlideUpForm
          formPrompt="Edit Set"
          isOpen={editingSetInfo !== null}
          onOverlayClick={() => setEditingSetInfo(null)}
          onActionIconClick={handleSaveSetEdit}
          isReady={true}
        >
          <FormGroupWrapper className="flex flex-col gap-0">
            <NumericInput
              label="Reps"
              value={currentSetEditData.reps}
              onChange={(val) => handleSetEditFormChange("reps", val)}
              min={0}
              max={999}
              className="w-full"
            />
            <WeightCompoundField
              weight={currentSetEditData.weight}
              onWeightChange={(val) => handleSetEditFormChange("weight", val)}
              unit={currentSetEditData.unit}
              onUnitChange={(val) => handleSetEditFormChange("unit", val)}
              weightLabel="Weight"
              allowDecimal={true}
              className="w-full"
            />
          </FormGroupWrapper>
        </SlideUpForm>
      ) : (
        (showAddExercise || editingExercise) && (
          <ExerciseSetConfiguration
            formPrompt={
              showAddExercise ? "Add a new exercise" : "Edit exercise"
            }
            onActionIconClick={
              showAddExercise ? handleAddExercise : handleEditExercise
            }
            initialName={editingExercise?.name}
            initialSets={editingExercise?.setConfigs?.length}
            initialSetConfigs={editingExercise?.setConfigs}
            onOverlayClick={handleModalClose}
            isOpen={true}
          />
        )
      )}
    </div>
  );
};

export default ConfigureProgramExercisesIndex;
