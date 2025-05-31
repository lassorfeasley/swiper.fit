import React, { useEffect, useState, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AppHeader from '../../components/layout/AppHeader';
import CardWrapper from '../../components/common/CardsAndTiles/Cards/CardWrapper';
import Reorder_Card from '../../components/common/CardsAndTiles/Cards/Library/Reorder_Card';
import MetricPill from '../../components/common/CardsAndTiles/MetricPill';
import { Reorder } from 'framer-motion';
import ExerciseSetConfiguration from '../../components/common/forms/compound-fields/exercise_set_configuration';
import { useNavBarVisibility } from '../../NavBarVisibilityContext';
import { PageNameContext } from '../../App';

const ConfigureProgramExercisesIndex = () => { // Renamed component
  const { programId } = useParams();
  const navigate = useNavigate();
  const { setNavBarVisible } = useNavBarVisibility();
  const { setPageName } = useContext(PageNameContext);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programName, setProgramName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
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
      const { data: programData } = await supabase
        .from('programs')
        .select('program_name')
        .eq('id', programId)
        .single();
      setProgramName(programData?.program_name || '');
      
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
        .from('program_exercises')
        .update({ exercise_order: i + 1 })
        .eq('id', ex.id);
    }
  };

  const handleBack = () => {
    saveOrder();
    navigate(-1);
  };

  const handleAddExercise = async (exerciseData) => {
    try {
      let { data: existing } = await supabase
        .from('exercises')
        .select('id')
        .eq('name', exerciseData.name)
        .single();
      let exercise_id = existing?.id;
      if (!exercise_id) {
        const { data: newEx, error: insertError } = await supabase
          .from('exercises')
          .insert([{ name: exerciseData.name }])
          .select('id')
          .single();
        if (insertError || !newEx) throw new Error('Failed to create exercise');
        exercise_id = newEx.id;
      }
      const { data: progEx, error: progExError } = await supabase
        .from('program_exercises')
        .insert({ program_id: programId, exercise_id, exercise_order: exercises.length + 1 })
        .select('id')
        .single();
      if (progExError || !progEx) throw new Error('Failed to link exercise to program');
      const program_exercise_id = progEx.id;
      const setRows = (exerciseData.setConfigs || []).map((cfg, idx) => ({
        program_exercise_id,
        set_order: idx + 1,
        reps: Number(cfg.reps),
        weight: Number(cfg.weight),
        weight_unit: cfg.unit,
      }));
      if (setRows.length > 0) {
        const { error: setError } = await supabase.from('program_sets').insert(setRows);
        if (setError) throw new Error('Failed to save set details: ' + setError.message);
      }
      setShowAddExercise(false);
      await refreshExercises();
    } catch (err) {
      alert(err.message || 'Failed to add exercise');
    }
  };

  const handleEditExercise = async (exerciseData) => {
    try {
      if (!editingExercise) return;
      await supabase
        .from('exercises')
        .update({ name: exerciseData.name })
        .eq('id', editingExercise.exercise_id);
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
        if (setError) throw new Error('Failed to update set details: ' + setError.message);
      }
      setEditingExercise(null);
      await refreshExercises();
    } catch (err) {
      alert(err.message || 'Failed to update exercise');
    }
  };

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

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleModalClose = () => {
    setShowAddExercise(false);
    setEditingExercise(null);
  };

  return (
    <div className="flex flex-col h-screen"> 
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
      <CardWrapper>
        <div className="px-4 w-full" data-component="ConfigureProgramExercisesContent">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : (
            <Reorder.Group axis="y" values={filteredExercises} onReorder={setExercises} className="flex flex-col gap-4 w-full" data-component="ReorderGroup">
              {filteredExercises.map((ex) => (
                <Reorder_Card key={ex.id} value={ex} data-component="ReorderCard">
                  <div className="flex flex-col w-full gap-2 cursor-pointer" onClick={() => setEditingExercise(ex)} data-component="ExerciseCard">
                    <div className="flex items-center gap-2 align-stretch w-full">
                      <div className="text-xl font-bold text-[#5A6B7A] flex-1">{ex.name}</div>
                      <button className="text-[#5A6B7A]" aria-label={`Settings for ${ex.name}`}>
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
          )}
          {(showAddExercise || editingExercise) && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={handleModalClose}>
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-0" onClick={(e) => e.stopPropagation()}>
                <ExerciseSetConfiguration
                  formPrompt={showAddExercise ? "Add a new exercise" : "Edit exercise"}
                  actionIconName={showAddExercise ? "arrow_forward" : "check"}
                  onActionIconClick={showAddExercise ? handleAddExercise : handleEditExercise}
                  initialName={editingExercise?.name}
                  initialSets={editingExercise?.sets}
                  initialReps={editingExercise?.reps}
                  initialWeight={editingExercise?.weight}
                  initialUnit={editingExercise?.unit}
                  initialSetConfigs={editingExercise?.setConfigs?.map(cfg => ({
                    reps: cfg.reps,
                    weight: cfg.weight,
                    unit: cfg.weight_unit,
                  }))}
                  onOverlayClick={handleModalClose}
                />
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-black text-2xl"
                  onClick={handleModalClose}
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </CardWrapper>
    </div>
  );
};

export default ConfigureProgramExercisesIndex; 