import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import AppHeader from '@/components/layout/AppHeader';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ActiveExerciseCard from '@/components/common/Cards/ActiveExerciseCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import NumericInput from '@/components/molecules/numeric-input';
import WeightCompoundField from '@/components/common/forms/WeightCompoundField';
import Icon from '@/components/molecules/Icon';
import AddNewExerciseForm from '@/components/common/forms/AddNewExerciseForm';

/**
 * ActiveFocusedNavBar Component
 * Props:
 * - timer: string (formatted, e.g. '00:00')
 * - isPaused: boolean
 * - onPauseToggle: function
 * - onEnd: function
 */
const ActiveFocusedNavBar = ({ timer, isPaused, onPauseToggle, onEnd }) => {
  return (
    <div 
      data-layer="ActiveWorkoutNav" 
      className="fixed bottom-0 left-0 w-full h-24 px-6 py-3 bg-black/90 backdrop-blur-[2px] flex justify-center items-start z-50"
    >
      <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper w-80 max-w-80 flex justify-between items-start">
        <div data-layer="Timer" className="Timer flex justify-start items-center gap-1">
          <div data-svg-wrapper data-layer="RecordingIcon" className="Recordingicon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="10" fill="var(--green-500, #22C55E)"/>
            </svg>
          </div>
          <div data-layer="TimePassed" className="Timepassed justify-center text-white text-xl font-normal font-['Space_Grotesk'] leading-loose">
            {timer}
          </div>
        </div>
        <div data-layer="NavIconsWrapper" className="Naviconswrapper flex justify-start items-center">
          <div 
            data-layer="NavIcons" 
            data-selected={!isPaused} 
            className={`Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer${isPaused ? ' NaviconsSelected3 w-14' : ''}`}
            onClick={onPauseToggle}
          >
            {isPaused ? (
              <>
                <div data-svg-wrapper data-layer="play" className="Play relative">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M15 27C18.1826 27 21.2348 25.7357 23.4853 23.4853C25.7357 21.2348 27 18.1826 27 15C27 11.8174 25.7357 8.76516 23.4853 6.51472C21.2348 4.26428 18.1826 3 15 3C11.8174 3 8.76516 4.26428 6.51472 6.51472C4.26428 8.76516 3 11.8174 3 15C3 18.1826 4.26428 21.2348 6.51472 23.4853C8.76516 25.7357 11.8174 27 15 27V27ZM14.3325 10.752C14.1066 10.6013 13.844 10.5147 13.5728 10.5015C13.3015 10.4884 13.0318 10.5491 12.7924 10.6772C12.5529 10.8053 12.3527 10.996 12.2132 11.229C12.0736 11.462 12 11.7284 12 12V18C12 18.2716 12.0736 18.538 12.2132 18.771C12.3527 19.004 12.5529 19.1947 12.7924 19.3228C13.0318 19.4509 13.3015 19.5116 13.5728 19.4985C13.844 19.4853 14.1066 19.3987 14.3325 19.248L18.8325 16.248C19.0379 16.111 19.2064 15.9254 19.3229 15.7077C19.4394 15.49 19.5003 15.2469 19.5003 15C19.5003 14.7531 19.4394 14.51 19.3229 14.2923C19.2064 14.0746 19.0379 13.889 18.8325 13.752L14.3325 10.752V10.752Z" fill="var(--white, white)"/>
                  </svg>
                </div>
                <div data-layer="Resume" className="Resume text-center justify-start text-white text-xs font-bold font-['Space_Grotesk'] leading-3">Resume</div>
              </>
            ) : (
              <>
                <div data-svg-wrapper data-layer="pause" className="Pause relative">
                  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M27 15C27 18.1826 25.7357 21.2348 23.4853 23.4853C21.2348 25.7357 18.1826 27 15 27C11.8174 27 8.76516 25.7357 6.51472 23.4853C4.26428 21.2348 3 18.1826 3 15C3 11.8174 4.26428 8.76516 6.51472 6.51472C8.76516 4.26428 11.8174 3 15 3C18.1826 3 21.2348 4.26428 23.4853 6.51472C25.7357 8.76516 27 11.8174 27 15ZM10.5 12C10.5 11.6022 10.658 11.2206 10.9393 10.9393C11.2206 10.658 11.6022 10.5 12 10.5C12.3978 10.5 12.7794 10.658 13.0607 10.9393C13.342 11.2206 13.5 11.6022 13.5 12V18C13.5 18.3978 13.342 18.7794 13.0607 19.0607C12.7794 19.342 12.3978 19.5 12 19.5C11.6022 19.5 11.2206 19.342 10.9393 19.0607C10.658 18.7794 10.5 18.3978 10.5 18V12ZM18 10.5C17.6022 10.5 17.2206 10.658 16.9393 10.9393C16.658 11.2206 16.5 11.6022 16.5 12V18C16.5 18.3978 16.658 18.7794 16.9393 19.0607C17.2206 19.342 17.6022 19.5 18 19.5C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V12C19.5 11.6022 19.342 11.2206 19.0607 10.9393C18.7794 10.658 18.3978 10.5 18 10.5Z" fill="var(--slate-200, #E5E5E5)"/>
                  </svg>
                </div>
                <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
                  Pause
                </div>
              </>
            )}
          </div>
          <div 
            data-layer="NavIcons" 
            data-selected="true" 
            className="Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer"
            onClick={onEnd}
          >
            <div data-svg-wrapper data-layer="stop" className="Stop relative">
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15 27C18.1826 27 21.2348 25.7357 23.4853 23.4853C25.7357 21.2348 27 18.1826 27 15C27 11.8174 25.7357 8.76516 23.4853 6.51472C21.2348 4.26428 18.1826 3 15 3C11.8174 3 8.76516 4.26428 6.51472 6.51472C4.26428 8.76516 3 11.8174 3 15C3 18.1826 4.26428 21.2348 6.51472 23.4853C8.76516 25.7357 11.8174 27 15 27ZM12 10.5C11.6022 10.5 11.2206 10.658 10.9393 10.9393C10.658 11.2206 10.5 11.6022 10.5 12V18C10.5 18.3978 10.658 18.7794 10.9393 19.0607C11.2206 19.342 11.6022 19.5 12 19.5H18C18.3978 19.5 18.7794 19.342 19.0607 19.0607C19.342 18.7794 19.5 18.3978 19.5 18V12C19.5 11.6022 19.342 11.2206 19.0607 10.9393C18.7794 10.658 18.3978 10.5 18 10.5H12Z" fill="var(--slate-200, #E5E5E5)"/>
              </svg>
            </div>
            <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
              End
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveWorkout = ({ 
  selectedProgram, 
  onEnd,
  exercises: initialExercises = [],
  onExercisesChange
}) => {
  const [exercises, setExercises] = useState(initialExercises);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(true);
  const timerRef = useRef();
  const [setsData, setSetsData] = useState({}); // { exerciseId: [setData, ...] }
  const [completedSets, setCompletedSets] = useState({}); // { exerciseId: [setData, ...] }
  const [workoutName, setWorkoutName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newUnscheduledExerciseName, setNewUnscheduledExerciseName] = useState('');
  const [newUnscheduledExerciseSets, setNewUnscheduledExerciseSets] = useState(3);
  const [newUnscheduledExerciseReps, setNewUnscheduledExerciseReps] = useState(10);
  const [newUnscheduledExerciseWeight, setNewUnscheduledExerciseWeight] = useState(0);
  const [newUnscheduledExerciseUnit, setNewUnscheduledExerciseUnit] = useState('kg');
  const [newUnscheduledSetConfigs, setNewUnscheduledSetConfigs] = useState(
    Array.from({ length: 3 }, () => ({ reps: 10, weight: 0, unit: 'kg' }))
  );
  const [openSetIndex, setOpenSetIndex] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch exercises for selected program
  useEffect(() => {
    if (selectedProgram) {
      console.log('Fetching exercises for program:', selectedProgram);
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
          console.log('Program exercises query result:', { progExs, error });
          if (error || !progExs) {
            console.error('Error fetching program exercises:', error);
            setExercises([]);
            setLoading(false);
            return;
          }
          const exerciseIds = progExs.map(pe => pe.exercise_id);
          console.log('Exercise IDs to fetch:', exerciseIds);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);

          console.log('Exercises query result:', { exercisesData, exercisesError });

          if (exercisesError) {
            console.error("Error fetching exercises for program:", exercisesError);
            setExercises([]);
            setLoading(false);
            return;
          }

          const cards = progExs.map(pe => ({
            id: pe.id,
            exercise_id: pe.exercise_id,
            name: (exercisesData.find(e => e.id === pe.exercise_id) || {}).name || 'Unknown',
            setConfigs: (pe.program_sets || [])
              .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
              .map(set => ({
                reps: set.reps,
                weight: set.weight,
                unit: set.weight_unit || 'lbs'
              }))
          }));
          console.log('Processed exercise cards:', cards);
          setExercises(cards);
          onExercisesChange?.(cards);
          setLoading(false);
        });
    } else {
      console.log('No program selected, clearing exercises');
      setExercises([]);
      onExercisesChange?.([]);
    }
  }, [selectedProgram, onExercisesChange]);

  // Timer logic
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // Set workout name based on time and program
  useEffect(() => {
    if (selectedProgram) {
      const now = new Date();
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
      const timeOfDay = now.getHours() < 12 ? 'morning' : 
                       now.getHours() < 17 ? 'afternoon' : 'evening';
      setWorkoutName(`${dayOfWeek} ${timeOfDay} workout`);
    } else {
      setWorkoutName('Unscheduled workout');
    }
  }, [selectedProgram]);

  // Keep setConfigs in sync with sets count and defaults
  useEffect(() => {
    setNewUnscheduledSetConfigs(prev => {
      const arr = Array.from({ length: newUnscheduledExerciseSets }, (_, i) => 
        prev[i] || { 
          reps: newUnscheduledExerciseReps, 
          weight: newUnscheduledExerciseWeight, 
          unit: newUnscheduledExerciseUnit 
        }
      );
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
      setExercises(prevExercises => {
        const updatedExercises = prevExercises.map(ex => {
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
        });
        onExercisesChange?.(updatedExercises);
        return updatedExercises;
      });
      return;
    }

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

  const handleEnd = async () => {
    setTimerActive(false);
    // Check if at least one set is logged
    const totalSets = Object.values(setsData).reduce((acc, arr) => acc + (arr ? arr.length : 0), 0);
    if (totalSets === 0) {
      alert('You must log at least one set to complete a workout.');
      return;
    }
    onEnd?.({
      duration_seconds: timer,
      workout_name: workoutName,
      setsData,
      completedSets
    });
  };

  const handleAddExercise = async (exerciseData) => {
    try {
      if (!exerciseData.name.trim()) {
        alert("Exercise name cannot be empty.");
        return;
      }

      const { data: newExerciseData, error: insertError } = await supabase
        .from('exercises')
        .insert([{ 
          name: exerciseData.name.trim(),
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
        name: exerciseData.name.trim(),
        setConfigs: exerciseData.setConfigs,
        isUnscheduled: true,
      };

      const updatedExercises = [...exercises, newExerciseForWorkout];
      setExercises(updatedExercises);
      onExercisesChange?.(updatedExercises);
      
      // Reset form
      setShowAddExercise(false);
    } catch (err) {
      alert(err.message || "Failed to add exercise");
    }
  };

  const handleModalClose = () => {
    setShowAddExercise(false);
  };

  return (
    <>
      <AppHeader
        showBackButton={false}
        appHeaderTitle={workoutName || 'Active Workout'}
        subhead={true}
        subheadText={selectedProgram?.program_name || 'Tracking unscheduled exercises'}
        search={false}
        showActionBar={true}
        actionBarText="Add exercise"
        onAction={() => setShowAddExercise(true)}
        data-component="active_workout_header"
      />
      <CardWrapper>
        <div className="w-full flex flex-col gap-4 p-4">
          {exercises.map(ex => (
            <ActiveExerciseCard
              key={ex.id}
              exerciseId={ex.exercise_id}
              exerciseName={ex.name}
              default_view={true}
              initialSetConfigs={ex.setConfigs}
              onSetComplete={(setDataArg) => handleSetComplete(ex.exercise_id, setDataArg)}
              setData={setsData[ex.exercise_id] || []}
              onSetDataChange={handleSetDataChange}
              data-component="ActiveExerciseCard"
              isUnscheduled={ex.isUnscheduled}
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

      {showAddExercise && (
        <Sheet open={showAddExercise} onOpenChange={handleModalClose}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a new exercise</SheetTitle>
              <SheetDescription>
                Fill out the form below to add a new exercise to your workout.
              </SheetDescription>
            </SheetHeader>
            <AddNewExerciseForm
              key="add-new"
              formPrompt="Add a new exercise"
              onActionIconClick={handleAddExercise}
              initialSets={3}
              initialSetConfigs={Array.from({ length: 3 }, () => ({
                reps: 10,
                weight: 0,
                unit: 'kg'
              }))}
            />
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

ActiveWorkout.propTypes = {
  selectedProgram: PropTypes.shape({
    id: PropTypes.string.isRequired,
    program_name: PropTypes.string.isRequired,
  }),
  onEnd: PropTypes.func.isRequired,
  exercises: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    exercise_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    setConfigs: PropTypes.arrayOf(PropTypes.shape({
      reps: PropTypes.number.isRequired,
      weight: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
    })).isRequired,
  })),
  onExercisesChange: PropTypes.func,
};

export default ActiveWorkout; 