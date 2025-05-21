import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateWorkoutName } from '../utils/generateWorkoutName';

const userId = 'bed5cb48-0242-4894-b58d-94ac01de22ff'; // Replace with dynamic user id if needed

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s]
    .map(unit => String(unit).padStart(2, '0'))
    .join(':');
}

const History = () => {
  const [workouts, setWorkouts] = useState([]);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [names, setNames] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch all workouts for the user
      const { data: workoutsData } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setWorkouts(workoutsData || []);
      // Fetch all sets for these workouts
      const workoutIds = (workoutsData || []).map(w => w.id);
      const { data: setsData } = await supabase
        .from('sets')
        .select('id, workout_id, exercise_id')
        .in('workout_id', workoutIds);
      setSets(setsData || []);
      // Generate names
      const namesObj = {};
      for (const w of workoutsData || []) {
        namesObj[w.id] = await generateWorkoutName(
          new Date(w.created_at),
          '', // You can fetch program name if needed
          userId,
          supabase
        );
      }
      setNames(namesObj);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Map workoutId to unique exercise count
  const exerciseCounts = {};
  sets.forEach(set => {
    if (!exerciseCounts[set.workout_id]) {
      exerciseCounts[set.workout_id] = new Set();
    }
    exerciseCounts[set.workout_id].add(set.exercise_id);
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="p-6 text-2xl font-bold">Workout history</div>
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <div className="flex flex-col gap-4 p-4">
          {workouts.map(w => (
            <div key={w.id} className="bg-blue-500 text-white rounded-2xl p-6 flex flex-col shadow-md">
              <div className="text-xl font-bold">{names[w.id]}</div>
              <div className="text-base mt-1">{exerciseCounts[w.id] ? exerciseCounts[w.id].size : 0} exercises</div>
              <div className="text-base mt-1">{formatDuration(w.duration_seconds)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 