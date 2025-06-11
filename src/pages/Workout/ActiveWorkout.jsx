import React, { useState, useEffect, useRef, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
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

// Define navigation items
const navItems = [
  { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
  { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
  { to: "/history", label: "History", icon: <RotateCcw className="w-7 h-7" /> },
  { to: "/workout", label: "Workout", icon: <Play className="w-7 h-7" /> },
];

/**
 * ActiveFocusedNavBar Component
 * Props:
 * - timer: string (formatted, e.g. '00:00')
 * - isPaused: boolean
 * - onPauseToggle: function
 * - onEnd: function
 */
const ActiveFocusedNavBar = ({ timer, isPaused, onPauseToggle, onEnd }) => {
  return (
    <div 
      data-layer="ActiveWorkoutNav" 
      className="fixed bottom-0 left-0 w-full h-24 px-6 py-3 bg-black/90 backdrop-blur-[2px] flex justify-center items-start z-50"
    >
      <div data-layer="MaxWidthWrapper" className="Maxwidthwrapper w-80 max-w-80 flex justify-between items-start">
        <div data-layer="Timer" className="Timer flex justify-start items-center gap-1">
          <div data-svg-wrapper data-layer="RecordingIcon" className="Recordingicon">
            <Circle className="w-5 h-5 text-green-500" fill="currentColor" />
          </div>
          <div data-layer="TimePassed" className="Timepassed justify-center text-white text-xl font-normal font-['Space_Grotesk'] leading-loose">
            {timer}
          </div>
        </div>
        <div data-layer="NavIconsWrapper" className="Naviconswrapper flex justify-start items-center">
          <div 
            data-layer="NavIcons" 
            data-selected={!isPaused} 
            className={`Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer${isPaused ? ' NaviconsSelected3 w-14' : ''}`}
            onClick={onPauseToggle}
          >
            {isPaused ? (
              <>
                <div data-svg-wrapper data-layer="play" className="Play relative">
                  <Play className="w-7 h-7 text-white" />
                </div>
                <div data-layer="Resume" className="Resume text-center justify-start text-white text-xs font-bold font-['Space_Grotesk'] leading-3">Resume</div>
              </>
            ) : (
              <>
                <div data-svg-wrapper data-layer="pause" className="Pause relative">
                  <Pause className="w-7 h-7 text-slate-200" />
                </div>
                <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
                  Pause
                </div>
              </>
            )}
          </div>
          <div 
            data-layer="NavIcons" 
            data-selected="true" 
            className="Navicons w-16 inline-flex flex-col justify-start items-center gap-1 cursor-pointer"
            onClick={onEnd}
          >
            <div data-svg-wrapper data-layer="stop" className="Stop relative">
              <Square className="w-7 h-7 text-slate-200" />
            </div>
            <div data-layer="Workout" className="Workout text-center justify-start text-stone-50 text-xs font-bold font-['Space_Grotesk'] leading-3">
              End
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActiveWorkout = () => {
  const { setPageName } = useContext(PageNameContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeWorkout, isWorkoutActive, startWorkout, endWorkout } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showEndWorkout, setShowEndWorkout] = useState(false);
  const [search, setSearch] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const [newExercise, setNewExercise] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const { setNavBarVisible } = useNavBarVisibility();

  // Initialize workout if not already active
  useEffect(() => {
    if (!isWorkoutActive) {
      // If no active workout, redirect to workout selection
      navigate('/workout');
      return;
    }

    // Set up the workout timer
    const timer = setInterval(() => {
      if (!isPaused) {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isWorkoutActive, isPaused, navigate]);

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
      console.log('Fetching exercises for program:', activeWorkout);
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
          console.log('Program exercises query result:', { progExs, error });
          if (error || !progExs) {
            console.error('Error fetching program exercises:', error);
            setExercises([]);
            return;
          }
          const exerciseIds = progExs.map(pe => pe.exercise_id);
          console.log('Exercise IDs to fetch:', exerciseIds);
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('id, name')
            .in('id', exerciseIds);

          console.log('Exercises query result:', { exercisesData, exercisesError });

          if (exercisesError) {
            console.error("Error fetching exercises for program:", exercisesError);
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
          console.log('Processed exercise cards:', cards);
          setExercises(cards);
        });
    } else {
      console.log('No program selected, clearing exercises');
      setExercises([]);
    }
  }, [activeWorkout]);

  const handleEndWorkout = async () => {
    try {
      // Save workout data to database
      const { data: workout, error } = await supabase
        .from('workouts')
        .insert([
          {
            user_id: user.id,
            program_id: activeWorkout?.programId,
            workout_name: activeWorkout?.name || 'Workout',
            duration: elapsedTime,
            completed_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Save exercises and sets
      for (const exercise of exercises) {
        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert([
            {
              workout_id: workout.id,
              exercise_id: exercise.id,
              exercise_name: exercise.name,
              order: exercise.order,
            }
          ]);

        if (exerciseError) throw exerciseError;

        // Save sets for each exercise
        for (const set of exercise.sets) {
          const { error: setError } = await supabase
            .from('workout_sets')
            .insert([
              {
                workout_id: workout.id,
                exercise_id: exercise.id,
                weight: set.weight,
                reps: set.reps,
                order: set.order,
              }
            ]);

          if (setError) throw setError;
        }
      }

      // End the workout
      endWorkout();
      navigate('/history');
    } catch (error) {
      console.error('Error ending workout:', error);
      // Handle error appropriately
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
      onBack={() => {
        // Don't navigate away, just show confirmation
        setShowEndWorkout(true);
      }}
      onAction={() => setShowEndWorkout(true)}
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
              onSetComplete={(setDataArg) => {
                // Handle set completion
              }}
              setData={[]}
              onSetDataChange={(exerciseId, setId, field, value) => {
                // Handle set data change
              }}
              data-component="ActiveExerciseCard"
              isUnscheduled={false}
            />
          ))}
        </div>
      </CardWrapper>
      <ActiveFocusedNavBar
        timer={`${String(Math.floor(elapsedTime/60)).padStart(2,'0')}:${String(elapsedTime%60).padStart(2,'0')}`}
        isPaused={!isPaused}
        onPauseToggle={() => setIsPaused(a => !a)}
        onEnd={handleEndWorkout}
        data-component="ActiveFocusedNavBar"
      />

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
              onActionIconClick={(exerciseData) => {
                // Handle adding a new exercise
              }}
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