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
  const [search, setSearch] = useState("");
  const { setNavBarVisible } = useNavBarVisibility();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const { startWorkout } = useActiveWorkout();

  // Add debug logging
  useEffect(() => {
    console.log('Auth state:', { user, session });
  }, [user, session]);

  // Fetch programs and their exercises on mount
  useEffect(() => {
    async function fetchPrograms() {
      if (!user) {
        console.log('No user found, skipping fetch');
        return;
      }
      console.log('Fetching programs for user:', user.id);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('programs')
          .select(`
            id,
            program_name,
            program_exercises (
              exercise_id,
              exercises ( name )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching programs:', error);
          setPrograms([]);
        } else {
          console.log('Successfully fetched programs:', data);
          const programsWithExercises = (data || []).map(program => ({
            ...program,
            exerciseNames: (program.program_exercises || [])
              .map(pe => pe.exercises?.name)
              .filter(Boolean)
          }));
          setPrograms(programsWithExercises);
        }
      } catch (err) {
        console.error('Exception fetching programs:', err);
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPrograms();
  }, [user]);

  const handleStartWorkout = async (program) => {
    try {
      await startWorkout(program);
      navigate('/workout/active');
    } catch (error) {
      console.error(error.message);
      // Optionally, show an error message to the user
      alert(error.message);
    }
  };

  // Filter programs by search
  const filteredPrograms = programs.filter(program => {
    const q = search.toLowerCase();
    return (
      program.program_name?.toLowerCase().includes(q) ||
      (program.exerciseNames && program.exerciseNames.some(name => name.toLowerCase().includes(q)))
    );
  });

  return (
    <AppLayout
      appHeaderTitle="Start Workout"
      showActionBar={false}
      showActionIcon={false}
      showBackButton={false}
      subhead={false}
      search={true}
      searchPlaceholder="Search programs or exercises"
      searchValue={search}
      onSearchChange={setSearch}
    >
      <CardWrapper className="px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No programs found. Create a program to start a workout.
          </div>
        ) : (
          filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              programName={program.program_name}
              exerciseNames={program.exerciseNames}
              onClick={() => handleStartWorkout(program)}
            />
          ))
        )}
      </CardWrapper>
    </AppLayout>
  );
};

export default Workout; 