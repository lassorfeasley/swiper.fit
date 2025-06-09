import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import AppHeader from '@/components/layout/AppHeader';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ActiveExerciseCard from '@/components/common/Cards/ActiveExerciseCard';
import ActiveFocusedNavBar from '@/components/layout/ActiveFocusedNavBar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import NumericInput from '@/components/ui/numeric-input';
import WeightCompoundField from '@/components/common/forms/compound-fields/WeightCompoundField';
import Icon from '@/components/common/Icon';
import AddNewExerciseForm from '@/components/common/forms/compound-fields/AddNewExerciseForm';

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
        <div className="flex flex-col gap-4 p-4">
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