import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { 
  areAllExercisesComplete
} from '@/lib/exerciseNavigation';
import { useWorkoutAutoFocus } from '@/hooks/useAutoFocus';
import { ANIMATION_DURATIONS } from '@/lib/scrollSnap';

interface Exercise {
  exercise_id: string;
  setConfigs?: any[];
  [key: string]: any;
}

interface SectionExercises {
  warmup: Exercise[];
  training: Exercise[];
  cooldown: Exercise[];
  [key: string]: Exercise[];
}

interface LoadedSections {
  warmup: boolean;
  training: boolean;
  cooldown: boolean;
}

interface FocusedExercise extends Exercise {
  section: string | null;
}

interface WorkoutNavigationContextType {
  sectionExercises: SectionExercises;
  loadedSections: LoadedSections;
  completedExercises: Set<string>;
  focusedExercise: FocusedExercise | null;
  isRestoringFocus: boolean;
  updateSectionExercises: (section: string, exercises: Exercise[]) => void;
  markExerciseComplete: (exerciseId: string) => void;
  markExerciseIncomplete: (exerciseId: string) => void;
  setFocusedExerciseId: (exerciseId: string | null, section?: string) => void;
  setSwipeAnimationRunning: (running: boolean) => void;
  handleSectionComplete: (section: string) => Exercise | null;
  isWorkoutComplete: () => boolean;
  getProgressStats: () => {
    total: number;
    completed: number;
    remaining: number;
    percentage: number;
  };
}

const WorkoutNavigationContext = createContext<WorkoutNavigationContextType | null>(null);

export const useWorkoutNavigation = (): WorkoutNavigationContextType => {
  const context = useContext(WorkoutNavigationContext);
  if (!context) {
    throw new Error('useWorkoutNavigation must be used within a WorkoutNavigationProvider');
  }
  return context;
};

// Utility function to find exercise across all sections
const findExerciseInSections = (exerciseId: string, sectionExercises: SectionExercises): { exercise: Exercise | null; section: string | null } => {
  const sections = ['warmup', 'training', 'cooldown'];
  
  for (const sectionName of sections) {
    const exercises = sectionExercises[sectionName as keyof SectionExercises] || [];
    const exercise = exercises.find(ex => ex.exercise_id === exerciseId);
    if (exercise) {
      return { exercise, section: sectionName };
    }
  }
  
  return { exercise: null, section: null };
};

interface WorkoutNavigationProviderProps {
  children: ReactNode;
}

export const WorkoutNavigationProvider = ({ children }: WorkoutNavigationProviderProps) => {
  // Store exercises for each section
  const [sectionExercises, setSectionExercises] = useState<SectionExercises>({
    warmup: [],
    training: [],
    cooldown: []
  });
  // Track which sections have finished their initial load
  const [loadedSections, setLoadedSections] = useState<LoadedSections>({
    warmup: false,
    training: false,
    cooldown: false
  });
  
  // Store completed exercises across all sections
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  
  // Store the currently focused exercise
  const [focusedExercise, setFocusedExercise] = useState<FocusedExercise | null>(null);
  // Timeout handle for deferring focus until previous card collapses
  const pendingFocusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Block focus changes while a swipe completion animation is running
  const isSwipeAnimationRunningRef = useRef<boolean>(false);
  const queuedFocusRef = useRef<{ exerciseId: string; section?: string } | null>(null);
  
  // Flag to prevent auto-focus when restoring from database
  const [isRestoringFocus, setIsRestoringFocus] = useState<boolean>(false);

  // Update exercises for a specific section
  const updateSectionExercises = useCallback((section: string, exercises: Exercise[]) => {
    setSectionExercises(prev => ({
      ...prev,
      [section]: exercises
    }));
    setLoadedSections(prev => ({ ...prev, [section]: true }));
  }, []);

  // Mark an exercise as completed
  const markExerciseComplete = useCallback((exerciseId: string) => {
    setCompletedExercises(prev => new Set([...prev, exerciseId]));
  }, []);

  // Mark an exercise as incomplete (for undo functionality)
  const markExerciseIncomplete = useCallback((exerciseId: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  }, []);

  // Set the focused exercise; when switching between different cards, defer until collapse completes
  const setFocusedExerciseId = useCallback((exerciseId: string | null, section?: string) => {
    if (isSwipeAnimationRunningRef.current) {
      // Defer and queue the most recent focus request until animation finishes
      queuedFocusRef.current = exerciseId ? { exerciseId, section } : null;
      return;
    }
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
        const exercises = sectionExercises[section as keyof SectionExercises] || [];
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
      const exercises = sectionExercises[section as keyof SectionExercises] || [];
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
    setFocusedExerciseId,
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

  const value: WorkoutNavigationContextType = {
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
    // Control flags for swipe animation to serialize transitions
    setSwipeAnimationRunning: (running: boolean) => {
      isSwipeAnimationRunningRef.current = running;
      if (!running && queuedFocusRef.current) {
        const { exerciseId, section } = queuedFocusRef.current;
        queuedFocusRef.current = null;
        // Apply the queued focus now that animations are done
        setFocusedExerciseId(exerciseId, section);
      }
    },
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
