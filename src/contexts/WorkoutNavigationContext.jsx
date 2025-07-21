import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  getNextExerciseAfterSectionComplete, 
  areAllExercisesComplete,
  findNextIncompleteExercise 
} from '@/lib/exerciseNavigation';

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

  // Handle section completion and find next exercise
  const handleSectionComplete = useCallback((completedSection) => {
    const nextExercise = getNextExerciseAfterSectionComplete(
      completedSection, 
      sectionExercises, 
      completedExercises
    );

    if (nextExercise) {
      // Focus on the next exercise
      setFocusedExercise(nextExercise);
      return nextExercise;
    } else {
      // All exercises are complete, workout should end
      setFocusedExercise(null);
      return null;
    }
  }, [sectionExercises, completedExercises]);

  // Find next incomplete exercise from current position
  const findNextIncompleteFromCurrent = useCallback((currentExerciseId) => {
    // Flatten all exercises into a single array for cross-section navigation
    const allExercises = [
      ...sectionExercises.warmup.map(ex => ({ ...ex, section: 'warmup' })),
      ...sectionExercises.training.map(ex => ({ ...ex, section: 'training' })),
      ...sectionExercises.cooldown.map(ex => ({ ...ex, section: 'cooldown' }))
    ];

    return findNextIncompleteExercise(allExercises, currentExerciseId, completedExercises);
  }, [sectionExercises, completedExercises]);

  // Check if all exercises are complete
  const isWorkoutComplete = useCallback(() => {
    return areAllExercisesComplete(sectionExercises, completedExercises);
  }, [sectionExercises, completedExercises]);

  // Get progress statistics
  const getProgressStats = useCallback(() => {
    const totalExercises = Object.values(sectionExercises).reduce(
      (total, exercises) => total + exercises.length, 
      0
    );
    const completedCount = completedExercises.size;
    
    return {
      total: totalExercises,
      completed: completedCount,
      remaining: totalExercises - completedCount,
      percentage: totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0
    };
  }, [sectionExercises, completedExercises]);

  // Focus on the first incomplete exercise in the workout
  const focusFirstExercise = useCallback(() => {
    // Check sections in order: warmup, training, cooldown
    const sections = ['warmup', 'training', 'cooldown'];
    
    for (const section of sections) {
      const exercises = sectionExercises[section] || [];
      const firstIncomplete = exercises.find(ex => !completedExercises.has(ex.exercise_id));
      
      if (firstIncomplete) {
        console.log(`[WorkoutNavigation] Focusing on first exercise: ${firstIncomplete.name} in ${section} section`);
        setFocusedExercise({ ...firstIncomplete, section });
        return firstIncomplete;
      }
    }
    
    // If all exercises are complete, don't focus on anything
    console.log('[WorkoutNavigation] All exercises are complete, no focus set');
    return null;
  }, [sectionExercises, completedExercises]);

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
    findNextIncompleteFromCurrent,
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