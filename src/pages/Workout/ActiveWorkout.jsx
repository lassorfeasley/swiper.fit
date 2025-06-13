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
import { Play, Pause, Square, Circle, Home, History, Star, RotateCcw } from 'lucide-react';
import AddNewExerciseForm from '@/components/common/forms/AddNewExerciseForm';
import ResponsiveNav from '@/components/organisms/responsive-nav';
import AppLayout from '@/components/layout/AppLayout';

const navItems = [
  { to: "/", label: "Home", icon: <Home className="w-7 h-7" /> },
  { to: "/programs", label: "Programs", icon: <Star className="w-7 h-7" /> },
  { to: "/history", label: "History", icon: <RotateCcw className="w-7 h-7" /> },
  { to: "/workout", label: "Workout", icon: <Play className="w-7 h-7" /> },
];

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
  const {
    activeWorkout,
    isWorkoutActive,
    elapsedTime,
    isPaused,
    togglePause,
    endWorkout: contextEndWorkout,
  } = useActiveWorkout();
  const [exercises, setExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [search, setSearch] = useState("");
  const { setNavBarVisible } = useNavBarVisibility();
  const [setDataByExercise, setSetDataByExercise] = useState({});

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
    setSetDataByExercise(prev => {
      const prevSets = prev[exerciseId] || [];
      const setIdx = prevSets.findIndex(s => s.id === setId);
      let newSets;
      if (setIdx === -1) {
        newSets = [...prevSets, { id: setId, [field]: value }];
      } else {
        newSets = prevSets.map((s, i) =>
          i === setIdx ? { ...s, [field]: value } : s
        );
      }
      return { ...prev, [exerciseId]: newSets };
    });
  };

  const handleEndWorkout = async () => {
    try {
      console.log('Starting workout end process...');
      console.log('Active workout data:', activeWorkout);
      console.log('User:', user);
      console.log('Exercises:', exercises);
      console.log('Set data:', setDataByExercise);

      if (!user?.id) {
        throw new Error('No user ID available');
      }

      if (!activeWorkout?.programId) {
        throw new Error('No active workout program ID available');
      }

      const { data: workout, error } = await supabase
        .from('workouts')
        .insert([
          {
            user_id: user.id,
            program_id: activeWorkout?.programId,
            workout_name: activeWorkout?.name || 'Workout',
            duration_seconds: elapsedTime,
            completed_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout record:', error);
        throw error;
      }

      console.log('Created workout record:', workout);

      const allExercisesWithSets = exercises.map(ex => ({
        ...ex,
        sets: (setDataByExercise[ex.exercise_id] || []).map((s, index) => {
            const config = ex.setConfigs[s.id - 1] || {};
            return {
                reps: s.reps ?? config.reps,
                weight: s.weight ?? config.weight,
                order: index + 1,
            };
        })
      }));

      console.log('Processed exercises with sets:', allExercisesWithSets);

      for (const exercise of allExercisesWithSets) {
        if(exercise.sets.length === 0) {
          console.log('Skipping exercise with no sets:', exercise.name);
          continue;
        }

        console.log('Saving sets for exercise:', exercise.name);

        // Insert all sets for this exercise directly into the sets table
        const setRows = exercise.sets.map(set => ({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          reps: set.reps,
          weight: set.weight,
          order: set.order,
          weight_unit: exercise.setConfigs[0]?.unit || 'lbs' // Use the first set's unit as default
        }));

        const { error: setError } = await supabase
          .from('sets')
          .insert(setRows);

        if (setError) {
          console.error('Error saving sets for exercise:', exercise.name, setError);
          throw setError;
        }
      }

      console.log('Successfully saved all workout data');
      contextEndWorkout();
      navigate('/history');
    } catch (error) {
      console.error('Error ending workout:', error);
      // Add user feedback here
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

      <ActiveFocusedNavBar
        timer={`${String(Math.floor(elapsedTime/60)).padStart(2,'0')}:${String(elapsedTime%60).padStart(2,'0')}`}
        isPaused={isPaused}
        onPauseToggle={togglePause}
        onEnd={handleEndWorkout}
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
  // PropTypes can be re-added if needed
};

export default ActiveWorkout; 