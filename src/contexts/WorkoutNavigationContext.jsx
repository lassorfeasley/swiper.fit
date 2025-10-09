import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { 
  areAllExercisesComplete
} from '@/lib/exerciseNavigation';
import { useWorkoutAutoFocus } from '@/hooks/useAutoFocus';
import { ANIMATION_DURATIONS } from '@/lib/scrollSnap';

const WorkoutNavigationContext = createContext();

export const useWorkoutNavigation = () => {
  const context = useContext(WorkoutNavigationContext);
  if (!context) {
    throw new Error('useWorkoutNavigation must be used within a WorkoutNavigationProvider');
  }
  return context;
};

// Utility function to find exercise across all sections
const findExerciseInSections = (exerciseId, sectionExercises) => {
  const sections = ['warmup', 'training', 'cooldown'];
  
  for (const sectionName of sections) {
    const exercises = sectionExercises[sectionName] || [];
    const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
    if (exercise) {
      return { exercise, section: sectionName };
    }
  }
  
  return { exercise: null, section: null };
};

export const WorkoutNavigationProvider = ({ children }) => {
  // Store exercises for each section
  const [sectionExercises, setSectionExercises] = useState({
    warmup: [],
    training: [],
    cooldown: []
  });
  // Track which sections have finished their initial load
  const [loadedSections, setLoadedSections] = useState({
    warmup: false,
    training: false,
    cooldown: false
  });
  
  // Store completed exercises across all sections
  const [completedExercises, setCompletedExercises] = useState(new Set());
  
  // Store the currently focused exercise
  const [focusedExercise, setFocusedExercise] = useState(null);
  // Timeout handle for deferring focus until previous card collapses
  const pendingFocusTimeoutRef = useRef(null);
  
  // Flag to prevent auto-focus when restoring from database
  const [isRestoringFocus, setIsRestoringFocus] = useState(false);

  // Update exercises for a specific section
  const updateSectionExercises = useCallback((section, exercises) => {
    setSectionExercises(prev => ({
      ...prev,
      [section]: exercises
    }));
    setLoadedSections(prev => ({ ...prev, [section]: true }));
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

  // Set the focused exercise; when switching between different cards, defer until collapse completes
  const setFocusedExerciseId = useCallback((exerciseId, section) => {
    if (!exerciseId) {
      setFocusedExercise(null);
      return;
    }

    // Clear any pending focus timer
    if (pendingFocusTimeoutRef.current) {
      clearTimeout(pendingFocusTimeoutRef.current);
      pendingFocusTimeoutRef.current = null;
    }

    const applyFocus = () => {
      if (section) {
        const exercises = sectionExercises[section] || [];
        const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
        if (exercise) {
          setFocusedExercise({ ...exercise, section });
        }
      } else {
        setIsRestoringFocus(true);
        const { exercise, section: foundSection } = findExerciseInSections(exerciseId, sectionExercises);
        if (exercise) {
          setFocusedExercise({ ...exercise, section: foundSection });
          setIsRestoringFocus(false);
        } else {
          setFocusedExercise({ exercise_id: exerciseId, section: null });
        }
      }
    };

    // If switching from one focused exercise to another, first clear focus so the open card collapses,
    // then wait for the collapse animation to finish before focusing the new one.
    if (focusedExercise?.exercise_id && focusedExercise.exercise_id !== exerciseId) {
      setFocusedExercise(null);
      const delay = (ANIMATION_DURATIONS?.CARD_ANIMATION_DURATION_MS ?? 500) + 50;
      pendingFocusTimeoutRef.current = setTimeout(() => {
        applyFocus();
        pendingFocusTimeoutRef.current = null;
      }, delay);
      return;
    }

    if (section) {
      // Search in specific section
      const exercises = sectionExercises[section] || [];
      const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
      
      if (exercise) {
        setFocusedExercise({ ...exercise, section });
      }
    } else {
      // Search across all sections (for restoring focus on page refresh)
      setIsRestoringFocus(true);
      
      const { exercise, section: foundSection } = findExerciseInSections(exerciseId, sectionExercises);
      
      if (exercise) {
        setFocusedExercise({ ...exercise, section: foundSection });
        setIsRestoringFocus(false);
      } else {
        // Store the exercise ID to resolve later when exercises load
        setFocusedExercise({ exercise_id: exerciseId, section: null });
      }
    }
  }, [sectionExercises, focusedExercise]);

  // Resolve focus when exercises are loaded (for restoration)
  useEffect(() => {
    if (isRestoringFocus && focusedExercise && focusedExercise.section === null) {
      const { exercise, section: foundSection } = findExerciseInSections(focusedExercise.exercise_id, sectionExercises);
      
      if (exercise) {
        setFocusedExercise({ ...exercise, section: foundSection });
        setIsRestoringFocus(false);
      } else {
        // Exercise still not found in any section, clear restoring flag
        setIsRestoringFocus(false);
      }
    }
  }, [sectionExercises, focusedExercise, isRestoringFocus]);

  // Use the dedicated auto focus hook
  const { handleSectionComplete } = useWorkoutAutoFocus({
    sectionExercises,
    completedExercises,
    setFocusedExercise,
    isRestoringFocus
  });

  // Debug: Log when focus changes
  useEffect(() => {
    if (focusedExercise) {
      // Clear restoring flag if we successfully restored focus
      if (isRestoringFocus && focusedExercise.section !== null) {
        setIsRestoringFocus(false);
      }
    } else {
      // Clear restoring flag if focus is cleared
      setIsRestoringFocus(false);
    }
  }, [focusedExercise, isRestoringFocus]);



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
    loadedSections,
    completedExercises,
    focusedExercise,
    isRestoringFocus,
    
    // Actions
    updateSectionExercises,
    markExerciseComplete,
    markExerciseIncomplete,
    setFocusedExerciseId,
    handleSectionComplete,
    
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
