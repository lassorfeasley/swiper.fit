import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  areAllExercisesComplete
} from '@/lib/exerciseNavigation';
import { useWorkoutAutoFocus } from '@/hooks/useAutoFocus';
const WorkoutNavigationContext = createContext();

export const useWorkoutNavigation = () => {
  const context = useContext(WorkoutNavigationContext);
  if (!context) {
    throw new Error('useWorkoutNavigation must be used within a WorkoutNavigationProvider');
  }
  return context;
};

export const WorkoutNavigationProvider = ({ children }) => {
  // Store exercises for each section
  const [sectionExercises, setSectionExercises] = useState({
    warmup: [],
    training: [],
    cooldown: []
  });
  
  // Store completed exercises across all sections
  const [completedExercises, setCompletedExercises] = useState(new Set());
  
  // Store the currently focused exercise
  const [focusedExercise, setFocusedExercise] = useState(null);

  // Update exercises for a specific section
  const updateSectionExercises = useCallback((section, exercises) => {
    setSectionExercises(prev => ({
      ...prev,
      [section]: exercises
    }));
  }, []);

  // Mark an exercise as completed
  const markExerciseComplete = useCallback((exerciseId) => {
    setCompletedExercises(prev => new Set([...prev, exerciseId]));
  }, []);

  // Mark an exercise as incomplete (for undo functionality)
  const markExerciseIncomplete = useCallback((exerciseId) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  }, []);

  // Set the focused exercise
  const setFocusedExerciseId = useCallback((exerciseId, section) => {
    if (!exerciseId) {
      setFocusedExercise(null);
      return;
    }

    const exercises = sectionExercises[section] || [];
    const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
    
    if (exercise) {
      setFocusedExercise({ ...exercise, section });
    } else {
      // Store a placeholder so sections can react when data arrives
      setFocusedExercise({ exercise_id: exerciseId, section });
    }
  }, [sectionExercises]);

  // Use the dedicated auto focus hook
  const { focusFirstExercise, handleSectionComplete } = useWorkoutAutoFocus({
    sectionExercises,
    completedExercises,
    setFocusedExercise
  });

  // Check if all exercises are complete
  const isWorkoutComplete = useCallback(() => {
    return areAllExercisesComplete(sectionExercises, completedExercises);
  }, [sectionExercises, completedExercises]);

  // Get progress statistics
  const getProgressStats = useCallback(() => {
    // Count total sets across all exercises
    const totalSets = Object.values(sectionExercises).reduce(
      (total, exercises) => total + exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + (exercise.setConfigs?.length || 0), 
        0
      ), 
      0
    );
    
    // Count completed sets by checking the status of each set in each exercise
    const completedSets = Object.values(sectionExercises).reduce(
      (total, exercises) => total + exercises.reduce(
        (exerciseTotal, exercise) => {
          const completedSetsInExercise = (exercise.setConfigs || []).filter(
            set => set.status === 'complete'
          ).length;
          return exerciseTotal + completedSetsInExercise;
        }, 
        0
      ), 
      0
    );
    
    return {
      total: totalSets,
      completed: completedSets,
      remaining: totalSets - completedSets,
      percentage: totalSets > 0 ? (completedSets / totalSets) * 100 : 0
    };
  }, [sectionExercises]);

  const value = {
    // State
    sectionExercises,
    completedExercises,
    focusedExercise,
    
    // Actions
    updateSectionExercises,
    markExerciseComplete,
    markExerciseIncomplete,
    setFocusedExerciseId,
    handleSectionComplete,
    focusFirstExercise,
    
    // Computed values
    isWorkoutComplete,
    getProgressStats
  };

  return (
    <WorkoutNavigationContext.Provider value={value}>
      {children}
    </WorkoutNavigationContext.Provider>
  );
};
