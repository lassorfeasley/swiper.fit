// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=61-360

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import AppLayout from '@/components/layout/AppLayout';
import ExerciseCard from '@/components/common/Cards/ExerciseCard';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import { useAuth } from "@/contexts/AuthContext";

const CompletedWorkout = () => {
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [exercises, setExercises] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
        typeof set.weight === 'number' && !isNaN(set.weight) && set.weight >= 0
      ).map(set => ({
        ...set,
        unit: set.weight_unit // Do not default to 'lbs', allow undefined/null
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

  // Filter exercises based on search
  const filteredExercisesWithSets = exercisesWithSets.filter(([exId, sets]) => {
    const exerciseName = exercises[exId] || '[Exercise name]';
    return exerciseName.toLowerCase().includes(search.toLowerCase());
  });

  const handleTitleChange = async (newTitle) => {
    try {
      const { error } = await supabase
        .from("workouts")
        .update({ workout_name: newTitle })
        .eq("id", workoutId)
        .eq("user_id", user.id);
      
      if (error) throw error;
      setWorkout(prev => ({ ...prev, workout_name: newTitle }));
    } catch (err) {
      alert("Failed to update workout name: " + err.message);
    }
  };

  const handleDeleteWorkout = async () => {
    if (!confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Manually delete associated sets first
      const { error: setsError } = await supabase
        .from("sets")
        .delete()
        .eq("workout_id", workoutId);

      if (setsError) {
        throw new Error("Failed to delete associated sets: " + setsError.message);
      }
      
      // Then, delete the workout
      const { error: workoutError } = await supabase
        .from("workouts")
        .delete()
        .eq("id", workoutId)
        .eq("user_id", user.id);
      
      if (workoutError) {
        throw new Error("Failed to delete workout: " + workoutError.message);
      }
      
      // Navigate back to history
      window.history.back();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <AppLayout
      appHeaderTitle={workout?.workout_name}
      pageNameEditable={true}
      showBackButton={true}
      showAddButton={false}
      onTitleChange={handleTitleChange}
      onDelete={handleDeleteWorkout}
      showDeleteOption={true}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      pageContext="workout"
    >
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <CardWrapper className="px-4">
          {filteredExercisesWithSets.map(([exId, exerciseSets]) => (
            <div key={exId} className="w-full">
              <ExerciseCard
                mode="completed"
                exerciseName={exercises[exId] || '[Exercise name]'}
                setConfigs={exerciseSets}
              />
            </div>
          ))}
        </CardWrapper>
      )}
    </AppLayout>
  );
};

export default CompletedWorkout; 