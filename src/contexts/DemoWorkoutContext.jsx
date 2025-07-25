import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

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
      exercise_id: 'chest-press',
      name: 'Chest press',
      section: 'training',
      setConfigs: [
        {
          id: 'demo-set-1-1',
          routine_set_id: 'demo-routine-set-1-1',
          reps: 12,
          weight: 60,
          weight_unit: 'lbs',
          set_variant: 'Set 1',
          set_type: 'reps',
          status: 'default',
          set_order: 1
        },
        {
          id: 'demo-set-1-2',
          routine_set_id: 'demo-routine-set-1-2',
          reps: 12,
          weight: 60,
          weight_unit: 'lbs',
          set_variant: 'Set 2',
          set_type: 'reps',
          status: 'default',
          set_order: 2
        },
        {
          id: 'demo-set-1-3',
          routine_set_id: 'demo-routine-set-1-3',
          reps: 12,
          weight: 60,
          weight_unit: 'lbs',
          set_variant: 'Set 3',
          set_type: 'reps',
          status: 'default',
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
          routine_set_id: 'demo-routine-set-2-1',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'ALTERNATING',
          set_type: 'timed',
          timed_set_duration: 45,
          status: 'default',
          set_order: 1
        },
        {
          id: 'demo-set-2-2',
          routine_set_id: 'demo-routine-set-2-2',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'UNISON',
          set_type: 'timed',
          timed_set_duration: 45,
          status: 'default',
          set_order: 2
        },
        {
          id: 'demo-set-2-3',
          routine_set_id: 'demo-routine-set-2-3',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'WOODCHOP',
          set_type: 'timed',
          timed_set_duration: 45,
          status: 'default',
          set_order: 3
        }
      ]
    },
    {
      id: 'demo-exercise-3',
      exercise_id: 'runners-stretch',
      name: "Runner's stretch",
      section: 'training',
      setConfigs: [
        {
          id: 'demo-set-3-1',
          routine_set_id: 'demo-routine-set-3-1',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 1',
          set_type: 'timed',
          timed_set_duration: 60,
          status: 'default',
          set_order: 1
        },
        {
          id: 'demo-set-3-2',
          routine_set_id: 'demo-routine-set-3-2',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 2',
          set_type: 'timed',
          timed_set_duration: 60,
          status: 'default',
          set_order: 2
        },
        {
          id: 'demo-set-3-3',
          routine_set_id: 'demo-routine-set-3-3',
          reps: 0,
          weight: 0,
          weight_unit: 'body',
          set_variant: 'Set 3',
          set_type: 'timed',
          timed_set_duration: 60,
          status: 'default',
          set_order: 3
        }
      ]
    }
  ]);

  // Focus management
  const [focusedExerciseId, setFocusedExerciseId] = useState(null);
  const [completedExercises, setCompletedExercises] = useState(new Set());

  // Form state
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingSet, setEditingSet] = useState(null);
  const [isEditSheetOpen, setEditSheetOpen] = useState(false);
  
  // Edit exercise state
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingExerciseDirty, setEditingExerciseDirty] = useState(false);

  // Auto-complete demo feature
  const [autoCompleteEnabled, setAutoCompleteEnabled] = useState(false);
  const [autoCompleteInterval, setAutoCompleteInterval] = useState(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  
  // Use refs to track current auto-complete state to avoid closure issues
  const autoCompleteEnabledRef = useRef(false);
  const currentExerciseIndexRef = useRef(0);
  const currentSetIndexRef = useRef(0);

  // Sync completedExercises with actual set statuses
  useEffect(() => {
    const newCompletedExercises = new Set();
    demoExercises.forEach(exercise => {
      const allSetsComplete = exercise.setConfigs.every(set => set.status === 'complete');
      if (allSetsComplete) {
        newCompletedExercises.add(exercise.exercise_id);
      }
    });
    setCompletedExercises(newCompletedExercises);
  }, [demoExercises]);

  // Handle set completion
  const handleSetComplete = useCallback((exerciseId, setConfig, isManualSwipe = false) => {
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

    // If this is a manual swipe, stop auto-complete but allow continued manual swiping
    if (isManualSwipe) {
      setUserHasInteracted(true);
      // Stop auto-complete if it's running
      if (autoCompleteEnabledRef.current) {
        setAutoCompleteEnabled(false);
        autoCompleteEnabledRef.current = false;
        setCurrentExerciseIndex(0);
        setCurrentSetIndex(0);
        currentExerciseIndexRef.current = 0;
        currentSetIndexRef.current = 0;
        if (autoCompleteInterval) {
          clearInterval(autoCompleteInterval);
          setAutoCompleteInterval(null);
        }
      }
    }

    // Only auto-focus next exercise if ALL sets in the current exercise are complete
    setTimeout(() => {
      const currentExercise = demoExercises.find(ex => ex.exercise_id === exerciseId);
      if (currentExercise) {
        const allSetsComplete = currentExercise.setConfigs.every(set => 
          set.id === setConfig.id ? true : set.status === 'complete'
        );
        
        // Only move to next exercise if all sets in current exercise are complete
        if (allSetsComplete) {
          const currentIndex = demoExercises.findIndex(ex => ex.exercise_id === exerciseId);
          for (let i = currentIndex + 1; i < demoExercises.length; i++) {
            const nextExercise = demoExercises[i];
            if (!completedExercises.has(nextExercise.exercise_id)) {
              setFocusedExerciseId(nextExercise.exercise_id);
              break;
            }
          }
          
          // If no next incomplete exercise found, focus back to the first incomplete exercise
          if (currentIndex === demoExercises.length - 1 || 
              demoExercises.slice(currentIndex + 1).every(ex => completedExercises.has(ex.exercise_id))) {
            // Find the first incomplete exercise
            for (let i = 0; i < demoExercises.length; i++) {
              const exercise = demoExercises[i];
              if (!completedExercises.has(exercise.exercise_id)) {
                setFocusedExerciseId(exercise.exercise_id);
                break;
              }
            }
          }
        }
      }
    }, 500);
  }, [demoExercises, completedExercises, autoCompleteEnabled, autoCompleteInterval]);

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

  // Handle set deletion
  const handleSetDelete = useCallback((exerciseId, setConfig) => {
    setDemoExercises(prev => 
      prev.map(exercise => {
        if (exercise.exercise_id === exerciseId) {
          const filteredSetConfigs = exercise.setConfigs.filter(set => set.id !== setConfig.id);
          
          // If no sets remain, add a default set to prevent empty exercises
          if (filteredSetConfigs.length === 0) {
            filteredSetConfigs.push({
              id: `demo-set-${exercise.exercise_id}-default`,
              routine_set_id: `demo-routine-set-${exercise.exercise_id}-default`,
              reps: 10,
              weight: 0,
              weight_unit: 'lbs',
              set_variant: 'Set 1',
              set_type: 'reps',
              status: 'default',
              set_order: 1
            });
          } else {
            // Update set order numbers to be sequential
            filteredSetConfigs.forEach((set, index) => {
              set.set_order = index + 1;
              set.set_variant = `Set ${index + 1}`;
            });
          }
          
          return {
            ...exercise,
            setConfigs: filteredSetConfigs
          };
        }
        return exercise;
      })
    );
  }, []);

  // Handle exercise focus - allow clicking on any exercise
  const handleExerciseFocus = useCallback((exerciseId, isManualClick = false) => {
    setFocusedExerciseId(exerciseId);
    // If auto-complete is running and user manually clicks, stop it permanently
    if (autoCompleteEnabledRef.current && isManualClick) {
      // Stop auto-complete by setting the state directly
      setAutoCompleteEnabled(false);
      autoCompleteEnabledRef.current = false;
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      currentExerciseIndexRef.current = 0;
      currentSetIndexRef.current = 0;
      if (autoCompleteInterval) {
        clearInterval(autoCompleteInterval);
        setAutoCompleteInterval(null);
      }
      // Mark that user has interacted
      setUserHasInteracted(true);
    }
  }, [autoCompleteEnabled, autoCompleteInterval]);

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
    
    setDemoExercises(prev => {
      const updatedExercises = prev.map(exercise => {
        if (exercise.id === editingExercise.id) {
          // Preserve status of existing sets by matching IDs
          const updatedSetConfigs = setConfigs.map((config, index) => {
            // Try to find existing set with same ID to preserve status
            const existingSet = exercise.setConfigs.find(set => set.id === config.id);
            return {
              ...config,
              id: config.id || `demo-set-${exercise.exercise_id}-${index + 1}`,
              routine_set_id: config.routine_set_id || `demo-routine-set-${exercise.exercise_id}-${index + 1}`,
              set_order: index + 1,
              // Preserve status if set exists, otherwise default to 'default'
              status: existingSet ? existingSet.status : 'default'
            };
          });
          
          return {
            ...exercise,
            name: name,
            section: section,
            setConfigs: updatedSetConfigs
          };
        }
        return exercise;
      });
      
      return updatedExercises;
    });
    
    setEditingExercise(null);
    setEditingExerciseDirty(false);
  }, [editingExercise]);

  // Handle opening the add exercise form
  const handleOpenAddExercise = useCallback(() => {
    setShowAddExercise(true);
  }, []);

  // Handle adding new exercise (form submission)
  const handleAddExercise = useCallback((exerciseData) => {
    // Ensure all setConfigs have proper status and other required fields
    const processedSetConfigs = (exerciseData.setConfigs || []).map((setConfig, index) => ({
      id: setConfig.id || `demo-set-new-${Date.now()}-${index + 1}`,
      routine_set_id: setConfig.routine_set_id || `demo-routine-set-new-${Date.now()}-${index + 1}`,
      reps: setConfig.reps || 10,
      weight: setConfig.weight || 0,
      weight_unit: setConfig.weight_unit || setConfig.unit || 'lbs',
      set_variant: setConfig.set_variant || `Set ${index + 1}`,
      set_type: setConfig.set_type || 'reps',
      timed_set_duration: setConfig.timed_set_duration || 30,
      status: 'default', // Ensure status is always 'default' for new sets
      set_order: setConfig.set_order || index + 1
    }));

    const newExercise = {
      id: `demo-exercise-${Date.now()}`,
      exercise_id: `new-exercise-${Date.now()}`,
      name: exerciseData.name,
      section: exerciseData.section || 'training',
      setConfigs: processedSetConfigs
    };

    setDemoExercises(prev => [...prev, newExercise]);
    
    // Ensure the new exercise is not marked as completed
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(newExercise.exercise_id);
      return newSet;
    });
    
    setShowAddExercise(false);
  }, []);

  // Stop auto-complete demo
  const stopAutoComplete = useCallback(() => {
    if (autoCompleteInterval) {
      clearInterval(autoCompleteInterval);
      setAutoCompleteInterval(null);
    }
    setAutoCompleteEnabled(false);
    autoCompleteEnabledRef.current = false;
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    currentExerciseIndexRef.current = 0;
    currentSetIndexRef.current = 0;
  }, [autoCompleteInterval]);

  // Process next set in auto-complete
  const processNextSet = useCallback(() => {
    console.log('processNextSet called', { 
      currentExerciseIndex: currentExerciseIndexRef.current, 
      currentSetIndex: currentSetIndexRef.current, 
      autoCompleteEnabled: autoCompleteEnabledRef.current 
    });
    
    // Check if auto-complete is still enabled (user might have paused it)
    if (!autoCompleteEnabledRef.current) {
      console.log('Auto-complete disabled, returning');
      return;
    }
    
    if (currentExerciseIndexRef.current >= demoExercises.length) {
      // All exercises completed
      setAutoCompleteEnabled(false);
      autoCompleteEnabledRef.current = false;
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      currentExerciseIndexRef.current = 0;
      currentSetIndexRef.current = 0;
      if (autoCompleteInterval) {
        clearInterval(autoCompleteInterval);
        setAutoCompleteInterval(null);
      }
      return;
    }
    
    const currentExercise = demoExercises[currentExerciseIndexRef.current];
    if (!currentExercise) {
      setAutoCompleteEnabled(false);
      autoCompleteEnabledRef.current = false;
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      currentExerciseIndexRef.current = 0;
      currentSetIndexRef.current = 0;
      if (autoCompleteInterval) {
        clearInterval(autoCompleteInterval);
        setAutoCompleteInterval(null);
      }
      return;
    }
    
    // Focus on current exercise
    handleExerciseFocus(currentExercise.exercise_id, false); // Not a manual click
    
    if (currentSetIndexRef.current >= currentExercise.setConfigs.length) {
      // All sets in current exercise completed, move to next incomplete exercise
      let nextExerciseIndex = currentExerciseIndexRef.current + 1;
      
      // Find the next incomplete exercise
      while (nextExerciseIndex < demoExercises.length) {
        const nextExercise = demoExercises[nextExerciseIndex];
        if (!completedExercises.has(nextExercise.exercise_id)) {
          break;
        }
        nextExerciseIndex++;
      }
      
      setCurrentExerciseIndex(nextExerciseIndex);
      setCurrentSetIndex(0);
      currentExerciseIndexRef.current = nextExerciseIndex;
      currentSetIndexRef.current = 0;
      
      // Fixed 4-second delay before next exercise
      setTimeout(processNextSet, 4000);
      return;
    }
    
    // Complete current set
    const currentSet = currentExercise.setConfigs[currentSetIndexRef.current];
    if (currentSet && currentSet.status !== 'complete') {
      handleSetComplete(currentExercise.exercise_id, currentSet, false); // Not a manual swipe
    }
    
    // Move to next set
    setCurrentSetIndex(prev => prev + 1);
    currentSetIndexRef.current += 1;
    
    // Fixed 4-second delay before next set
    setTimeout(processNextSet, 4000);
  }, [demoExercises, handleSetComplete, handleExerciseFocus, autoCompleteInterval, completedExercises]);

  // Start auto-complete demo
  const startAutoComplete = useCallback(() => {
    console.log('startAutoComplete called', { autoCompleteEnabled, userHasInteracted });
    if (autoCompleteEnabledRef.current) {
      console.log('Auto-complete already running, returning');
      return; // Already running
    }
    if (userHasInteracted) {
      console.log('User has interacted, returning');
      return; // Don't start if user has manually interacted
    }
    
    console.log('Starting auto-complete');
    setAutoCompleteEnabled(true);
    autoCompleteEnabledRef.current = true;
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    currentExerciseIndexRef.current = 0;
    currentSetIndexRef.current = 0;
    
    // Start with first exercise focused only if no exercise is currently focused
    if (demoExercises.length > 0 && !focusedExerciseId) {
      handleExerciseFocus(demoExercises[0].exercise_id, false); // Not a manual click
    }
    
    // Start the process after a delay to ensure first exercise stays focused
    setTimeout(processNextSet, 1000);
  }, [demoExercises, handleExerciseFocus, focusedExerciseId, processNextSet]);

  // Keep refs in sync with state
  useEffect(() => {
    autoCompleteEnabledRef.current = autoCompleteEnabled;
  }, [autoCompleteEnabled]);
  
  useEffect(() => {
    currentExerciseIndexRef.current = currentExerciseIndex;
  }, [currentExerciseIndex]);
  
  useEffect(() => {
    currentSetIndexRef.current = currentSetIndex;
  }, [currentSetIndex]);

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
    setAutoCompleteEnabled(false);
    autoCompleteEnabledRef.current = false;
    setCurrentExerciseIndex(0);
    setCurrentSetIndex(0);
    currentExerciseIndexRef.current = 0;
    currentSetIndexRef.current = 0;
    if (autoCompleteInterval) {
      clearInterval(autoCompleteInterval);
      setAutoCompleteInterval(null);
    }
    setUserHasInteracted(false);
    setDemoExercises([
      {
        id: 'demo-exercise-1',
        exercise_id: 'push-up',
        name: 'Push up',
        section: 'training',
        setConfigs: [
          {
            id: 'demo-set-1-1',
            routine_set_id: 'demo-routine-set-1-1',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 1',
            set_type: 'reps',
            status: 'default',
            set_order: 1
          },
          {
            id: 'demo-set-1-2',
            routine_set_id: 'demo-routine-set-1-2',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 2',
            set_type: 'reps',
            status: 'default',
            set_order: 2
          },
          {
            id: 'demo-set-1-3',
            routine_set_id: 'demo-routine-set-1-3',
            reps: 10,
            weight: 0,
            weight_unit: 'lbs',
            set_variant: 'Set 3',
            set_type: 'reps',
            status: 'default',
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
            routine_set_id: 'demo-routine-set-2-1',
            reps: 0,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'ALTERNATING',
            set_type: 'timed',
            timed_set_duration: 45,
            status: 'default',
            set_order: 1
          },
          {
            id: 'demo-set-2-2',
            routine_set_id: 'demo-routine-set-2-2',
            reps: 0,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'UNISON',
            set_type: 'timed',
            timed_set_duration: 45,
            status: 'default',
            set_order: 2
          },
          {
            id: 'demo-set-2-3',
            routine_set_id: 'demo-routine-set-2-3',
            reps: 0,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'WOODCHOP',
            set_type: 'timed',
            timed_set_duration: 45,
            status: 'default',
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
            routine_set_id: 'demo-routine-set-3-1',
            reps: 8,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 1',
            set_type: 'reps',
            status: 'default',
            set_order: 1
          },
          {
            id: 'demo-set-3-2',
            routine_set_id: 'demo-routine-set-3-2',
            reps: 8,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 2',
            set_type: 'reps',
            status: 'default',
            set_order: 2
          },
          {
            id: 'demo-set-3-3',
            routine_set_id: 'demo-routine-set-3-3',
            reps: 6,
            weight: 0,
            weight_unit: 'body',
            set_variant: 'Set 3',
            set_type: 'reps',
            status: 'default',
            set_order: 3
          }
        ]
      }
    ]);
    setCompletedExercises(new Set());
    setFocusedExerciseId(null);
    setUserHasInteracted(false);
  }, [autoCompleteInterval]);

  const value = {
    demoWorkout,
    demoExercises,
    focusedExerciseId,
    completedExercises,
    setCompletedExercises,
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
    setAutoCompleteEnabled,
    currentExerciseIndex,
    currentSetIndex,
    userHasInteracted,
    handleSetComplete,
    handleSetEdit,
    handleSetUpdate,
    handleSetDelete,
    handleExerciseFocus,
    handleEditExercise,
    handleSaveExerciseEdit,
    handleOpenAddExercise,
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
