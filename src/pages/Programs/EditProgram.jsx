// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1917&t=iSeOx5vBGiOUayMu-4



import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AppHeader from '../../components/layout/AppHeader';
import { PageNameContext } from "../../App";
import CardWrapper from '../../components/common/CardsAndTiles/Cards/CardWrapper';
import MetricPill from '../../components/common/CardsAndTiles/MetricPill';

const EditProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setPageName } = useContext(PageNameContext);

  // Placeholder handlers
  const openProgramNameEdit = () => {
    alert('Edit program name (not implemented)');
  };
  const openSetEdit = (exercise) => {
    alert(`Edit set for exercise: ${exercise.exercises?.name || ''}`);
  };

  useEffect(() => {
    setPageName('EditProgram');
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
        .select(`
          id, 
          exercise_id, 
          exercises(name),
          program_sets(id, reps, weight, weight_unit, set_order)
        `)
        .eq('program_id', programId)
        .order('id', { ascending: true });

      // Process the exercises to include set configurations
      const processedExercises = (progExs || []).map(ex => ({
        ...ex,
        setConfigs: (ex.program_sets || [])
          .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
          .map(set => ({
            reps: set.reps,
            weight: set.weight,
            unit: set.weight_unit || 'lbs'
          }))
      }));
      
      setExercises(processedExercises);
      setLoading(false);
    };
    if (programId) fetchData();
  }, [programId, setPageName]);

  return (
    <>
      <AppHeader
        appHeaderTitle={program ? program.name : ''}
        showBackButton={true}
        showActionBar={false}
        showActionIcon={false}
        subhead={false}
        search={false}
        onBack={() => navigate('/programs')}
      />
      <div style={{ height: 140 }} />
      <CardWrapper>
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
                  <MetricPill value={ex.setConfigs?.length || 0} unit="Sets" onClick={() => openSetEdit(ex)} showAllValues={true} />
                  <MetricPill values={ex.setConfigs?.map(cfg => cfg.reps)} unit="Reps" onClick={() => openSetEdit(ex)} showAllValues={true} />
                  <MetricPill values={ex.setConfigs?.map(cfg => cfg.weight)} unit={ex.setConfigs?.[0]?.unit?.toUpperCase() || "LBS"} onClick={() => openSetEdit(ex)} showAllValues={true} />
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
      </CardWrapper>
    </>
  );
};

export default EditProgram; 