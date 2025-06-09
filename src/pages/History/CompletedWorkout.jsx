// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=61-360&t=YBjXtsLhxGedobad-4

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AppHeader from '@/components/layout/AppHeader';
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import SetPill from '@/components/ui/SetPill';
import { useAuth } from "@/contexts/AuthContext";

const CompletedWorkout = () => {
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
        setWorkout(null);
        setSets([]);
        setExercises({});
        setLoading(false);
        return;
      }
      // Fetch workout with program information
      const { data: workoutData } = await supabase
        .from('workouts')
        .select(`
          *,
          programs(program_name)
        `)
        .eq('id', workoutId)
        .eq('user_id', user.id)
        .single();
      setWorkout(workoutData);
      
      // Fetch sets for this workout
      const { data: setsData } = await supabase
        .from('sets')
        .select('id, exercise_id, reps, weight, weight_unit, order')
        .eq('workout_id', workoutId)
        .order('order', { ascending: true });
      
      // Only keep sets that have reps and weight logged and are valid numbers
      const validSets = (setsData || []).filter(set => 
        typeof set.reps === 'number' && !isNaN(set.reps) && set.reps > 0 &&
        typeof set.weight === 'number' && !isNaN(set.weight) && set.weight >= 0 &&
        set.weight_unit // Ensure we have a unit
      ).map(set => ({
        ...set,
        unit: set.weight_unit // Map weight_unit to unit for compatibility with existing components
      }));
      setSets(validSets);

      // Get unique exercise_ids from valid sets only
      const exerciseIds = [...new Set(validSets.map(s => s.exercise_id))];
      
      // Fetch exercise names
      let exercisesObj = {};
      if (exerciseIds.length > 0) {
        const { data: exercisesData } = await supabase
          .from('exercises')
          .select('id, name')
          .in('id', exerciseIds);
        (exercisesData || []).forEach(e => {
          exercisesObj[e.id] = e.name;
        });
      }
      setExercises(exercisesObj);
      setLoading(false);
    };
    if (workoutId) fetchData();
  }, [workoutId, user]);

  // Group sets by exercise_id, but only include exercises that have valid sets
  const setsByExercise = {};
  sets.forEach(set => {
    if (!setsByExercise[set.exercise_id]) {
      setsByExercise[set.exercise_id] = [];
    }
    // Only add sets that have valid reps and weight
    if (typeof set.reps === 'number' && !isNaN(set.reps) && set.reps > 0 &&
        typeof set.weight === 'number' && !isNaN(set.weight) && set.weight >= 0) {
      setsByExercise[set.exercise_id].push(set);
    }
  });

  // Filter out exercises that have no valid sets
  const exercisesWithSets = Object.entries(setsByExercise).filter(([_, sets]) => sets.length > 0);

  return (
    <>
      <AppHeader
        showBackButton={true}
        appHeaderTitle={workout?.workout_name}
        subhead={true}
        subheadText={workout?.programs?.program_name}
        search={false}
        showActionBar={false}
        showActionIcon={false}
      />
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <CardWrapper>
          {exercisesWithSets.map(([exId, exerciseSets]) => (
            <div key={exId} className="mb-4">
              <ExerciseCard
                mode="completed"
                exerciseName={exercises[exId] || '[Exercise name]'}
                sets={exerciseSets.length}
                reps={exerciseSets[0]?.reps || 0}
                weight={exerciseSets[0]?.weight || 0}
                unit={exerciseSets[0]?.unit || 'lbs'}
              />
              <div className="flex flex-wrap gap-2 mt-2 px-3">
                {exerciseSets.map((set, idx) => (
                  <SetPill
                    key={set.id}
                    reps={set.reps}
                    weight={set.weight}
                    unit={set.unit || 'lbs'}
                    complete={true}
                  />
                ))}
              </div>
            </div>
          ))}
        </CardWrapper>
      )}
    </>
  );
};

export default CompletedWorkout; 