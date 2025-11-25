import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { 
  areAllExercisesComplete
} from '@/lib/exerciseNavigation';
import { useWorkoutAutoFocus } from '@/hooks/useAutoFocus';
import { ANIMATION_DURATIONS } from '@/lib/scrollSnap';

interface Exercise {
  id?: string;
  workoutExerciseId?: string;
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
  handleSectionComplete: (section: string, justCompletedExerciseId?: string) => Exercise | null;
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
const getExerciseKey = (exercise?: Exercise | null): string | null => {
  if (!exercise) return null;
  return (
    (typeof exercise.id === 'string' && exercise.id) ||
    (typeof exercise.workoutExerciseId === 'string' && exercise.workoutExerciseId) ||
    (typeof exercise.exercise_id === 'string' && exercise.exercise_id) ||
    null
  );
};

const exerciseMatchesId = (exercise: Exercise, exerciseId: string): boolean => {
  if (!exerciseId) return false;
  return (
    exercise.id === exerciseId ||
    exercise.workoutExerciseId === exerciseId ||
    exercise.exercise_id === exerciseId
  );
};

const findExerciseInSections = (
  exerciseId: string,
  sectionExercises: SectionExercises
): { exercise: Exercise | null; section: string | null } => {
  const sections = ['warmup', 'training', 'cooldown'];
  
  for (const sectionName of sections) {
    const exercises = sectionExercises[sectionName as keyof SectionExercises] || [];
    const exercise = exercises.find(ex => exerciseMatchesId(ex, exerciseId));
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
  // Track the ID of the exercise we are waiting to focus.
  // This guards against redundant focus requests (e.g. from real-time sync echoes)
  // clobbering the transition animation.
  const pendingFocusIdRef = useRef<string | null>(null);
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
    if (!exerciseId) return;
    setCompletedExercises(prev => new Set([...prev, exerciseId]));
  }, []);

  // Mark an exercise as incomplete (for undo functionality)
  const markExerciseIncomplete = useCallback((exerciseId: string) => {
    if (!exerciseId) return;
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      newSet.delete(exerciseId);
      return newSet;
    });
  }, []);

  // Set the focused exercise; when switching between different cards, defer until collapse completes
  const setFocusedExerciseId = useCallback((exerciseId: string | null, section?: string) => {
    const currentFocusedKey = getExerciseKey(focusedExercise);

    // If we're being asked to focus the same exercise that's already focused,
    // skip work entirely to avoid redundant state updates and autoscroll runs.
    if (exerciseId && currentFocusedKey === exerciseId) {
      return;
    }

    // If we are already in a transition to this exact exercise (pendingFocusIdRef matches),
    // ignore this request to prevent clobbering the animation timer.
    // This commonly happens when a local focus change triggers a DB update,
    // and the real-time subscription echoes that update back immediately.
    if (pendingFocusTimeoutRef.current && pendingFocusIdRef.current === exerciseId) {
      return;
    }

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
      // If we force-cleared the timeout (e.g. user tapped a different card),
      // clear the pending ID too.
      pendingFocusIdRef.current = null;
    }

    const applyFocus = () => {
      if (section) {
        const exercises = sectionExercises[section as keyof SectionExercises] || [];
        const exercise = exercises.find(ex => exerciseMatchesId(ex, exerciseId));
        if (exercise) {
          setFocusedExercise({ ...exercise, section });
        }
      } else {
        setIsRestoringFocus(true);
        const { exercise, section: foundSection } = findExerciseInSections(exerciseId, sectionExercises);
        if (exercise) {
          setFocusedExercise({ ...exercise, section: foundSection });
          setIsRestoringFocus(false);
        } else if (exerciseId) {
          setFocusedExercise({ id: exerciseId, exercise_id: exerciseId, section: null });
        } else {
          setFocusedExercise(null);
          setIsRestoringFocus(false);
        }
      }
    };

    // If switching from one focused exercise to another, first clear focus so the open card collapses,
    // then wait for the collapse animation to finish before focusing the new one.
    if (currentFocusedKey && currentFocusedKey !== exerciseId) {
      setFocusedExercise(null);
      const delay = (ANIMATION_DURATIONS?.CARD_ANIMATION_DURATION_MS ?? 500);
      // Track the pending focus target
      pendingFocusIdRef.current = exerciseId;
      
      pendingFocusTimeoutRef.current = setTimeout(() => {
        applyFocus();
        pendingFocusTimeoutRef.current = null;
        pendingFocusIdRef.current = null;
      }, delay);
      return;
    }

    if (section) {
      const exercises = sectionExercises[section as keyof SectionExercises] || [];
      const exercise = exercises.find(ex => exerciseMatchesId(ex, exerciseId));
      if (exercise) {
        setFocusedExercise({ ...exercise, section });
      }
    } else {
      setIsRestoringFocus(true);
      const { exercise, section: foundSection } = findExerciseInSections(exerciseId, sectionExercises);
      if (exercise) {
        setFocusedExercise({ ...exercise, section: foundSection });
        setIsRestoringFocus(false);
      } else if (exerciseId) {
        setFocusedExercise({ id: exerciseId, exercise_id: exerciseId, section: null });
      } else {
        setFocusedExercise(null);
        setIsRestoringFocus(false);
      }
    }
  }, [sectionExercises, focusedExercise]);

  // Resolve focus when exercises are loaded (for restoration)
  useEffect(() => {
    if (isRestoringFocus && focusedExercise && focusedExercise.section === null) {
      const key = getExerciseKey(focusedExercise);
      const { exercise, section: foundSection } = key
        ? findExerciseInSections(key, sectionExercises)
        : { exercise: null, section: null };
      
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
    setFocusedExerciseId
  });

  // Debug: Log when focus changes
  useEffect(() => {
    if (focusedExercise) {
      // Clear restoring flag if we successfully restored focus
      if (isRestoringFocus && focusedExercise.section !== null) {
        console.log(
          '[WorkoutNavigation] Focus restored successfully:',
          getExerciseKey(focusedExercise),
          'in section:',
          focusedExercise.section
        );
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
