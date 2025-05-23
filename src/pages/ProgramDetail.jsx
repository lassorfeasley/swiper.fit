import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import AppHeader from '../components/UI/AppHeader';
import NewExerciseModal from '../components/UI/NewExerciseModal';
import { MdEdit } from 'react-icons/md';

const ProgramDetail = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchExercises = async () => {
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

  useEffect(() => {
    if (programId) fetchExercises();
  }, [programId]);

  // Add new exercise handler
  const handleAddExercise = async ({ name, sets, reps, weight, unit }) => {
    // 1. Check if exercise exists
    let { data: existing, error } = await supabase
      .from('exercises')
      .select('id')
      .eq('name', name)
      .single();
    let exerciseId;
    if (existing && existing.id) {
      exerciseId = existing.id;
    } else {
      // 2. Insert new exercise
      const { data: newEx, error: insertError } = await supabase
        .from('exercises')
        .insert([{ name }])
        .select()
        .single();
      if (insertError || !newEx) {
        alert('Failed to add exercise');
        return;
      }
      exerciseId = newEx.id;
    }
    // 3. Insert into program_exercises
    const payload = {
      program_id: programId,
      exercise_id: exerciseId,
      default_sets: Number(sets),
      default_reps: Number(reps),
      default_weight: Number(weight)
    };
    console.log('Inserting into program_exercises:', payload);
    const { error: progExError } = await supabase
      .from('program_exercises')
      .insert(payload);
    if (progExError) {
      console.error('Supabase error:', progExError);
      alert('Failed to add exercise to program');
      return;
    }
    setShowModal(false);
    fetchExercises();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white pb-32">
      {/* Header */}
      <AppHeader
        property1="default"
        title={program ? program.name : ''}
        onBack={() => navigate('/programs')}
        onAdd={async () => {
          const newName = window.prompt('Enter new program name:', program?.name || '');
          if (newName && newName !== program?.name) {
            const { error } = await supabase
              .from('programs')
              .update({ name: newName })
              .eq('id', programId);
            if (!error) {
              setProgram({ ...program, name: newName });
            } else {
              alert('Failed to update program name');
            }
          }
        }}
        actionIcon={MdEdit}
      />
      {/* Exercises List */}
      <div className="flex flex-col gap-8 px-4">
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : exercises.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No exercises in this program.</div>
        ) : (
          exercises.map(ex => (
            <div
              key={ex.id}
              className="bg-[#f5f5fa] rounded-3xl p-6 flex flex-col gap-4 relative cursor-pointer hover:bg-gray-200 transition"
              onClick={() => navigate(`/exercise/${ex.exercise_id}`)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold">{ex.exercises?.name || ''}</span>
                <span className="material-icons text-2xl text-[#23262b]">open_in_full</span>
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
      <div className="fixed bottom-0 left-0 w-full bg-[#353942] text-white rounded-t-3xl px-8 py-6 flex items-center justify-between text-2xl font-bold" style={{zIndex: 50, cursor: 'pointer'}} onClick={() => setShowModal(true)}>
        <span>New exercise</span>
        <span className="material-icons text-3xl">add</span>
      </div>
      <NewExerciseModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onAdd={handleAddExercise}
      />
    </div>
  );
};

export default ProgramDetail; 