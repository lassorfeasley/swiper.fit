// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=49-317&t=YBjXtsLhxGedobad-4

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import SetCard from '../components/common/CardsAndTiles/SetCard';
import ActiveFocusedNavBar from '../components/layout/ActiveFocusedNavBar';
import { useNavBarVisibility } from '../NavBarVisibilityContext';
import AppHeader from '../components/layout/AppHeader';
import MainContainer from '../components/common/MainContainer';
import CardWrapper from '../components/layout/CardWrapper';
import ProgramCard from '../components/common/CardsAndTiles/ProgramCard';
import SlideUpForm from '../components/common/forms/SlideUpForm';
import NumericInput from '../components/common/forms/NumericInput';
import Icon from '../components/common/Icon';
import TextField from '../components/common/forms/TextField';
import WeightCompoundField from '../components/common/forms/compound-fields/WeightCompoundField';
import SetDropdown from '../components/common/forms/compound-fields/SetDropdown';

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
  const [startTime, setStartTime] = useState(null);

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
        const { data: programsData, error } = await supabase.from('programs').select('*');
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
        .select('*')
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
            default_sets: pe.default_sets,
            default_reps: pe.default_reps,
            default_weight: pe.default_weight
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
      const timeOfDay = now.getHours() < 12 ? 'Morning' : 
                       now.getHours() < 17 ? 'Afternoon' : 'Evening';
      setWorkoutName(`${dayOfWeek} ${timeOfDay} ${selectedProgram.program_name} Workout`);
    } else if (step === 'active' && !selectedProgram) {
      setWorkoutName('Unscheduled Workout');
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
    setSetsData(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.id === setId); // Assuming setId is unique per exercise from SetCard
      let newSets;
      if (setIdx !== -1) {
        newSets = prevSets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      } else {
        // This case might need review if setId is not guaranteed.
        // For now, assuming SetCard provides a unique id for each set data object.
        newSets = [...prevSets, { id: setId, [field]: value }]; 
      }
      return { ...prev, [exerciseId]: newSets };
    });
  };

  // Modify the program selection handler to record start time
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setStartTime(new Date().toISOString()); // Record the exact start time
    setStep('active');
  };

  // Save workout to Supabase
  const handleEnd = async () => {
    setTimerActive(false);
    const workoutData = {
        duration_seconds: timer,
        completed_at: new Date().toISOString(),
        user_id: 'bed5cb48-0242-4894-b58d-94ac01de22ff', // TODO: replace with real user id
        workout_name: workoutName,
        start_time: startTime, // Include the start time in the workout data
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
      default_sets: newUnscheduledExerciseSets,
      default_reps: newUnscheduledExerciseReps,
      default_weight: newUnscheduledExerciseWeight,
      unit: newUnscheduledExerciseUnit,
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

  if (step === 'select') {
    return (
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
        <div style={{ height: 140 }} />
        <CardWrapper>
          <MainContainer data-component="WorkoutPage">
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : (
              <div className="flex flex-col gap-4">
                {programs.map(program => (
                  <ProgramCard
                    key={program.id}
                    programName={program.program_name}
                    exerciseCount={program.exerciseCount}
                    onClick={() => handleProgramSelect(program)}
                  />
                ))}
              </div>
            )}
          </MainContainer>
        </CardWrapper>
      </>
    );
  }

  // Active workout page
  return (
    <>
      <AppHeader
        showBackButton={false}
        appHeaderTitle={selectedProgram?.program_name || (workoutName || 'Active Workout')}
        subhead={true}
        subheadText={selectedProgram ? workoutName : 'Tracking unscheduled exercises'}
        search={false}
        showActionBar={true}
        actionBarText="Add exercise"
        onAction={() => setShowAddUnscheduledForm(true)}
        data-component="active_workout_header"
      />
      <div style={{ height: 140 }} />
      <CardWrapper>
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
          {exercises.map(ex => (
            <SetCard
              key={ex.id}
              exerciseId={ex.exercise_id}
              exerciseName={ex.name}
              default_view={true}
              defaultSets={ex.default_sets}
              defaultReps={ex.default_reps}
              defaultWeight={ex.default_weight}
              onSetComplete={(setDataArg) => handleSetComplete(ex.exercise_id, setDataArg)}
              setData={setsData[ex.exercise_id] || []}
              onSetDataChange={(setId, field, value) => handleSetDataChange(ex.exercise_id, setId, field, value)}
              data-component="SetCard"
            />
          ))}
        </div>
        <ActiveFocusedNavBar
          timer={`${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`}
          isPaused={!timerActive}
          onPauseToggle={() => setTimerActive(a => !a)}
          onEnd={handleEnd}
          data-component="ActiveFocusedNavBar"
        />
      </CardWrapper>
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
    </>
  );
};

export default Workout; 