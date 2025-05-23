import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchPrograms() {
      setLoading(true);
      // Fetch all programs
      const { data: programsData, error } = await supabase.from('programs').select('id, name');
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
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5fa] flex flex-col">
      <AppHeader
        title="Programs"
        action_bar={
          <div className="flex h-12 items-center gap-3 px-5 py-3 w-full">
            <div className="flex-1 text-white text-base font-medium">
              Create new program
            </div>
            <div className="flex items-center h-full">
              <button className="p-0 bg-transparent border-none cursor-pointer flex items-center justify-center h-8 w-8" aria-label="Add program">
                <span className="material-icons w-6 h-6 text-white">add</span>
              </button>
            </div>
          </div>
        }
      />
      <div className="px-4 pt-6">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : programs.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No programs found.</div>
        ) : (
          programs.map(program => (
            <div
              key={program.id}
              className="bg-[#353942] text-white rounded-2xl p-8 mb-6 flex items-center justify-between cursor-pointer"
              onClick={() => navigate(`/programs/${program.id}`)}
            >
              <div>
                <div className="text-2xl font-bold">{program.name}</div>
                <div className="text-lg text-gray-300 font-normal">{program.exerciseCount} exercises</div>
              </div>
              <span className="material-icons text-2xl">edit</span>
            </div>
          ))
        )}
      </div>
      {/* Bottom nav assumed to be present elsewhere */}
    </div>
  );
};

export default Programs; 