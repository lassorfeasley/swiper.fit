import React, { useEffect, useState, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/supabaseClient";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import PageSectionWrapper from "@/components/common/Cards/Wrappers/PageSectionWrapper";
import { PageNameContext } from "@/App";
import { FormHeader } from "@/components/atoms/sheet";
import AddNewExerciseForm from "@/components/common/forms/AddNewExerciseForm";
import ExerciseCard from "@/components/common/Cards/ExerciseCard";
import AppLayout from "@/components/layout/AppLayout";
import SwiperAlertDialog from "@/components/molecules/swiper-alert-dialog";
import SwiperForm from "@/components/molecules/swiper-form";
import SectionNav from "@/components/molecules/section-nav";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { TextInput } from "@/components/molecules/text-input";

const RoutineBuilder = () => {
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
  const [isEditProgramOpen, setEditProgramOpen] = useState(false);
  const [isDeleteExerciseConfirmOpen, setDeleteExerciseConfirmOpen] =
    useState(false);
  const isUnmounted = useRef(false);
  const [dirty, setDirty] = useState(false);
  const formRef = useRef(null);
  const [sectionFilter, setSectionFilter] = useState("workout");

  useEffect(() => {
    setPageName("RoutineBuilder");
  }, [setPageName]);

  useEffect(() => {
    async function fetchProgramAndExercises() {
      setLoading(true);
      const { data: programData } = await supabase
        .from("routines")
        .select("routine_name")
        .eq("id", programId)
        .single();
      setProgramName(programData?.routine_name || "");

      const { data: progExs, error } = await supabase
        .from("routine_exercises")
        .select(
          `id,
           exercise_id,
           exercise_order,
           exercises!fk_routine_exercises__exercises(
             name,
             section
           ),
           routine_sets!fk_routine_sets__routine_exercises(
             id,
             reps,
             weight,
             weight_unit,
             set_order,
             set_variant,
             set_type,
             timed_set_duration
           )`
        )
        .eq("routine_id", programId)
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
        section: pe.exercises?.section || "training",
        sets: pe.routine_sets?.length || 0,
        order: pe.exercise_order || 0,
        setConfigs: (pe.routine_sets || [])
          .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
          .map((set) => {
            const unit = set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs');
            return {
              reps: set.reps,
              weight: unit === 'body' ? 0 : set.weight,
              unit,
              set_variant: set.set_variant || `Set ${set.set_order}`,
              set_type: set.set_type,
              timed_set_duration: set.timed_set_duration,
            };
          }),
      }));
      setExercises(items);
      // Automatically open add exercise form when no exercises exist
      if (items.length === 0) {
        setShowAddExercise(true);
      }
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
        .from("routine_exercises")
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
          .insert([{ name: exerciseData.name, section: exerciseData.section || "training" }])
          .select("id")
          .single();
        if (insertError || !newEx) throw new Error("Failed to create exercise");
        exercise_id = newEx.id;
      }
      const { data: progEx, error: progExError } = await supabase
        .from("routine_exercises")
        .insert({
          routine_id: programId,
          exercise_id,
          exercise_order: exercises.length + 1,
        })
        .select("id")
        .single();
      if (progExError || !progEx)
        throw new Error("Failed to link exercise to program");
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        routine_exercise_id: program_exercise_id,
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
          .from("routine_sets")
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
        .update({ name: exerciseData.name, section: exerciseData.section })
        .eq("id", editingExercise.exercise_id);
      await supabase
        .from("routine_sets")
        .delete()
        .eq("routine_exercise_id", editingExercise.id);
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        routine_exercise_id: editingExercise.id,
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
          .from("routine_sets")
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
        .from("routine_exercises")
        .delete()
        .eq("id", editingExercise.id);

      if (deleteError) throw deleteError;

      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this exercise because it is used by other routines or has logged sets.');
      } else {
        alert(err.message || 'Failed to delete exercise');
      }
    } finally {
      setDeleteExerciseConfirmOpen(false);
    }
  };

  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from("routine_exercises")
      .select(
        `id,
         exercise_id,
         exercise_order,
         exercises!fk_routine_exercises__exercises(
           name,
           section
         ),
         routine_sets!fk_routine_sets__routine_exercises(
           id,
           reps,
           weight,
           weight_unit,
           set_order,
           set_variant,
           set_type,
           timed_set_duration
         )`
      )
      .eq("routine_id", programId)
      .order("exercise_order", { ascending: true });
    const items = (progExs || []).map((pe) => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: pe.exercises?.name || "[Exercise name]",
      section: pe.exercises?.section || "training",
      sets: pe.routine_sets?.length || 0,
      order: pe.exercise_order || 0,
      setConfigs: (pe.routine_sets || [])
        .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
        .map((set) => {
          const unit = set.weight_unit || (set.set_type === 'timed' ? 'body' : 'lbs');
          return {
            reps: set.reps,
            weight: unit === 'body' ? 0 : set.weight,
            unit,
            set_variant: set.set_variant || `Set ${set.set_order}`,
            set_type: set.set_type,
            timed_set_duration: set.timed_set_duration,
          };
        }),
    }));
    setExercises(items);
  };

  const searchFiltered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const SECTION_KEYS = ["warmup", "workout", "cooldown"];

  const exercisesBySection = SECTION_KEYS.map((key) => {
    const target = key === "workout" ? "training" : key;
    const items = searchFiltered
      .filter((ex) => ex.section === target)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
    return { section: key, exercises: items };
  });

  const scrollSectionIntoView = (key) => {
    const el = document.getElementById(`section-${key}`);
    if (!el) return;
    const headerHeight = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--header-height") || "0",
      10
    );
    const rect = el.getBoundingClientRect();
    const scrollContainer = document.documentElement;
    scrollContainer.scrollBy({ top: rect.top - headerHeight, behavior: "smooth" });
  };

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
      .from("routine_sets")
      .delete()
      .eq("routine_exercise_id", program_exercise_id);
    // Insert new sets
    const setRows = (newSetConfigs || []).map((cfg, idx) => ({
      routine_exercise_id: program_exercise_id,
      set_order: idx + 1,
      reps: Number(cfg.reps),
      weight: Number(cfg.weight),
      weight_unit: cfg.unit,
      set_variant: cfg.set_variant || `Set ${idx + 1}`,
      set_type: cfg.set_type,
      timed_set_duration: cfg.timed_set_duration,
    }));
    if (setRows.length > 0) {
      await supabase.from("routine_sets").insert(setRows);
    }
  };

  const handleTitleChange = async (newTitle) => {
    setProgramName(newTitle);
    await supabase
      .from("routines")
      .update({ routine_name: newTitle })
      .eq("id", programId);
    setEditProgramOpen(false);
  };

  const handleDeleteProgram = () => {
    setDeleteProgramConfirmOpen(true);
    setEditProgramOpen(false);
  };

  const handleConfirmDeleteProgram = async () => {
    try {
      const { error } = await supabase
        .from("routines")
        .update({ is_archived: true })
        .eq("id", programId);

      if (error) throw error;

      navigate("/routines");
    } catch (err) {
      if (err.code === '23503') {
        alert('Cannot delete this routine because it has associated workouts.');
      } else {
        alert('Failed to delete routine: ' + err.message);
      }
    }
  };



  return (
    <>
      <AppLayout
        variant="dark-fixed"
        reserveSpace={true}
        title={programName}
        pageNameEditable={true}
        onBack={handleBack}
        showAdd={true}
        onAdd={() => setShowAddExercise(true)}
        showSearch={true}
        search={true}
        searchValue={search}
        onSearchChange={setSearch}
        showSettings={true}
        onSettings={() => setEditProgramOpen(true)}
        onDelete={handleDeleteProgram}
        showDeleteOption={true}
        showBackButton
        pageContext="program-builder"
        showSectionNav={true}
        sectionNavValue={sectionFilter}
        onSectionNavChange={(val) => {
          if (!val) return;
          setSectionFilter(val);
          scrollSectionIntoView(val);
        }}
        // vertical snap disabled
      >
        {exercisesBySection.map(({ section, exercises: secExercises }) => (
          <PageSectionWrapper key={section} section={section} id={`section-${section}`}>
            {secExercises.length === 0 && !loading ? (
              <div className="text-gray-400 text-center py-8">
                No exercises found. Try adding one!
              </div>
            ) : loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : (
              <div className="w-full max-w-[1250px] mx-auto grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(275px,375px))] gap-5 justify-start">
                {secExercises.map((ex) => (
                  <ExerciseCard
                    key={ex.id}
                    mode="default"
                    exerciseName={ex.name}
                    setConfigs={ex.setConfigs}
                    onEdit={() => setEditingExercise(ex)}
                    onSetConfigsChange={(newSetConfigs) =>
                      handleSetConfigsChange(ex.exercise_id, newSetConfigs)
                    }
                    onCardClick={() => setEditingExercise(ex)}
                                      />
                  ))}
                </div>
            )}
          </PageSectionWrapper>
        ))}
        <SwiperForm
          open={showAddExercise || !!editingExercise}
          onOpenChange={(open) => {
            handleModalClose();
          }}
          title={showAddExercise ? "Exercise" : "Edit"}
          leftAction={handleModalClose}
          rightAction={() => formRef.current.requestSubmit()}
          rightEnabled={dirty}
          className="add-exercise-drawer"
        >
          <div className="flex flex-col h-full overflow-y-scroll md:overflow-y-auto">
            <div className="overflow-y-scroll md:overflow-auto h-[650px] md:h-full">
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
                initialSection={
                  showAddExercise
                    ? sectionFilter === "workout"
                      ? "training"
                      : sectionFilter
                    : editingExercise?.section
                }
                initialSets={editingExercise?.setConfigs?.length}
                initialSetConfigs={editingExercise?.setConfigs}
                onDirtyChange={setDirty}
                hideActionButtons
                showAddToProgramToggle={false}
              />
              {editingExercise && (
                <div className="flex flex-col gap-3 border-t border-neutral-300 py-4 px-4">
                  <SwiperButton
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteExercise}
                  >
                    Delete exercise
                  </SwiperButton>
                </div>
              )}
            </div>
          </div>
        </SwiperForm>
      </AppLayout>

      <SwiperForm
        open={isEditProgramOpen}
        onOpenChange={setEditProgramOpen}
        title="Edit"
        leftAction={() => setEditProgramOpen(false)}
        leftText="Cancel"
        rightAction={() => handleTitleChange(programName)}
        rightText="Save"
      >
        <SwiperForm.Section>
          <TextInput
            label="Routine name"
            value={programName}
            onChange={(e) => setProgramName(e.target.value)}
          />
        </SwiperForm.Section>
        <SwiperForm.Section>
          <SwiperButton
            variant="destructive"
            onClick={handleDeleteProgram}
            className="w-full"
          >
            Delete program
          </SwiperButton>
        </SwiperForm.Section>
      </SwiperForm>

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

export default RoutineBuilder;
