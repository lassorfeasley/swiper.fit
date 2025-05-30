// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=48-601&t=YBjXtsLhxGedobad-4


import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { PageNameContext } from '../App';
import CardWrapper from '../components/layout/CardWrapper';
import ProgramCard from '../components/common/CardsAndTiles/ProgramCard';

const Programs = () => {
  const { setPageName } = useContext(PageNameContext);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setPageName('Programs');
    async function fetchPrograms() {
      setLoading(true);
      // Fetch all programs
      const { data: programsData, error } = await supabase.from('programs').select('id, program_name, created_at').order('created_at', { ascending: false });
      if (error) {
        setPrograms([]);
        setLoading(false);
        return;
      }
      // For each program, fetch the number of exercises
      const programsWithCounts = await Promise.all(
        (programsData || []).map(async (program) => {
          const { count, error: countError } = await supabase
            .from('program_exercises')
            .select('id', { count: 'exact', head: true })
            .eq('program_id', program.id);
          return {
            ...program,
            exerciseCount: countError ? 0 : count,
            editable: true, // You can add logic for editability if needed
          };
        })
      );
      setPrograms(programsWithCounts);
      setLoading(false);
    }
    fetchPrograms();
  }, [setPageName]);

  return (
    <>
      <AppHeader
        appHeaderTitle="Programs"
        actionBarText="Create new program"
        showActionBar={true}
        showActionIcon={true}
        showBackButton={false}
        subhead={false}
        search={true}
        searchPlaceholder="Search programs"
        onAction={() => navigate('/create_new_program')}
        data-component="AppHeader"
      />
      <div style={{ height: 140 }} />
      <CardWrapper>
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          <div className="w-full flex flex-col">
            {loading ? (
              <div className="text-gray-400 text-center py-8">Loading...</div>
            ) : programs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No programs found.</div>
            ) : (
              programs.map(program => (
                <ProgramCard
                  key={program.id}
                  programName={program.program_name}
                  exerciseCount={program.exerciseCount}
                  onClick={() => navigate(`/programs/${program.id}/configure`)}
                />
              ))
            )}
          </div>
        </div>
      </CardWrapper>
    </>
  );
};

export default Programs; 