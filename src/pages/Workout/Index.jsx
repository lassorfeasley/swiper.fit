// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=49-317&t=YBjXtsLhxGedobad-4

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import AppHeader from '@/components/layout/AppHeader';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ProgramCard from '@/components/common/Cards/ProgramCard';
import ActiveWorkout from './ActiveWorkout';

const Workout = () => {
  const [step, setStep] = useState('select'); // 'select' or 'active'
  const [programs, setPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const navigate = useNavigate();
  const { user } = useAuth();

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
        if (!user) {
          setPrograms([]);
          setLoading(false);
          return;
        }
        const { data: programsData, error } = await supabase
          .from('programs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
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
  }, [step, user]);

  // Handle program selection
  const handleProgramSelect = (program) => {
    setSelectedProgram(program);
    setStep('active');
  };

  // Handle workout end
  const handleWorkoutEnd = async (workoutData) => {
    try {
      const { duration_seconds, workout_name, setsData, completedSets } = workoutData;
      
      // First, validate that we have sets to save
      const allSets = Object.entries(setsData).flatMap(([exerciseId, exerciseSets]) => 
        (exerciseSets || [])
          .filter(set => {
            // Only include sets that are marked as complete
            const isComplete = completedSets[exerciseId]?.some(
              completedSet => completedSet.setId === set.id && completedSet.status === 'complete'
            );
            return isComplete && set.reps && set.weight !== undefined;
          })
          .map((set, idx) => ({
            exercise_id: exerciseId,
            reps: set.reps,
            weight: set.weight,
            weight_unit: set.unit,
            order: idx + 1
          }))
      );

      if (allSets.length === 0) {
        alert('You must log at least one set to complete a workout.');
        return;
      }

      // Create the workout first
      const workoutInsertData = {
        duration_seconds,
        completed_at: new Date().toISOString(),
        user_id: user.id,
        workout_name,
        program_id: selectedProgram?.id
      };

      const { data: workoutInsert, error: workoutError } = await supabase
        .from('workouts')
        .insert([workoutInsertData])
        .select()
        .single();

      if (workoutError || !workoutInsert) {
        console.error('Workout insert error:', { error: workoutError, payload: workoutInsertData });
        alert('Failed to save workout! ' + (workoutError?.message || ''));
        return;
      }

      // Now create the sets with the workout ID
      const setRows = allSets.map(set => ({
        ...set,
        workout_id: workoutInsert.id,
        weight_unit: set.unit || null
      }));

      const { error: setsError } = await supabase.from('sets').insert(setRows);
      if (setsError) {
        console.error('Sets insert error:', setsError, setRows);
        alert('Failed to save sets! ' + (setsError?.message || ''));
        return;
      }

      // Reset state and navigate
      navigate(`/history/${workoutInsert.id}`);
      setStep('select');
      setSelectedProgram(null);
      setExercises([]);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('An unexpected error occurred while saving your workout. Please try again.');
    }
  };

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
          <CardWrapper>
            {loading ? (
              <div className="p-6">Loading...</div>
            ) : (
              programs.map(program => (
                <ProgramCard
                  key={program.id}
                  programName={program.program_name}
                  exerciseCount={program.exerciseCount}
                  onClick={() => handleProgramSelect(program)}
                />
              ))
            )}
          </CardWrapper>
        </>
      ) : (
        <ActiveWorkout
          selectedProgram={selectedProgram}
          exercises={exercises}
          onExercisesChange={setExercises}
          onEnd={handleWorkoutEnd}
        />
      )}
    </div>
  );
};

export default Workout; 