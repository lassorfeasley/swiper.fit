import React, { useEffect, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { PageNameContext } from '../App';

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
    <div className="h-screen flex flex-col relative bg-[#f5f5fa]">
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
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="w-full flex flex-col pt-10">
          {loading ? (
            <div className="text-gray-400 text-center py-8">Loading...</div>
          ) : programs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No programs found.</div>
          ) : (
            programs.map(program => (
              <div
                key={program.id}
                className="flex flex-col items-start gap-[10px] mb-6 cursor-pointer w-full"
                style={{
                  padding: 20,
                  borderRadius: 4,
                  background: '#fff',
                }}
                onClick={() => navigate(`/programs/${program.id}/configure`)}
                data-component="ProgramCard"
              >
                <div
                  className="flex w-full justify-between items-center"
                  style={{ alignSelf: 'stretch' }}
                >
                  <h1 className="text-h1 font-h1 leading-h1 font-space text-[#353942] m-0">
                    {program.program_name}
                  </h1>
                  <span className="material-symbols-outlined text-3xl text-[#5A6B7A]">settings</span>
                </div>
                <div className="text-metric font-metric leading-metric text-[#5A6B7A]">
                  {String(program.exerciseCount).padStart(2, '0')} exercises
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Programs; 