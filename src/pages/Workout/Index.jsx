// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=49-317&t=YBjXtsLhxGedobad-4

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import AppHeader from '../../components/layout/AppHeader';
import ActiveFocusedNavBar from '../../components/layout/ActiveFocusedNavBar';
import SetCard from '../../components/common/CardsAndTiles/Cards/Library/SetCard.jsx';
import SlideUpForm from '../../components/common/forms/SlideUpForm';
import TextField from '../../components/common/forms/TextField';
import NumericInput from '../../components/common/forms/NumericInput';
import WeightCompoundField from '../../components/common/forms/compound-fields/WeightCompoundField.jsx';
import SetDropdown from '../../components/common/forms/compound-fields/SetDropdown.jsx';
import ProgramTile from '../../components/common/CardsAndTiles/Tiles/ProgramTile.jsx';
import TileWrapper from '../../components/common/CardsAndTiles/Tiles/TileWrapper.jsx';
import CardWrapper from '../../components/common/CardsAndTiles/Cards/CardWrapper';
import { useNavBarVisibility } from '../../NavBarVisibilityContext.jsx';
import Icon from '../../components/common/Icon.jsx';
import { useNavigate } from 'react-router-dom';

const Workout = () => {
  const [step, setStep] = useState('select'); // 'select' or 'active'
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const timerRef = useRef();
  const [setsData, setSetsData] = useState({}); // { exerciseId: [setData, ...] }
  const [completedSets, setCompletedSets] = useState({}); // { exerciseId: [setData, ...] }
  const { setNavBarVisible } = useNavBarVisibility();
  const [workoutName, setWorkoutName] = useState('');

  // State for adding unscheduled exercise
  const [showAddUnscheduledForm, setShowAddUnscheduledForm] = useState(false);
  const [newUnscheduledExerciseName, setNewUnscheduledExerciseName] = useState('');
  const [newUnscheduledExerciseSets, setNewUnscheduledExerciseSets] = useState(3); // Default to 3 sets
  const [newUnscheduledExerciseReps, setNewUnscheduledExerciseReps] = useState(10); // Default to 10 reps
  const [newUnscheduledExerciseWeight, setNewUnscheduledExerciseWeight] = useState(0); // Default to 0 weight
  const [newUnscheduledExerciseUnit, setNewUnscheduledExerciseUnit] = useState('kg'); // Default to 'kg'
  const [newUnscheduledSetConfigs, setNewUnscheduledSetConfigs] = useState(
    Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, unit: 'kg' }))
  );
  const [openSetIndex, setOpenSetIndex] = useState(null);

  const navigate = useNavigate();

  // Hide/show nav bar based on step
  useEffect(() => {
    setNavBarVisible(step !== 'active');
    return () => setNavBarVisible(true);
  }, [step, setNavBarVisible]);

  // Fetch programs on mount
  useEffect(() => {
    if (step === 'select') {
      setLoading(true);
      (async () => {
        const { data: programsData, error } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
        if (error || !programsData) {
          setPrograms([]);
          setLoading(false);
          return;
        }
        const programsWithCounts = await Promise.all(
          programsData.map(async (program) => {
            const { count, error: countError } = await supabase
              .from('program_exercises')
              .select('id', { count: 'exact', head: true })
              .eq('program_id', program.id);
            return {
              ...program,
              exerciseCount: countError ? 0 : count,
            };
          })
        );
        setPrograms(programsWithCounts);
        setLoading(false);
      })();
    }
  }, [step]);

  // Fetch exercises for selected program
  useEffect(() => {
    if (selectedProgram && step === 'active') {
      setLoading(true);
      supabase
        .from('program_exercises')
        .select(`
          id,
          exercise_id,
          exercises(name),
          program_sets(id, reps, weight, weight_unit, set_order)
        `)
        .eq('program_id', selectedProgram.id)
        .then(async ({ data: progExs, error }) => {
          if (error || !progExs) {
            setExercises([]);
            setLoading(false);
            return;
          }
          const exerciseIds = progExs.map(pe => pe.exercise_id);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);

          if (exercisesError) {
            console.error("Error fetching exercises for program:", exercisesError);
            setExercises([]);
            setLoading(false);
            return;
          }

          const cards = progExs.map(pe => ({
            id: pe.id, // This is program_exercise_id, unique for list key
            exercise_id: pe.exercise_id, // This is actual exercise_id
            name: (exercisesData.find(e => e.id === pe.exercise_id) || {}).name || 'Unknown',
            setConfigs: (pe.program_sets || [])
              .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
              .map(set => ({
                reps: set.reps,
                weight: set.weight,
                unit: set.weight_unit || 'lbs'
              }))
          }));
          setExercises(cards);
          setLoading(false);
        });
    } else if (!selectedProgram && step === 'active') {
        setExercises([]); // Clear exercises if starting an unscheduled workout from scratch
    }
  }, [selectedProgram, step]);

  // Timer logic
  useEffect(() => {
    if (step !== 'active') return;
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, step]);

  useEffect(() => {
    if (step === 'active' && selectedProgram) {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const timeOfDay = now.getHours() < 12 ? 'morning' : 
                         now.getHours() < 17 ? 'afternoon' : 'evening';
      setWorkoutName(`${dayOfWeek} ${timeOfDay} workout`);
    } else if (step === 'active' && !selectedProgram) {
      setWorkoutName('Unscheduled workout');
    }
  }, [step, selectedProgram]);

  // Keep setConfigs in sync with sets count and defaults
  useEffect(() => {
    setNewUnscheduledSetConfigs(prev => {
      const arr = Array.from({ length: newUnscheduledExerciseSets }, (_, i) => prev[i] || { reps: newUnscheduledExerciseReps, weight: newUnscheduledExerciseWeight, unit: newUnscheduledExerciseUnit });
      return arr.map(cfg => ({
        reps: cfg.reps ?? newUnscheduledExerciseReps,
        weight: cfg.weight ?? newUnscheduledExerciseWeight,
        unit: cfg.unit ?? newUnscheduledExerciseUnit,
      }));
    });
  }, [newUnscheduledExerciseSets, newUnscheduledExerciseReps, newUnscheduledExerciseWeight, newUnscheduledExerciseUnit]);

  // Handle set completion
  const handleSetComplete = (exerciseId, setDataArg) => {
    setCompletedSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), setDataArg]
    }));
  };

  // Handle set data change
  const handleSetDataChange = (exerciseId, setId, field, value) => {
    if (setId === 'sets') {
      // Handle set count change
      setExercises(prevExercises => 
        prevExercises.map(ex => {
          if (ex.exercise_id === exerciseId) {
            const newSetConfigs = Array.from({ length: value }, (_, i) => {
              const existingConfig = ex.setConfigs[i] || {};
              return {
                reps: existingConfig.reps || 10,
                weight: existingConfig.weight || 0,
                unit: existingConfig.unit || 'lbs'
              };
            });
            return { ...ex, setConfigs: newSetConfigs };
          }
          return ex;
        })
      );
      return;
    }

    // Handle individual set changes
    setSetsData(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.id === setId);
      let newSets;
      if (setIdx !== -1) {
        newSets = prevSets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      } else {
        newSets = [...prevSets, { id: setId, [field]: value }];
      }
      return { ...prev, [exerciseId]: newSets };
    });
  };

  // Modify the program selection handler
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setStep('active');
  };

  // Save workout to Supabase
  const handleEnd = async () => {
    setTimerActive(false);
    const workoutData = {
      duration_seconds: timer,
      completed_at: new Date().toISOString(),
      user_id: 'bed5cb48-0242-4894-b58d-94ac01de22ff',
      workout_name: workoutName,
    };
    if (selectedProgram) {
        workoutData.program_id = selectedProgram.id;
    }

    const { data: workoutInsert, error: workoutError } = await supabase
      .from('workouts')
      .insert([workoutData])
      .select()
      .single();

    if (workoutError || !workoutInsert) {
      console.error('Workout insert error:', { error: workoutError, payload: workoutData });
      alert('Failed to save workout! ' + (workoutError?.message || ''));
      return;
    }
    const rows = Object.entries(setsData).flatMap(([exerciseId, exerciseSets]) => 
        (exerciseSets || []).map((set, idx) => {
          // Remove id and status before inserting into DB
          const { id, status, ...restOfSet } = set;
          return {
            ...restOfSet,
            exercise_id: exerciseId,
            workout_id: workoutInsert.id,
            order: idx + 1,
          };
        })
    );
    if (rows.length > 0) {
      const { error: setsError } = await supabase.from('sets').insert(rows);
      if (setsError) {
        console.error('Sets insert error:', setsError, rows);
        alert('Failed to save sets! ' + (setsError?.message || ''));
      }
    }
    // Redirect to the history detail page for the new workout
    navigate(`/history/${workoutInsert.id}`);
    setStep('select');
    setSelectedProgram(null);
    setExercises([]);
    setTimer(0);
    setCompletedSets({});
    setSetsData({});
    setShowAddUnscheduledForm(false);
    setNewUnscheduledExerciseName('');
    setNewUnscheduledExerciseSets(3);
    setNewUnscheduledExerciseReps(10);
    setNewUnscheduledExerciseWeight(0);
    setNewUnscheduledExerciseUnit('kg');
    setNewUnscheduledSetConfigs(Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, unit: 'kg' })));
    setOpenSetIndex(null);
  };
  
  const handleAddUnscheduledExercise = async () => {
    if (!newUnscheduledExerciseName.trim()) {
      alert("Exercise name cannot be empty.");
      return;
    }
    // 1. Insert the new exercise into the 'exercises' table
    const { data: newExerciseData, error: insertError } = await supabase
      .from('exercises')
      .insert([{ 
        name: newUnscheduledExerciseName.trim(),
      }])
      .select()
      .single();
    if (insertError || !newExerciseData) {
      console.error("Error inserting new exercise:", insertError);
      alert("Failed to create new exercise. " + (insertError?.message || ''));
      return;
    }
    const createdExerciseId = newExerciseData.id;
    const newExerciseForWorkout = {
      id: `unscheduled-${createdExerciseId}-${Date.now()}`,
      exercise_id: createdExerciseId,
      name: newUnscheduledExerciseName.trim(),
      setConfigs: newUnscheduledSetConfigs,
      isUnscheduled: true,
    };
    setExercises(prevExercises => [...prevExercises, newExerciseForWorkout]);
    setShowAddUnscheduledForm(false);
    setNewUnscheduledExerciseName('');
    setNewUnscheduledExerciseSets(3);
    setNewUnscheduledExerciseReps(10);
    setNewUnscheduledExerciseWeight(0);
    setNewUnscheduledExerciseUnit('kg');
    setNewUnscheduledSetConfigs(Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, unit: 'kg' })));
    setOpenSetIndex(null);
  };

  // Common structure for both steps
  return (
    <div className="flex flex-col h-screen">
      {step === 'select' ? (
        <>
          <AppHeader
            appHeaderTitle="Select a program to start"
            showActionBar={false}
            showActionIcon={false}
            showBackButton={false}
            subhead={false}
            search={true}
            searchPlaceholder="Search"
            data-component="AppHeader"
          />
          <TileWrapper>
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : (
              programs.map(program => (
                <ProgramTile
                  key={program.id}
                  programName={program.program_name}
                  exerciseCount={program.exerciseCount}
                  onClick={() => handleProgramSelect(program)}
                />
              ))
            )}
          </TileWrapper>
        </>
      ) : (
        // Active workout page
        <>
          <AppHeader
            showBackButton={false}
            appHeaderTitle={workoutName || 'Active Workout'}
            subhead={true}
            subheadText={selectedProgram?.program_name || 'Tracking unscheduled exercises'}
            search={false}
            showActionBar={true}
            actionBarText="Add exercise"
            onAction={() => setShowAddUnscheduledForm(true)}
            data-component="active_workout_header"
          />
          <CardWrapper>
            <div className="flex flex-col gap-4 p-4">
              {exercises.map(ex => (
                <SetCard
                  key={ex.id}
                  exerciseId={ex.exercise_id}
                  exerciseName={ex.name}
                  default_view={true}
                  setConfigs={ex.setConfigs}
                  onSetComplete={(setDataArg) => handleSetComplete(ex.exercise_id, setDataArg)}
                  setData={setsData[ex.exercise_id] || []}
                  onSetDataChange={handleSetDataChange}
                  data-component="SetCard"
                />
              ))}
            </div>
          </CardWrapper>
          <ActiveFocusedNavBar
            timer={`${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`}
            isPaused={!timerActive}
            onPauseToggle={() => setTimerActive(a => !a)}
            onEnd={handleEnd}
            data-component="ActiveFocusedNavBar"
          />
        </>
      )}
      {showAddUnscheduledForm && (
        <SlideUpForm
          formPrompt="Add New Exercise"
          onOverlayClick={() => setShowAddUnscheduledForm(false)}
          actionIcon={<button onClick={handleAddUnscheduledExercise} style={{ background: 'none', border: 'none', padding: 0 }}><Icon name="arrow_forward" size={32} /></button>}
          className="z-[100]"
        >
          <div className="w-full flex flex-col gap-0">
            <div className="bg-white rounded-xl p-4 flex flex-col gap-0">
              <TextField
                label="Exercise name"
                value={newUnscheduledExerciseName}
                onChange={e => setNewUnscheduledExerciseName(e.target.value)}
                placeholder="Exercise name"
                className="w-full"
                autoFocus
              />
              <NumericInput
                label="Sets"
                value={newUnscheduledExerciseSets}
                onChange={newSets => setNewUnscheduledExerciseSets(Math.max(0, Number(newSets)))}
                incrementing={true}
                className="w-full"
              />
              <NumericInput
                label="Reps"
                value={newUnscheduledExerciseReps}
                onChange={setNewUnscheduledExerciseReps}
                incrementing={true}
                className="w-full"
              />
              <WeightCompoundField
                weight={newUnscheduledExerciseWeight}
                onWeightChange={setNewUnscheduledExerciseWeight}
                unit={newUnscheduledExerciseUnit}
                onUnitChange={setNewUnscheduledExerciseUnit}
              />
            </div>
            {newUnscheduledExerciseSets > 1 && Array.from({ length: newUnscheduledExerciseSets }, (_, i) => (
              <SetDropdown
                key={`set-${i + 1}`}
                setNumber={i + 1}
                defaultReps={newUnscheduledExerciseReps}
                defaultWeight={newUnscheduledExerciseWeight}
                defaultUnit={newUnscheduledExerciseUnit}
                isOpen={openSetIndex === i + 1}
                onToggle={() => setOpenSetIndex(openSetIndex === i + 1 ? null : i + 1)}
                reps={newUnscheduledSetConfigs[i]?.reps}
                weight={newUnscheduledSetConfigs[i]?.weight}
                unit={newUnscheduledSetConfigs[i]?.unit}
                onRepsChange={val => setNewUnscheduledSetConfigs(cfgs => cfgs.map((cfg, idx) => idx === i ? { ...cfg, reps: val } : cfg))}
                onWeightChange={val => setNewUnscheduledSetConfigs(cfgs => cfgs.map((cfg, idx) => idx === i ? { ...cfg, weight: val } : cfg))}
                onUnitChange={val => setNewUnscheduledSetConfigs(cfgs => cfgs.map((cfg, idx) => idx === i ? { ...cfg, unit: val } : cfg))}
              />
            ))}
          </div>
        </SlideUpForm>
      )}
    </div>
  );
};

export default Workout; 