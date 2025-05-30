// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=61-389&t=YBjXtsLhxGedobad-4


import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { generateWorkoutName } from '../utils/generateWorkoutName';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import MainContainer from '../components/common/MainContainer';
import CardWrapper from '../components/layout/CardWrapper';
import WorkoutTile from '../components/common/CardsAndTiles/Tiles/Library/WorkoutTile';
import TileWrapper from '../components/common/CardsAndTiles/Tiles/TileWrapper';

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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch workouts with program information
      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs(program_name)
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
          w.programs?.program_name || '',
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
      <AppHeader
        appHeaderTitle="Workout history"
        showActionBar={false}
        showActionIcon={false}
        showBackButton={false}
        subhead={false}
        search={true}
        searchPlaceholder="Search"
        data-component="AppHeader"
      />
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <>
          {/* Spacer to offset fixed AppHeader */}
          <div style={{ height: '140px' }} />
          <TileWrapper>
            {workouts.map(w => (
              <WorkoutTile
                key={w.id}
                workoutName={names[w.id] || 'Unnamed Workout'}
                programName={w.programs?.program_name || ''}
                exerciseCount={exerciseCounts[w.id] ? exerciseCounts[w.id].size : 0}
                duration={formatDuration(w.duration_seconds)}
                onClick={() => navigate(`/history/${w.id}`)}
                className="hover:bg-gray-200 transition-colors"
              />
            ))}
          </TileWrapper>
        </>
      )}
    </>
  );
};

export default History; 