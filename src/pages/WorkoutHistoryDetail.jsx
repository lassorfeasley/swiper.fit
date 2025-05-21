import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { generateWorkoutName } from '../utils/generateWorkoutName';

const userId = 'bed5cb48-0242-4894-b58d-94ac01de22ff'; // Replace with dynamic user id if needed

const WorkoutHistoryDetail = () => {
  const { workoutId } = useParams();
  const [workout, setWorkout] = useState(null);
  const [sets, setSets] = useState([]);
  const [exercises, setExercises] = useState({});
  const [workoutName, setWorkoutName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch workout
      const { data: workoutData } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
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
      // Generate workout name
      if (workoutData) {
        setWorkoutName(await generateWorkoutName(
          new Date(workoutData.created_at),
          '', // You can fetch program name if needed
          userId,
          supabase
        ));
      }
      setLoading(false);
    };
    if (workoutId) fetchData();
  }, [workoutId]);

  // Group sets by exercise_id
  const setsByExercise = {};
  sets.forEach(set => {
    if (!setsByExercise[set.exercise_id]) setsByExercise[set.exercise_id] = [];
    setsByExercise[set.exercise_id].push(set);
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 pb-32">
      <div className="p-6 text-2xl font-bold text-white">{workoutName}</div>
      {loading ? (
        <div className="p-6 text-white">Loading...</div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 p-4">
          {Object.keys(setsByExercise).map(exId => (
            <div key={exId} className="bg-[#23262b] text-white rounded-2xl p-4 mb-2">
              <div className="text-lg font-bold mb-2 flex items-center justify-between">
                <span>[{exercises[exId] || 'Exercise'}]</span>
                <span className="material-icons">open_in_full</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {setsByExercise[exId].map((set, idx) => (
                  <div key={set.id} className="bg-white text-black rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
                    <span>{set.reps} Reps</span>
                    <span>{set.weight} Lbs</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistoryDetail; 