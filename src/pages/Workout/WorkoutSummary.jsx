import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useNavigate } from 'react-router-dom';

const WorkoutSummary = () => {
  const navigate = useNavigate();
  const { workoutSummaryData, clearSummaryAndReset } = useActiveWorkout();
  const { workoutData, exercises } = workoutSummaryData || {};

  // Group sets by exercise_id, but only include exercises that have valid sets
  const setsByExercise = {};
  (exercises || []).forEach(ex => {
    if (!setsByExercise[ex.exercise_id]) {
      setsByExercise[ex.exercise_id] = [];
    }
    (ex.setConfigs || []).forEach(set => {
      // Only add sets that are marked complete and have valid reps and weight
      if (
        set.status === 'complete' &&
        typeof set.reps === 'number' && !isNaN(set.reps) && set.reps > 0 &&
        typeof set.weight === 'number' && !isNaN(set.weight) && set.weight >= 0
      ) {
        setsByExercise[ex.exercise_id].push({ ...set, unit: set.unit });
      }
    });
  });

  // Filter out exercises that have no valid sets
  const exercisesWithSets = Object.entries(setsByExercise).filter(([_, sets]) => sets.length > 0);

  const handleDone = () => {
    clearSummaryAndReset();
    navigate('/history', { replace: true });
  };

  return (
    <AppLayout
      appHeaderTitle={workoutData?.workout_name || 'Workout Summary'}
      subhead={true}
      subheadText={workoutData?.program_name || 'Workout Complete'}
      showBackButton={true}
      showActionBar={true}
      actionBarText="Done"
      onAction={handleDone}
      onBack={handleDone}
      showActionIcon={false}
      search={false}
    >
      {!workoutData || !exercises ? (
        <div className="p-6">Loading...</div>
      ) : (
        <CardWrapper>
          {exercisesWithSets.map(([exId, exerciseSets]) => {
            const exercise = (exercises || []).find(e => e.exercise_id === exId);
            return (
              <ExerciseCard
                key={exId}
                mode="completed"
                exerciseName={exercise?.name || '[Exercise name]'}
                setConfigs={exerciseSets}
                className="mb-4"
              />
            );
          })}
        </CardWrapper>
      )}
    </AppLayout>
  );
};

export default WorkoutSummary; 