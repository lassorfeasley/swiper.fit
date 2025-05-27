import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/layout/AppHeader';

const EditProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Placeholder handlers
  const openProgramNameEdit = () => {
    alert('Edit program name (not implemented)');
  };
  const openSetEdit = (exercise) => {
    alert(`Edit set for exercise: ${exercise.exercises?.name || ''}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Fetch program name
      const { data: programData } = await supabase
        .from('programs')
        .select('id, name')
        .eq('id', programId)
        .single();
      setProgram(programData);
      // Fetch exercises in this program (join with exercises)
      const { data: progExs } = await supabase
        .from('program_exercises')
        .select('id, exercise_id, default_sets, default_reps, default_weight, exercises(name)')
        .eq('program_id', programId)
        .order('id', { ascending: true });
      setExercises(progExs || []);
      setLoading(false);
    };
    if (programId) fetchData();
  }, [programId]);

  return (
    <div className="min-h-screen flex flex-col bg-white pb-32">
      {/* AppHeader with back button */}
      <AppHeader
        appHeaderTitle={program ? program.name : ''}
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={false}
        search={false}
        onBack={() => navigate('/programs')}
      />
      {/* Exercises List */}
      <div className="flex flex-col gap-8 px-4 pt-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : exercises.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No exercises in this program.</div>
        ) : (
          exercises.map(ex => (
            <div
              key={ex.id}
              className="bg-[#f5f5fa] rounded-3xl p-6 flex flex-col gap-4 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{ex.exercises?.name || ''}</span>
                <span
                  className="material-icons text-2xl text-[#23262b] cursor-pointer"
                  onClick={() => openSetEdit(ex)}
                >
                  edit
                </span>
              </div>
              <div className="flex gap-4">
                <div className="bg-white rounded-lg px-4 py-2 text-lg font-bold flex items-center gap-1">
                  <span>{ex.default_sets}</span>
                  <span className="text-xs font-normal ml-1">Sets</span>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 text-lg font-bold flex items-center gap-1">
                  <span>{ex.default_reps}</span>
                  <span className="text-xs font-normal ml-1">Reps</span>
                </div>
                <div className="bg-white rounded-lg px-4 py-2 text-lg font-bold flex items-center gap-1">
                  <span>{ex.default_weight}</span>
                  <span className="text-xs font-normal ml-1">Lbs</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 w-full bg-[#353942] text-white rounded-t-3xl px-8 py-6 flex items-center justify-between text-2xl font-bold" style={{zIndex: 50}}>
        <span>New exercise</span>
        <span className="material-icons text-3xl">add</span>
      </div>
    </div>
  );
};

export default EditProgram; 