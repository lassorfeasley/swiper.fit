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

type FocusSource = 'user' | 'sync' | 'restore';

interface WorkoutNavigationContextType {
  sectionExercises: SectionExercises;
  loadedSections: LoadedSections;
  completedExercises: Set<string>;
  focusedExercise: FocusedExercise | null; // Alias to activeFocus for backward compatibility
  activeFocus: FocusedExercise | null; // Current UI state - what card is open
  persistedFocus: string | null; // What's in the database - for restoration and sync
  isRestoringFocus: boolean;
  updateSectionExercises: (section: string, exercises: Exercise[]) => void;
  markExerciseComplete: (exerciseId: string) => void;
  markExerciseIncomplete: (exerciseId: string) => void;
  setFocusedExerciseId: (exerciseId: string | null, section?: string, source?: FocusSource) => void;
  setSwipeAnimationRunning: (running: boolean) => void;
  handleSectionComplete: (section: string, justCompletedExerciseId?: string) => Exercise | null;
  isWorkoutComplete: () => boolean;
  getProgressStats: () => {
    total: number;
    completed: number;
    remaining: number;
    percentage: number;
  };
  // Optional callback for DB writes (provided by ActiveWorkout)
  updateLastExercise?: (workoutExerciseId: string) => Promise<void>;
  setUpdateLastExercise?: (callback: (workoutExerciseId: string) => Promise<void>) => void;
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
  
  // Separate active focus (UI state) from persisted focus (DB state)
  const [activeFocus, setActiveFocus] = useState<FocusedExercise | null>(null); // Current UI state
  const [persistedFocus, setPersistedFocus] = useState<string | null>(null); // DB state for sync/restore
  
  // Alias for backward compatibility during migration
  const focusedExercise = activeFocus;
  
  // Block focus changes while a swipe completion animation is running
  const isSwipeAnimationRunningRef = useRef<boolean>(false);
  const queuedFocusRef = useRef<{ exerciseId: string; section?: string; source?: FocusSource } | null>(null);
  
  // Flag to prevent auto-focus when restoring from database
  const [isRestoringFocus, setIsRestoringFocus] = useState<boolean>(false);
  
  // Track last user action timestamp for idle detection
  const lastUserActionRef = useRef<number>(0);
  
  // Callback for DB writes (set by ActiveWorkout)
  const updateLastExerciseRef = useRef<((workoutExerciseId: string) => Promise<void>) | null>(null);
  
  // Track what we last wrote to DB to ignore echo
  const lastWrittenExerciseIdRef = useRef<string | null>(null);

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

  // Set the focused exercise with source-aware logic
  const setFocusedExerciseId = useCallback((exerciseId: string | null, section?: string, source: FocusSource = 'user') => {
    const currentFocusedKey = getExerciseKey(activeFocus);

    // If we're being asked to focus the same exercise that's already focused,
    // skip work entirely to avoid redundant state updates and autoscroll runs.
    if (exerciseId && currentFocusedKey === exerciseId) {
      return;
    }

    if (isSwipeAnimationRunningRef.current) {
      // Defer and queue the most recent focus request until animation finishes
      queuedFocusRef.current = exerciseId ? { exerciseId, section, source } : null;
      return;
    }
    
    if (!exerciseId) {
      setActiveFocus(null);
      if (source === 'user') {
        // User cleared focus - also clear persisted
        setPersistedFocus(null);
      }
      return;
    }

    // Find the exercise object
    let exercise: Exercise | null = null;
    let foundSection: string | null = null;
    
    if (section) {
      const exercises = sectionExercises[section as keyof SectionExercises] || [];
      exercise = exercises.find(ex => exerciseMatchesId(ex, exerciseId)) || null;
      foundSection = section;
    } else {
      const result = findExerciseInSections(exerciseId, sectionExercises);
      exercise = result.exercise;
      foundSection = result.section;
    }

    const exerciseKey = exercise ? (exercise.id || exercise.exercise_id) : exerciseId;

    // Handle based on source
    if (source === 'user') {
      // User action: Update activeFocus immediately, write to DB async
      if (exercise) {
        setActiveFocus({ ...exercise, section: foundSection });
      } else {
        setActiveFocus({ id: exerciseId, exercise_id: exerciseId, section: foundSection });
      }
      
      // Track user action timestamp
      lastUserActionRef.current = Date.now();
      
      // Write to DB (fire-and-forget)
      if (exerciseKey && updateLastExerciseRef.current) {
        lastWrittenExerciseIdRef.current = exerciseKey;
        updateLastExerciseRef.current(exerciseKey).catch(err => {
          console.error('[WorkoutNavigation] Failed to update last exercise:', err);
        });
      }
      
    } else if (source === 'sync') {
      // Sync from remote: Update persistedFocus, only apply to activeFocus if user is idle
      // First check if this is our own write echoing back (ignore echo)
      if (lastWrittenExerciseIdRef.current === exerciseKey) {
        // This is our own write - just update persistedFocus to acknowledge it, but don't change activeFocus
        if (exerciseKey) {
          setPersistedFocus(exerciseKey);
        }
        lastWrittenExerciseIdRef.current = null; // Clear after acknowledging
        return;
      }
      
      // This is a legitimate remote update
      if (exerciseKey) {
        setPersistedFocus(exerciseKey);
      }
      
      // Only apply to activeFocus if user is idle (>2s since last user action)
      const timeSinceUserAction = Date.now() - lastUserActionRef.current;
      if (timeSinceUserAction > 2000) {
        // User is idle - safe to apply sync
        if (exercise) {
          setActiveFocus({ ...exercise, section: foundSection });
        } else if (exerciseId) {
          setActiveFocus({ id: exerciseId, exercise_id: exerciseId, section: foundSection });
        }
      }
      // If user is not idle, leave activeFocus alone (user is actively using the app)
      
    } else if (source === 'restore') {
      // Restoration: Copy persistedFocus to activeFocus
      setIsRestoringFocus(true);
      if (exercise) {
        setActiveFocus({ ...exercise, section: foundSection });
      } else if (exerciseId) {
        setActiveFocus({ id: exerciseId, exercise_id: exerciseId, section: foundSection });
      }
      setIsRestoringFocus(false);
    }
  }, [sectionExercises, activeFocus]);

  // Resolve focus when exercises are loaded (for restoration)
  useEffect(() => {
    if (isRestoringFocus && activeFocus && activeFocus.section === null) {
      const key = getExerciseKey(activeFocus);
      const { exercise, section: foundSection } = key
        ? findExerciseInSections(key, sectionExercises)
        : { exercise: null, section: null };
      
      if (exercise) {
        setActiveFocus({ ...exercise, section: foundSection });
        setIsRestoringFocus(false);
      } else {
        // Exercise still not found in any section, clear restoring flag
        setIsRestoringFocus(false);
      }
    }
  }, [sectionExercises, activeFocus, isRestoringFocus]);

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
    focusedExercise, // Alias to activeFocus for backward compatibility
    activeFocus,
    persistedFocus,
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
        const { exerciseId, section, source } = queuedFocusRef.current;
        queuedFocusRef.current = null;
        // Apply the queued focus now that animations are done
        setFocusedExerciseId(exerciseId, section, source);
      }
    },
    setUpdateLastExercise: (callback: (workoutExerciseId: string) => Promise<void>) => {
      updateLastExerciseRef.current = callback;
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
