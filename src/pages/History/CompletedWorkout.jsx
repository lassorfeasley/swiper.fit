// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=61-360&t=YBjXtsLhxGedobad-4

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AppHeader from '@/components/layout/AppHeader';
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
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
        .select('id, exercise_id, reps, weight, order')
        .eq('workout_id', workoutId)
        .order('order', { ascending: true });
      setSets(setsData || []);
      // Get unique exercise_ids
      const exerciseIds = [...new Set((setsData || []).map(s => s.exercise_id))];
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

  // Group sets by exercise_id
  const setsByExercise = {};
  sets.forEach(set => {
    if (!setsByExercise[set.exercise_id]) setsByExercise[set.exercise_id] = [];
    setsByExercise[set.exercise_id].push(set);
  });

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
          {Object.keys(setsByExercise).map(exId => (
            <ExerciseCard
              key={exId}
              mode="completed"
              exerciseName={exercises[exId] || '[Exercise name]'}
              sets={setsByExercise[exId].length}
              reps={setsByExercise[exId][0]?.reps || 0}
              weight={setsByExercise[exId][0]?.weight || 0}
              unit={setsByExercise[exId][0]?.unit || 'lbs'}
            />
          ))}
        </CardWrapper>
      )}
    </>
  );
};

export default CompletedWorkout; 