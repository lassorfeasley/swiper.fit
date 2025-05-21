import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SetCard from './UI/SetCard';

export default function ProgramView() {
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [exerciseCards, setExerciseCards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all programs on mount
  useEffect(() => {
    async function fetchPrograms() {
      setLoading(true);
      const { data, error } = await supabase.from('programs').select('*');
      if (!error) {
        setPrograms(data);
        if (data.length > 0) setSelectedProgramId(data[0].id);
      }
      setLoading(false);
    }
    fetchPrograms();
  }, []);

  // Fetch exercises for the selected program, join with exercise names
  useEffect(() => {
    if (!selectedProgramId) return;
    async function fetchExerciseCards() {
      setLoading(true);
      // Get all program_exercises for the selected program
      const { data: progExs, error: progExsError } = await supabase
        .from('program_exercises')
        .select('*')
        .eq('program_id', selectedProgramId);
      if (progExsError || !progExs) {
        setExerciseCards([]);
        setLoading(false);
        return;
      }
      // Get all exercises referenced
      const exerciseIds = progExs.map(pe => pe.exercise_id);
      const { data: exercises, error: exercisesError } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', exerciseIds);
      if (exercisesError || !exercises) {
        setExerciseCards([]);
        setLoading(false);
        return;
      }
      // Map exercise_id to name
      const exerciseMap = Object.fromEntries(exercises.map(e => [e.id, e.name]));
      // Compose cards
      const cards = progExs.map(pe => ({
        id: pe.id,
        name: exerciseMap[pe.exercise_id] || 'Unknown Exercise',
        default_sets: pe.default_sets,
        default_reps: pe.default_reps,
        default_weight: pe.default_weight
      }));
      setExerciseCards(cards);
      setLoading(false);
    }
    fetchExerciseCards();
  }, [selectedProgramId]);

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Program View</h2>
      {loading && <div>Loading...</div>}
      <div className="mb-4">
        <label htmlFor="program-select" className="mr-2 font-semibold">Select Program:</label>
        <select
          id="program-select"
          value={selectedProgramId || ''}
          onChange={e => setSelectedProgramId(e.target.value)}
          className="border rounded p-2"
        >
          {programs.map(program => (
            <option key={program.id} value={program.id}>{program.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-4">
        {exerciseCards.map(card => (
          <SetCard
            key={card.id}
            exerciseName={card.name}
            default_view={true}
            defaultSets={card.default_sets}
            defaultReps={card.default_reps}
            defaultWeight={card.default_weight}
          />
        ))}
      </div>
    </div>
  );
} 