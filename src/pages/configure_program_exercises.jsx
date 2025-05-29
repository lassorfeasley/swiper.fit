import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/layout/AppHeader';
import Reorder_Card from '../components/common/UI_Cards/Reorder_Card';
import MetricPill from '../components/common/UI_Cards/MetricPill';
import { Reorder } from 'framer-motion';
import ExerciseSetConfiguration from '../components/common/forms/compound-fields/exercise_set_configuration';
import { useNavBarVisibility } from '../NavBarVisibilityContext';
import { PageNameContext } from '../App';
import CardWrapper from '../components/layout/CardWrapper';
import SetCard from '../components/common/UI_Cards/SetCard';
import ExerciseSetsConfigurationCard from '../components/common/UI_Cards/ExerciseSetsConfigurationCard';

const ConfigureProgramExercises = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const { setNavBarVisible } = useNavBarVisibility();
  const { setPageName } = useContext(PageNameContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null); // {ex, setConfigs}
  const [search, setSearch] = useState('');
  const isUnmounted = useRef(false);

  useEffect(() => {
    setPageName('ConfigureProgramExercises');
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible, setPageName]);

  useEffect(() => {
    async function fetchProgramAndExercises() {
      setLoading(true);
      // Fetch program name
      const { data: programData } = await supabase
        .from('programs')
        .select('program_name')
        .eq('id', programId)
        .single();
      setProgramName(programData?.program_name || '');
      // Fetch exercises
      const { data: progExs, error } = await supabase
        .from('program_exercises')
        .select('id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order)')
        .eq('program_id', programId)
        .order('exercise_order', { ascending: true });
      if (error) {
        setExercises([]);
        setLoading(false);
        return;
      }
      const items = (progExs || []).map(pe => ({
        id: pe.id,
        exercise_id: pe.exercise_id,
        name: pe.exercises?.name || '[Exercise name]',
        sets: pe.program_sets?.length || 0,
        reps: pe.program_sets?.[0]?.reps || 0,
        weight: pe.program_sets?.[0]?.weight || 0,
        unit: pe.program_sets?.[0]?.weight_unit || 'lbs',
        order: pe.exercise_order || 0,
        setConfigs: (pe.program_sets || []).sort((a, b) => (a.set_order || 0) - (b.set_order || 0)),
      }));
      setExercises(items);
      setLoading(false);
    }
    fetchProgramAndExercises();
    // Save order on unmount
    return () => {
      isUnmounted.current = true;
      saveOrder();
    };
    // eslint-disable-next-line
  }, [programId]);

  // Save new order to DB
  const saveOrder = async () => {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await supabase
        .from('program_exercises')
        .update({ exercise_order: i + 1 })
        .eq('id', ex.id);
    }
  };

  // Save order on navigation (back button)
  const handleBack = () => {
    saveOrder();
    navigate(-1);
  };

  // Add new exercise handler
  const handleAddExercise = async (exerciseData) => {
    try {
      // 1. Insert exercise (if not exists)
      let { data: existing, error } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exerciseData.name)
        .single();
      let exercise_id;
      if (existing && existing.id) {
        exercise_id = existing.id;
      } else {
        const { data: newEx, error: insertError } = await supabase
          .from('exercises')
          .insert([{ name: exerciseData.name }])
          .select('id, name')
          .single();
        if (insertError || !newEx) throw new Error('Failed to create exercise');
        exercise_id = newEx.id;
      }
      // 2. Insert into program_exercises
      const { data: progEx, error: progExError } = await supabase
        .from('program_exercises')
        .insert({
          program_id: programId,
          exercise_id,
          exercise_order: exercises.length + 1,
        })
        .select()
        .single();
      if (progExError || !progEx) throw new Error('Failed to link exercise to program');
      const program_exercise_id = progEx.id;
      // 3. Insert into program_sets
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase.from('program_sets').insert(setRows);
        if (setError) throw new Error('Failed to save set details');
      }
      setShowAddExercise(false);
      // Refresh list
      await new Promise(r => setTimeout(r, 200)); // slight delay for DB consistency
      // Re-fetch exercises
      await refreshExercises();
    } catch (err) {
      alert(err.message || 'Failed to add exercise');
    }
  };

  // Edit exercise handler
  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      // 1. Update exercise name if changed
      await supabase
        .from('exercises')
        .update({ name: exerciseData.name })
        .eq('id', editingExercise.exercise_id);
      // 2. Update program_sets: delete old, insert new
      await supabase
        .from('program_sets')
        .delete()
        .eq('program_exercise_id', editingExercise.id);
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id: editingExercise.id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase.from('program_sets').insert(setRows);
        if (setError) throw new Error('Failed to update set details');
      }
      setEditingExercise(null);
      // Refresh list
      await new Promise(r => setTimeout(r, 200));
      await refreshExercises();
    } catch (err) {
      alert(err.message || 'Failed to update exercise');
    }
  };

  // Helper to refresh exercises
  const refreshExercises = async () => {
    const { data: progExs } = await supabase
      .from('program_exercises')
      .select('id, exercise_id, exercise_order, exercises(name), program_sets(id, reps, weight, weight_unit, set_order)')
      .eq('program_id', programId)
      .order('exercise_order', { ascending: true });
    const items = (progExs || []).map(pe => ({
      id: pe.id,
      exercise_id: pe.exercise_id,
      name: pe.exercises?.name || '[Exercise name]',
      sets: pe.program_sets?.length || 0,
      reps: pe.program_sets?.[0]?.reps || 0,
      weight: pe.program_sets?.[0]?.weight || 0,
      unit: pe.program_sets?.[0]?.weight_unit || 'lbs',
      order: pe.exercise_order || 0,
      setConfigs: (pe.program_sets || []).sort((a, b) => (a.set_order || 0) - (b.set_order || 0)),
    }));
    setExercises(items);
  };

  // Filtered exercises based on search
  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  // Handler to close modal or go back to programs page
  const handleOverlayClick = () => {
    if (showAddExercise) {
      setShowAddExercise(false);
    } else if (editingExercise) {
      setEditingExercise(null);
    } else {
      navigate('/programs');
    }
  };

  return (
    <CardWrapper
      header={
        <AppHeader
          appHeaderTitle={programName || 'Program'}
          subhead={true}
          subheadText={`${exercises.length} exercise${exercises.length === 1 ? '' : 's'}`}
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
      }
    >
      <div className="flex-1 flex flex-col items-center px-4 pt-6" data-component="ConfigureProgramExercisesContent">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : (
          <div className="w-full max-w-lg mx-auto flex flex-col justify-start flex-1" data-component="ExerciseList">
            <Reorder.Group axis="y" values={filteredExercises} onReorder={setExercises} className="flex flex-col gap-4 flex-1 justify-start" data-component="ReorderGroup">
              {filteredExercises.map((ex) => (
                <Reorder_Card key={ex.id} value={ex} data-component="ReorderCard">
                  <div className="flex flex-col w-full gap-2" onClick={() => setEditingExercise(ex)} data-component="ExerciseCard">
                    <div className="flex items-center gap-2 align-stretch w-full">
                      <div className="text-xl font-bold text-[#5A6B7A] flex-1">{ex.name}</div>
                      <button className="text-[#5A6B7A]">
                        <span className="material-symbols-outlined">settings</span>
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <MetricPill value={ex.sets} unit="SETS" data-component="MetricPill" />
                      <MetricPill value={ex.reps} unit="REPS" data-component="MetricPill" />
                      <MetricPill value={ex.weight} unit={ex.unit?.toUpperCase() || "LBS"} data-component="MetricPill" />
                    </div>
                  </div>
                </Reorder_Card>
              ))}
            </Reorder.Group>
          </div>
        )}
        {/* Modal overlay for adding exercise */}
        {showAddExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-0">
              <ExerciseSetConfiguration
                formPrompt="Add a new exercise"
                actionIconName="arrow_forward"
                onActionIconClick={handleAddExercise}
                onOverlayClick={handleOverlayClick}
              />
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
                onClick={() => setShowAddExercise(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}
        {/* Modal overlay for editing exercise */}
        {editingExercise && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-0">
              <ExerciseSetConfiguration
                formPrompt="Edit exercise"
                actionIconName="check"
                onActionIconClick={handleEditExercise}
                initialName={editingExercise.name}
                initialSets={editingExercise.sets}
                initialReps={editingExercise.reps}
                initialWeight={editingExercise.weight}
                initialUnit={editingExercise.unit}
                initialSetConfigs={editingExercise.setConfigs?.map(cfg => ({
                  reps: cfg.reps,
                  weight: cfg.weight,
                  unit: cfg.weight_unit,
                }))}
                onOverlayClick={handleOverlayClick}
              />
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
                onClick={() => setEditingExercise(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </CardWrapper>
  );
};

export default ConfigureProgramExercises; 