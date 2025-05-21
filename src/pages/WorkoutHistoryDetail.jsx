import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
    <div className="min-h-screen w-full bg-[#23262b] pb-32">
      {/* Header with back arrow and workout name, full width, no margin */}
      <div className="w-full flex items-center p-6 bg-white shadow-sm sticky top-0 z-10" style={{margin: 0, borderRadius: 0}}>
        <Link to="/history" className="mr-4 text-black text-3xl font-bold">←</Link>
        <span className="text-2xl font-bold text-black">{workoutName}</span>
      </div>
      {loading ? (
        <div className="p-6 text-white">Loading...</div>
      ) : (
        <div className="flex-1 flex flex-col gap-6 p-4" style={{margin: 0}}>
          {Object.keys(setsByExercise).map(exId => (
            <div key={exId} className="bg-white rounded-2xl p-6 flex flex-col shadow-md mb-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-bold text-black">{exercises[exId] || 'Exercise name'}</span>
                <span className="material-icons text-2xl text-black">open_in_full</span>
              </div>
              <div className="flex gap-4">
                {/* Sets pill */}
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex flex-col items-center min-w-[60px]">
                  <span className="text-xl font-bold text-black">{setsByExercise[exId].length}</span>
                  <span className="text-xs text-gray-500">Sets</span>
                </div>
                {/* Reps pill (show reps of first set) */}
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex flex-col items-center min-w-[60px]">
                  <span className="text-xl font-bold text-black">{setsByExercise[exId][0]?.reps}</span>
                  <span className="text-xs text-gray-500">Reps</span>
                </div>
                {/* Lbs pill (show weight of first set) */}
                <div className="bg-gray-100 rounded-lg px-4 py-2 flex flex-col items-center min-w-[60px]">
                  <span className="text-xl font-bold text-black">{setsByExercise[exId][0]?.weight}</span>
                  <span className="text-xs text-gray-500">Lbs</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistoryDetail; 