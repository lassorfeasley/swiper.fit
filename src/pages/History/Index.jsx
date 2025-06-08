// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=61-389&t=YBjXtsLhxGedobad-4


import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import AppHeader from '../../components/layout/AppHeader';
import MainContainer from '../../components/common/MainContainer';
import CardWrapper from '../../components/common/CardsAndTiles/Cards/CardWrapper';
import WorkoutTile from '../../components/common/CardsAndTiles/Tiles/Library/WorkoutTile';
import TileWrapper from '../../components/common/CardsAndTiles/Tiles/TileWrapper';
import { useAuth } from "@/contexts/AuthContext";

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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!user) {
        setWorkouts([]);
        setLoading(false);
        return;
      }
      // Fetch workouts with program information and sets in a single query
      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs(program_name),
          sets(id, exercise_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
        setLoading(false);
        return;
      }

      // Process the data
      const processedWorkouts = (workoutsData || []).map(workout => ({
        ...workout,
        exerciseCount: new Set(workout.sets?.map(set => set.exercise_id) || []).size
      }));

      setWorkouts(processedWorkouts);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-col h-screen">
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
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : (
          <TileWrapper>
            {workouts.map(w => (
              <WorkoutTile
                key={w.id}
                workoutName={w.workout_name || 'Unnamed Workout'}
                programName={w.programs?.program_name || ''}
                exerciseCount={w.exerciseCount}
                duration={formatDuration(w.duration_seconds)}
                onClick={() => navigate(`/history/${w.id}`)}
                className="hover:bg-gray-200 transition-colors"
              />
            ))}
          </TileWrapper>
        )}
      </div>
    </div>
  );
};

export default History; 