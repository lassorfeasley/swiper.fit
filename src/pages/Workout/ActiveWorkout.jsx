import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ActiveExerciseCard from '@/components/common/Cards/ActiveExerciseCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Play, Home, History, Star, RotateCcw } from 'lucide-react';
import AddNewExerciseForm from '@/components/common/forms/AddNewExerciseForm';
import ResponsiveNav from '@/components/organisms/responsive-nav';
import AppLayout from '@/components/layout/AppLayout';
import { SwiperSheet } from '@/components/ui/swiper-sheet';

const navItems = [
  { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
  { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
  { to: "/history", label: "History", icon: <RotateCcw className="w-7 h-7" /> },
  { to: "/workout", label: "Workout", icon: <Play className="w-7 h-7" /> },
];

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    activeWorkout,
    isWorkoutActive,
    elapsedTime,
    isPaused,
    togglePause,
    endWorkout: contextEndWorkout,
    workoutProgress,
    updateWorkoutProgress,
    saveSet
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState("");
  const { setNavBarVisible } = useNavBarVisibility();

  useEffect(() => {
    if (!isWorkoutActive) {
      navigate('/workout', { replace: true });
    }
  }, [isWorkoutActive, navigate]);

  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  useEffect(() => {
    if (activeWorkout) {
      supabase
        .from('program_exercises')
        .select(`
          id,
          exercise_id,
          exercises(name),
          program_sets(id, reps, weight, weight_unit, set_order)
        `)
        .eq('program_id', activeWorkout.programId)
        .then(async ({ data: progExs, error }) => {
          if (error || !progExs) {
            setExercises([]);
            return;
          }
          const exerciseIds = progExs.map(pe => pe.exercise_id);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);

          if (exercisesError) {
            setExercises([]);
            return;
          }

          const cards = progExs.map(pe => ({
            id: pe.id,
            exercise_id: pe.exercise_id,
            name: (exercisesData.find(e => e.id === pe.exercise_id) || {}).name || 'Unknown',
            setConfigs: (pe.program_sets || [])
              .sort((a, b) => (a.set_order || 0) - (b.set_order || 0))
              .map(set => ({
                reps: set.reps,
                weight: set.weight,
                unit: set.weight_unit || 'lbs'
              }))
          }));
          setExercises(cards);
        });
    } else {
      setExercises([]);
    }
  }, [activeWorkout]);

  const handleSetDataChange = (exerciseId, setId, field, value) => {
    updateWorkoutProgress(exerciseId, setId, field, value);
  };

  const handleSetComplete = (exerciseId, setConfig) => {
    saveSet(exerciseId, setConfig);
  };

  const handleEndWorkout = async () => {
    try {
      await contextEndWorkout();
      navigate('/history');
    } catch (error) {
      console.error('Error ending workout:', error);
      alert('There was an error ending your workout. Please try again.');
    }
  };

  return (
    <AppLayout
      appHeaderTitle="Active Workout"
      subhead={true}
      subheadText={activeWorkout?.name || 'Workout in Progress'}
      showBackButton={false}
      showActionBar={false}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
    >
      <ResponsiveNav navItems={navItems} onEnd={handleEndWorkout} />
      <CardWrapper>
        <div className="w-full flex flex-col gap-4 p-4">
          {exercises.map(ex => (
            <ActiveExerciseCard
              key={ex.id}
              exerciseId={ex.exercise_id}
              exerciseName={ex.name}
              default_view={true}
              initialSetConfigs={ex.setConfigs}
              onSetComplete={handleSetComplete}
              setData={workoutProgress[ex.exercise_id] || []}
              onSetDataChange={handleSetDataChange}
              isUnscheduled={false}
            />
          ))}
        </div>
      </CardWrapper>

      {showAddExercise && (
        <SwiperSheet open={showAddExercise} onOpenChange={() => setShowAddExercise(false)}>
            <AddNewExerciseForm
              key="add-new"
              formPrompt="Add a new exercise"
              onActionIconClick={() => {}}
              initialSets={3}
              initialSetConfigs={Array.from({ length: 3 }, () => ({
                reps: 10,
                weight: 0,
                unit: 'kg'
              }))}
            />
        </SwiperSheet>
      )}
    </AppLayout>
  );
};

ActiveWorkout.propTypes = {
  // PropTypes can be re-added if needed
};

export default ActiveWorkout; 