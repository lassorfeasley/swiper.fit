import React, { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';

const WorkoutSummary = () => {
  const navigate = useNavigate();
  const { workoutSummaryData, clearSummaryAndReset } = useActiveWorkout();
  const { workoutData, exercises } = workoutSummaryData || {};
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

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

  const saveWorkout = async () => {
    console.log("Attempting to save workout...");
    console.log("User:", user);
    console.log("Workout Data:", workoutData);
    console.log("Exercises:", exercises);

    if (!user || !workoutData || !exercises) {
      console.error("Save workout aborted: missing user, workoutData, or exercises.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // First, create the workout record
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: user.id,
          program_id: workoutData.programId,
          workout_name: workoutData.name,
          duration_seconds: workoutData.duration_seconds,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (workoutError || !workout) {
        console.error('Supabase workout insert error:', workoutError);
        throw new Error('Failed to save workout');
      }

      // Then, create all the sets for this workout
      const setRows = [];
      exercisesWithSets.forEach(([exerciseId, sets]) => {
        sets.forEach((set, idx) => {
          setRows.push({
            workout_id: workout.id,
            exercise_id: exerciseId,
            reps: set.reps,
            weight: set.weight,
            weight_unit: set.unit,
            order: idx + 1
          });
        });
      });

      if (setRows.length > 0) {
        const { error: setsError } = await supabase
          .from('sets')
          .insert(setRows);

        if (setsError) {
          console.error('Supabase sets insert error:', setsError);
          throw new Error('Failed to save workout sets');
        }
      }

      // Only clear context and navigate after successful save
      clearSummaryAndReset();
      navigate('/history', { replace: true });
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveError('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDone = () => {
    console.log("handleDone clicked");
    if (!isSaving) {
      saveWorkout();
    }
  };

  return (
    <AppLayout
      appHeaderTitle={workoutData?.workout_name || 'Workout Summary'}
      subhead={true}
      subheadText={workoutData?.program_name || 'Workout Complete'}
      showBackButton={true}
      showActionBar={true}
      actionBarText={isSaving ? "Saving..." : "Done"}
      onAction={handleDone}
      onBack={handleDone}
      showActionIcon={false}
      search={false}
    >
      {!workoutData || !exercises ? (
        <div className="p-6">Loading...</div>
      ) : (
        <>
          {saveError && (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
              {saveError}
              <button 
                onClick={saveWorkout}
                className="ml-2 underline hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          )}
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
        </>
      )}
    </AppLayout>
  );
};

export default WorkoutSummary; 