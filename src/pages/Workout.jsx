import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import SetCard from '../components/UI/SetCard';
import ActiveFocusedNavBar from '../components/UI/ActiveFocusedNavBar';
import { useNavBarVisibility } from '../NavBarVisibilityContext';

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
        // For each program, fetch the number of exercises
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
    if (selectedProgram) {
      setLoading(true);
      supabase
        .from('program_exercises')
        .select('*')
        .eq('program_id', selectedProgram.id)
        .then(async ({ data: progExs, error }) => {
          if (!progExs) {
            setExercises([]);
            setLoading(false);
            return;
          }
          const exerciseIds = progExs.map(pe => pe.exercise_id);
          const { data: exercisesData } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);
          // Compose exercise cards
          const cards = progExs.map(pe => ({
            id: pe.id,
            exercise_id: pe.exercise_id,
            name: (exercisesData.find(e => e.id === pe.exercise_id) || {}).name || 'Unknown',
            default_sets: pe.default_sets,
            default_reps: pe.default_reps,
            default_weight: pe.default_weight
          }));
          setExercises(cards);
          setLoading(false);
        });
    }
  }, [selectedProgram]);
   // 
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

  // Handle set completion (collect data for saving)
  const handleSetComplete = (exerciseId, setData) => {
    setCompletedSets(prev => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), setData]
    }));
  };
  //

  // Handle set data change (for controlled inputs)
  const handleSetDataChange = (exerciseId, setId, field, value) => {
    setSetsData(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.setId === setId);
      let newSets;
      if (setIdx !== -1) {
        newSets = prevSets.map((s, i) => i === setIdx ? { ...s, [field]: value } : s);
      } else {
        newSets = [...prevSets, { setId, [field]: value }];
      }
      return { ...prev, [exerciseId]: newSets };
    });
  };

  // Save sets and workout to Supabase
  const handleEnd = async () => {
    setTimerActive(false);
    // 1. Insert new workout
    const { data: workoutInsert, error: workoutError } = await supabase
      .from('workouts')
      .insert([
        {
          program_id: selectedProgram.id,
          duration_seconds: timer, // seconds
          completed_at: new Date().toISOString(),
          user_id: 'bed5cb48-0242-4894-b58d-94ac01de22ff', // real user id
        },
      ])
      .select()
      .single();
    if (workoutError || !workoutInsert) {
      console.error('Workout insert error:', {
        error: workoutError,
        payload: {
          program_id: selectedProgram.id,
          duration_seconds: timer,
          completed_at: new Date().toISOString(),
        }
      });
      alert('Failed to save workout! ' + (workoutError?.message || ''));
      return;
    }
    // 2. Insert all sets from setsData with workout_id
    const rows = Object.entries(setsData).flatMap(([exerciseId, sets]) =>
      sets.map((set, idx) => {
        const { setId, ...rest } = set;
        return {
          ...rest,
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
    // Reset state
    setStep('select');
    setSelectedProgram(null);
    setExercises([]);
    setTimer(0);
    setCompletedSets({});
    setSetsData({});
  };

  // UI
  if (step === 'select') {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="p-6 text-2xl font-bold">Select a program</div>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {programs.map(program => (
              <button
                key={program.id}
                className="bg-[#353942] text-white rounded-2xl p-6 flex justify-between items-center text-left shadow-md"
                onClick={() => {
                  setSelectedProgram(program);
                  setStep('active');
                }}
              >
                <div>
                  <div className="text-xl font-bold">{program.name}</div>
                  <div className="text-base text-gray-300">{typeof program.exerciseCount === 'number' ? program.exerciseCount : '?'} exercises</div>
                </div>
                <span className="text-2xl">+</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Workout active page
  return (
    <div className="min-h-screen flex flex-col bg-[#353942] pb-32">
      <div className="p-6 text-2xl font-bold text-white">{selectedProgram?.name}</div>
      <div className="flex-1 flex flex-col gap-4 p-4">
        {exercises.map(ex => (
          <SetCard
            key={ex.id}
            exerciseId={ex.exercise_id}
            exerciseName={ex.name}
            default_view={true}
            defaultSets={ex.default_sets}
            defaultReps={ex.default_reps}
            defaultWeight={ex.default_weight}
            onSetComplete={setData => handleSetComplete(ex.exercise_id, setData)}
            setData={setsData[ex.exercise_id] || []}
            onSetDataChange={(setId, field, value) => handleSetDataChange(ex.exercise_id, setId, field, value)}
          />
        ))}
      </div>
      {/* Focused nav bar for workout active */}
      <ActiveFocusedNavBar
        timer={`${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`}
        isPaused={!timerActive}
        onPauseToggle={() => setTimerActive(a => !a)}
        onEnd={handleEnd}
      />
    </div>
  );
};

export default Workout; 