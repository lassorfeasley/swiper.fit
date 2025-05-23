import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateWorkoutName } from '../utils/generateWorkoutName';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MainContainer from '../components/common/MainContainer';

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
      // Fetch workouts with program information
      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      setWorkouts(workoutsData || []);

      // Fetch all sets for these workouts
      const workoutIds = (workoutsData || []).map(w => w.id);
      const { data: setsData } = await supabase
        .from('sets')
        .select('id, workout_id, exercise_id')
        .in('workout_id', workoutIds);
      setSets(setsData || []);

      // Generate names for all workouts using the naming convention
      const namesObj = {};
      for (const w of workoutsData || []) {
        namesObj[w.id] = await generateWorkoutName(
          new Date(w.created_at),
          w.programs?.name || '',
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
    <>
      <AppHeader property1="no-action-no-back" title="Workout History" />
      <MainContainer>
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {workouts.map(w => (
              <Link to={`/history/${w.id}`} key={w.id} className="bg-white rounded-2xl p-6 flex flex-col shadow-md hover:bg-gray-200 transition-colors">
                <div className="text-xl font-bold">
                  {names[w.id] || 'Unnamed Workout'}
                </div>
                <div className="text-gray-600 mt-1">
                  {new Date(w.created_at).toLocaleString()}
                </div>
                <div className="text-gray-800 mt-1">
                  {exerciseCounts[w.id] ? exerciseCounts[w.id].size : 0} exercises
                </div>
                <div className="text-gray-800 mt-1">
                  Duration: {formatDuration(w.duration_seconds)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </MainContainer>
    </>
  );
};

export default History; 