import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabaseClient';
import { useNavBarVisibility } from '@/contexts/NavBarVisibilityContext';
import { PageNameContext } from "@/App";
import { useActiveWorkout } from "@/contexts/ActiveWorkoutContext";
import PageHeader from '@/components/layout/PageHeader';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import ActiveExerciseCard from '@/components/common/Cards/ActiveExerciseCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import NumericInput from '@/components/molecules/numeric-input';
import WeightCompoundField from '@/components/common/forms/WeightCompoundField';
import { Play, Pause, Square, Circle, Home, History, Dumbbell, Settings, Star, RotateCcw } from 'lucide-react';
import AddNewExerciseForm from '@/components/common/forms/AddNewExerciseForm';
import ResponsiveNav from '@/components/organisms/responsive-nav';
import AppLayout from '@/components/layout/AppLayout';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";

// Define navigation items
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
  const location = useLocation();
  const {
    activeWorkout,
    isWorkoutActive,
    elapsedTime,
    workoutSummaryData,
    prepareForSummary
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showEndWorkout, setShowEndWorkout] = useState(false);
  const [search, setSearch] = useState("");
  const { setNavBarVisible } = useNavBarVisibility();
  const [setDataByExercise, setSetDataByExercise] = useState({});

  // This effect now safely handles all navigation logic for this page.
  useEffect(() => {
    if (!isWorkoutActive) {
      if (workoutSummaryData) {
        navigate('/workout/summary', { replace: true });
      } else {
        navigate('/workout', { replace: true });
      }
    }
  }, [isWorkoutActive, workoutSummaryData, navigate]);

  // Hide nav bar when workout is active
  useEffect(() => {
    setNavBarVisible(false);
    return () => setNavBarVisible(true);
  }, [setNavBarVisible]);

  // Set page name
  useEffect(() => {
    setPageName("Active Workout");
  }, [setPageName]);

  // Fetch exercises for selected program
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
    setSetDataByExercise(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.id === setId);
      let newSets;
      if (setIdx === -1) {
        // New set
        newSets = [...prevSets, { id: setId, [field]: value }];
      } else {
        // Update existing set
        newSets = prevSets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        );
      }
      return { ...prev, [exerciseId]: newSets };
    });
  };

  const handleEndWorkout = () => {
    try {
      const workoutData = {
        programId: activeWorkout?.programId,
        name: activeWorkout?.name,
        duration_seconds: elapsedTime,
      };
      // Merge setConfigs with setData for completion status
      const mergedExercises = exercises.map(ex => ({
        ...ex,
        setConfigs: (ex.setConfigs || []).map((set, idx) => {
          const setDataArr = setDataByExercise[ex.exercise_id] || [];
          const setData = setDataArr.find(s => s.id === idx + 1); // id is 1-based
          return { ...set, ...(setData || {}) };
        }),
      }));
      prepareForSummary({ workoutData, exercises: mergedExercises });
    } catch (error) {
      console.error('Error preparing workout summary:', error);
    }
  };

  return (
    <AppLayout
      appHeaderTitle="Active Workout"
      subhead={true}
      subheadText={activeWorkout?.name || 'Workout in Progress'}
      showBackButton={true}
      showActionBar={true}
      actionBarText="End Workout"
      showActionIcon={false}
      search={true}
      searchValue={search}
      onSearchChange={setSearch}
      onBack={() => setShowEndWorkout(true)}
      onAction={handleEndWorkout}
    >
      <ResponsiveNav navItems={navItems} />
      <CardWrapper>
        <div className="w-full flex flex-col gap-4 p-4">
          {exercises.map(ex => (
            <ActiveExerciseCard
              key={ex.id}
              exerciseId={ex.exercise_id}
              exerciseName={ex.name}
              default_view={true}
              initialSetConfigs={ex.setConfigs}
              onSetComplete={() => {}}
              setData={setDataByExercise[ex.exercise_id] || []}
              onSetDataChange={handleSetDataChange}
              isUnscheduled={false}
            />
          ))}
        </div>
      </CardWrapper>

      <Alert open={showEndWorkout}>
        <AlertTitle>End your workout?</AlertTitle>
        <AlertDescription>
          This will save your current progress. You won't be able to come back to it.
        </AlertDescription>
        <div className="mt-4 flex justify-end">
          <button onClick={() => setShowEndWorkout(false)} className="px-4 py-2 mr-2 bg-gray-300 rounded-md">Cancel</button>
          <button onClick={handleEndWorkout} className="px-4 py-2 bg-red-500 text-white rounded-md">End Workout</button>
        </div>
      </Alert>

      {showAddExercise && (
        <Sheet open={showAddExercise} onOpenChange={() => setShowAddExercise(false)}>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add a new exercise</SheetTitle>
              <SheetDescription>
                Fill out the form below to add a new exercise to your workout.
              </SheetDescription>
            </SheetHeader>
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
          </SheetContent>
        </Sheet>
      )}
    </AppLayout>
  );
};

ActiveWorkout.propTypes = {
  selectedProgram: PropTypes.shape({
    id: PropTypes.string.isRequired,
    program_name: PropTypes.string.isRequired,
  }),
  exercises: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    exercise_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    setConfigs: PropTypes.arrayOf(PropTypes.shape({
      reps: PropTypes.number.isRequired,
      weight: PropTypes.number.isRequired,
      unit: PropTypes.string.isRequired,
    })).isRequired,
  })),
  onExercisesChange: PropTypes.func,
};

export default ActiveWorkout; 