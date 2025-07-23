import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const DemoWorkoutContext = createContext();

export function DemoWorkoutProvider({ children }) {
  // Demo workout state
  const [demoWorkout, setDemoWorkout] = useState({
    id: 'demo-workout',
    workoutName: 'Demo Workout',
    startTime: new Date().toISOString(),
    isActive: true
  });

  // Demo exercises with sample data matching the Figma design
  const [demoExercises, setDemoExercises] = useState([
    {
      id: 'demo-exercise-1',
      exercise_id: 'push-up',
      name: 'Push up',
      section: 'training',
      setConfigs: [
        {
          id: 'demo-set-1-1',
          routine_set_id: 'demo-routine-set-1',
          reps: 10,
          weight: 0,
          weight_unit: 'lbs',
          set_variant: 'Set 1',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 1
        },
        {
          id: 'demo-set-1-2',
          routine_set_id: 'demo-routine-set-1',
          reps: 10,
          weight: 0,
          weight_unit: 'lbs',
          set_variant: 'Set 2',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 2
        },
        {
          id: 'demo-set-1-3',
          routine_set_id: 'demo-routine-set-1',
          reps: 10,
          weight: 0,
          weight_unit: 'lbs',
          set_variant: 'Set 3',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 3
        }
      ]
    },
    {
      id: 'demo-exercise-2',
      exercise_id: 'battle-ropes',
      name: 'Battle ropes',
      section: 'training',
      setConfigs: [
        {
          id: 'demo-set-2-1',
          routine_set_id: 'demo-routine-set-2',
          reps: 25,
          weight: 25,
          weight_unit: 'lbs',
          set_variant: 'ALTERNATING',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 1
        },
        {
          id: 'demo-set-2-2',
          routine_set_id: 'demo-routine-set-2',
          reps: 25,
          weight: 25,
          weight_unit: 'lbs',
          set_variant: 'UNISON',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 2
        },
        {
          id: 'demo-set-2-3',
          routine_set_id: 'demo-routine-set-2',
          reps: 25,
          weight: 25,
          weight_unit: 'lbs',
          set_variant: 'WOODCHOP',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 3
        }
      ]
    },
    {
      id: 'demo-exercise-3',
      exercise_id: 'chin-up',
      name: 'Chin up',
      section: 'training',
      setConfigs: [
        {
          id: 'demo-set-3-1',
          routine_set_id: 'demo-routine-set-3',
          reps: 8,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 1',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 1
        },
        {
          id: 'demo-set-3-2',
          routine_set_id: 'demo-routine-set-3',
          reps: 8,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 2',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 2
        },
        {
          id: 'demo-set-3-3',
          routine_set_id: 'demo-routine-set-3',
          reps: 6,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 3',
          set_type: 'reps',
          status: 'incomplete',
          set_order: 3
        }
      ]
    }
  ]);

  // Focus management
  const [focusedExerciseId, setFocusedExerciseId] = useState('battle-ropes');
  const [completedExercises, setCompletedExercises] = useState(new Set(['push-up']));

  // Form state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  
  // Edit exercise state
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);

  // Handle set completion
  const handleSetComplete = useCallback((exerciseId, setConfig) => {
    setDemoExercises(prev => 
      prev.map(exercise => {
        if (exercise.exercise_id === exerciseId) {
          return {
            ...exercise,
            setConfigs: exercise.setConfigs.map(set => 
              set.id === setConfig.id 
                ? { ...set, status: 'complete' }
                : set
            )
          };
        }
        return exercise;
      })
    );

    // Check if all sets in exercise are complete
    const exercise = demoExercises.find(ex => ex.exercise_id === exerciseId);
    if (exercise) {
      const allSetsComplete = exercise.setConfigs.every(set => 
        set.id === setConfig.id ? true : set.status === 'complete'
      );
      
      if (allSetsComplete) {
        setCompletedExercises(prev => new Set([...prev, exerciseId]));
        
        // Auto-focus next incomplete exercise
        const currentIndex = demoExercises.findIndex(ex => ex.exercise_id === exerciseId);
        for (let i = currentIndex + 1; i < demoExercises.length; i++) {
          const nextExercise = demoExercises[i];
          if (!completedExercises.has(nextExercise.exercise_id)) {
            setFocusedExerciseId(nextExercise.exercise_id);
            break;
          }
        }
      }
    }
  }, [demoExercises, completedExercises]);

  // Handle set editing
  const handleSetEdit = useCallback((exerciseId, setConfig, index) => {
    setEditingSet({ exerciseId, setConfig, index });
    setEditSheetOpen(true);
  }, []);

  // Handle set data update
  const handleSetUpdate = useCallback((exerciseId, setConfig, updates) => {
    setDemoExercises(prev => 
      prev.map(exercise => {
        if (exercise.exercise_id === exerciseId) {
          return {
            ...exercise,
            setConfigs: exercise.setConfigs.map(set => 
              set.id === setConfig.id 
                ? { 
                    ...set, 
                    ...updates,
                    // Map 'unit' to 'weight_unit' for compatibility
                    weight_unit: updates.unit || set.weight_unit || set.unit
                  }
                : set
            )
          };
        }
        return exercise;
      })
    );
  }, []);

  // Handle exercise focus - allow clicking on any exercise
  const handleExerciseFocus = useCallback((exerciseId) => {
    setFocusedExerciseId(exerciseId);
  }, []);

  // Handle edit exercise
  const handleEditExercise = useCallback((exercise) => {
    setEditingExercise({
      id: exercise.id,
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      section: exercise.section,
      setConfigs: exercise.setConfigs,
    });
  }, []);

  // Handle save exercise edit
  const handleSaveExerciseEdit = useCallback((data) => {
    const { name, section, setConfigs } = data;
    
    setDemoExercises(prev => 
      prev.map(exercise => {
        if (exercise.id === editingExercise.id) {
          return {
            ...exercise,
            name: name,
            section: section,
            setConfigs: setConfigs.map((config, index) => ({
              ...config,
              id: config.id || `demo-set-${exercise.exercise_id}-${index + 1}`,
              routine_set_id: config.routine_set_id || `demo-routine-set-${exercise.exercise_id}-${index + 1}`,
              set_order: index + 1
            }))
          };
        }
        return exercise;
      })
    );
    
    setEditingExercise(null);
    setEditingExerciseDirty(false);
  }, [editingExercise]);

  // Handle adding new exercise
  const handleAddExercise = useCallback((exerciseData) => {
    const newExercise = {
      id: `demo-exercise-${Date.now()}`,
      exercise_id: `new-exercise-${Date.now()}`,
      name: exerciseData.name,
      section: exerciseData.section || 'training',
      setConfigs: exerciseData.setConfigs || [
        {
          id: `demo-set-new-${Date.now()}-1`,
          routine_set_id: `demo-routine-set-new-${Date.now()}-1`,
          reps: 10,
          weight: 0,
          weight_unit: 'lbs',
          set_variant: 'Set 1',
          set_type: 'reps',
          status: 'default',
          set_order: 1
        }
      ]
    };

    setDemoExercises(prev => [...prev, newExercise]);
    setShowAddExercise(false);
  }, []);

  // Auto-complete demo feature
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false);
  const [autoCompleteInterval, setAutoCompleteInterval] = useState(null);

  // Start auto-complete demo
  const startAutoComplete = useCallback(() => {
    if (autoCompleteEnabled) return; // Already running
    
    setAutoCompleteEnabled(true);
    
    const interval = setInterval(() => {
      // Find all incomplete sets across all exercises
      const incompleteSets = [];
      demoExercises.forEach(exercise => {
        exercise.setConfigs.forEach(set => {
          if (set.status !== 'complete') {
            incompleteSets.push({
              exerciseId: exercise.exercise_id,
              set: set
            });
          }
        });
      });
      
      if (incompleteSets.length > 0) {
        // Pick a random incomplete set
        const randomIndex = Math.floor(Math.random() * incompleteSets.length);
        const { exerciseId, set } = incompleteSets[randomIndex];
        
        // Complete the set
        handleSetComplete(exerciseId, set);
      } else {
        // All sets completed, stop auto-complete
        stopAutoComplete();
      }
    }, Math.random() * 3000 + 2000); // Random interval between 2-5 seconds
    
    setAutoCompleteInterval(interval);
  }, [autoCompleteEnabled, demoExercises, handleSetComplete]);

  // Stop auto-complete demo
  const stopAutoComplete = useCallback(() => {
    if (autoCompleteInterval) {
      clearInterval(autoCompleteInterval);
      setAutoCompleteInterval(null);
    }
    setAutoCompleteEnabled(false);
  }, [autoCompleteInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCompleteInterval) {
        clearInterval(autoCompleteInterval);
      }
    };
  }, [autoCompleteInterval]);

  // Reset demo data
  const resetDemo = useCallback(() => {
    stopAutoComplete();
    setDemoExercises([
      {
        id: 'demo-exercise-1',
        exercise_id: 'push-up',
        name: 'Push up',
        section: 'training',
        setConfigs: [
          {
            id: 'demo-set-1-1',
            routine_set_id: 'demo-routine-set-1',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 1',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 1
          },
          {
            id: 'demo-set-1-2',
            routine_set_id: 'demo-routine-set-1',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 2',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 2
          },
          {
            id: 'demo-set-1-3',
            routine_set_id: 'demo-routine-set-1',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 3',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 3
          }
        ]
      },
      {
        id: 'demo-exercise-2',
        exercise_id: 'battle-ropes',
        name: 'Battle ropes',
        section: 'training',
        setConfigs: [
          {
            id: 'demo-set-2-1',
            routine_set_id: 'demo-routine-set-2',
            reps: 25,
            weight: 25,
            weight_unit: 'lbs',
            set_variant: 'ALTERNATING',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 1
          },
          {
            id: 'demo-set-2-2',
            routine_set_id: 'demo-routine-set-2',
            reps: 25,
            weight: 25,
            weight_unit: 'lbs',
            set_variant: 'UNISON',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 2
          },
          {
            id: 'demo-set-2-3',
            routine_set_id: 'demo-routine-set-2',
            reps: 25,
            weight: 25,
            weight_unit: 'lbs',
            set_variant: 'WOODCHOP',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 3
          }
        ]
      },
      {
        id: 'demo-exercise-3',
        exercise_id: 'chin-up',
        name: 'Chin up',
        section: 'training',
        setConfigs: [
          {
            id: 'demo-set-3-1',
            routine_set_id: 'demo-routine-set-3',
            reps: 8,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 1',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 1
          },
          {
            id: 'demo-set-3-2',
            routine_set_id: 'demo-routine-set-3',
            reps: 8,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 2',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 2
          },
          {
            id: 'demo-set-3-3',
            routine_set_id: 'demo-routine-set-3',
            reps: 6,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 3',
            set_type: 'reps',
            status: 'incomplete',
            set_order: 3
          }
        ]
      }
    ]);
    setCompletedExercises(new Set());
    setFocusedExerciseId(null);
  }, [stopAutoComplete]);

  const value = {
    demoWorkout,
    demoExercises,
    focusedExerciseId,
    completedExercises,
    showAddExercise,
    setShowAddExercise,
    editingSet,
    setEditingSet,
    isEditSheetOpen,
    setEditSheetOpen,
    editingExercise,
    setEditingExercise,
    editingExerciseDirty,
    setEditingExerciseDirty,
    autoCompleteEnabled,
    handleSetComplete,
    handleSetEdit,
    handleSetUpdate,
    handleExerciseFocus,
    handleEditExercise,
    handleSaveExerciseEdit,
    handleAddExercise,
    setFocusedExerciseId,
    startAutoComplete,
    stopAutoComplete,
    resetDemo
  };

  return (
    <DemoWorkoutContext.Provider value={value}>
      {children}
    </DemoWorkoutContext.Provider>
  );
}

export function useDemoWorkout() {
  const context = useContext(DemoWorkoutContext);
  if (!context) {
    throw new Error('useDemoWorkout must be used within a DemoWorkoutProvider');
  }
  return context;
}
