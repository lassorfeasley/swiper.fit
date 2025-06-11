// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/SwiperFit?node-id=49-317

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import { useActiveWorkout } from '@/contexts/ActiveWorkoutContext';
import PageHeader from '@/components/layout/PageHeader';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ProgramCard from '@/components/common/Cards/ProgramCard';
import ActiveWorkout from './ActiveWorkout';
import AppLayout from '@/components/layout/AppLayout';

const Workout = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const { setNavBarVisible } = useNavBarVisibility();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { startWorkout } = useActiveWorkout();

  // Fetch programs on mount
  useEffect(() => {
    async function fetchPrograms() {
      if (!user) return;
      
      setLoading(true);
      const { data, error } = await supabase
        .from('programs')
        .select('id, program_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching programs:', error);
        setPrograms([]);
      } else {
        setPrograms(data || []);
      }
      setLoading(false);
    }

    fetchPrograms();
  }, [user]);

  const handleStartWorkout = (program) => {
    const workoutData = {
      programId: program.id,
      name: program.program_name,
      startTime: new Date().toISOString(),
    };
    
    startWorkout(workoutData);
    navigate('/workout/active');
  };

  return (
    <AppLayout
      appHeaderTitle="Start Workout"
      showActionBar={false}
      showActionIcon={false}
      showBackButton={false}
      subhead={false}
      search={false}
    >
      <CardWrapper className="px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : programs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No programs found. Create a program to start a workout.
          </div>
        ) : (
          programs.map((program) => (
            <ProgramCard
              key={program.id}
              programName={program.program_name}
              onClick={() => handleStartWorkout(program)}
            />
          ))
        )}
      </CardWrapper>
    </AppLayout>
  );
};

export default Workout; 