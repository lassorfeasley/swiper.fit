import { useCallback, useRef } from 'react';

interface AutoFocusOptions<T> {
  items?: T[];
  setFocusedItem: (item: T | null) => void;
  isItemComplete?: (itemId: string) => boolean;
  itemIdKey?: keyof T;
}

interface WorkoutAutoFocusOptions {
  sectionExercises: Record<string, any[]>;
  completedExercises: Set<string>;
  setFocusedExerciseId: (exerciseId: string | null, section?: string) => void;
  isRestoringFocus: boolean;
}

/**
 * Generic auto focus hook for managing focus state
 */
export const useAutoFocus = <T extends Record<string, any>>({
  items = [],
  setFocusedItem,
  isItemComplete = () => false,
  itemIdKey = 'id' as keyof T
}: AutoFocusOptions<T>) => {
  const lastFocusedIdRef = useRef<string | null>(null);

  // Focus on the first incomplete item
  const focusFirstIncomplete = useCallback((): T | null => {
    const firstIncomplete = items.find(item => !isItemComplete(item[itemIdKey] as string));
    
    if (firstIncomplete) {
      const itemId = firstIncomplete[itemIdKey] as string;
      
      // Prevent duplicate focus calls
      if (lastFocusedIdRef.current === itemId) {
        return firstIncomplete;
      }
      
      lastFocusedIdRef.current = itemId;
      setFocusedItem(firstIncomplete);
      return firstIncomplete;
    }
    
    // No incomplete items found
    lastFocusedIdRef.current = null;
    setFocusedItem(null);
    return null;
  }, [items, setFocusedItem, isItemComplete, itemIdKey]);

  // Focus on the next incomplete item after the current one
  const focusNextIncomplete = useCallback((currentItemId: string): T | null => {
    const currentIndex = items.findIndex(item => item[itemIdKey] === currentItemId);
    
    if (currentIndex === -1) {
      return focusFirstIncomplete();
    }
    
    // Look for next incomplete item
    for (let i = currentIndex + 1; i < items.length; i++) {
      const item = items[i];
      if (!isItemComplete(item[itemIdKey] as string)) {
        const itemId = item[itemIdKey] as string;
        
        // Prevent duplicate focus calls
        if (lastFocusedIdRef.current === itemId) {
          return item;
        }
        
        lastFocusedIdRef.current = itemId;
        setFocusedItem(item);
        return item;
      }
    }
    
    // No next incomplete item found, focus on first incomplete
    return focusFirstIncomplete();
  }, [items, setFocusedItem, isItemComplete, itemIdKey, focusFirstIncomplete]);

  // Focus on the previous incomplete item before the current one
  const focusPreviousIncomplete = useCallback((currentItemId: string): T | null => {
    const currentIndex = items.findIndex(item => item[itemIdKey] === currentItemId);
    
    if (currentIndex === -1) {
      return focusFirstIncomplete();
    }
    
    // Look for previous incomplete item
    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = items[i];
      if (!isItemComplete(item[itemIdKey] as string)) {
        const itemId = item[itemIdKey] as string;
        
        // Prevent duplicate focus calls
        if (lastFocusedIdRef.current === itemId) {
          return item;
        }
        
        lastFocusedIdRef.current = itemId;
        setFocusedItem(item);
        return item;
      }
    }
    
    // No previous incomplete item found, focus on first incomplete
    return focusFirstIncomplete();
  }, [items, setFocusedItem, isItemComplete, itemIdKey, focusFirstIncomplete]);

  // Clear focus
  const clearFocus = useCallback((): void => {
    lastFocusedIdRef.current = null;
    setFocusedItem(null);
  }, [setFocusedItem]);

  // Reset focus to first incomplete
  const resetFocus = useCallback((): T | null => {
    lastFocusedIdRef.current = null;
    return focusFirstIncomplete();
  }, [focusFirstIncomplete]);

  return {
    focusFirstIncomplete,
    focusNextIncomplete,
    focusPreviousIncomplete,
    clearFocus,
    resetFocus,
    lastFocusedId: lastFocusedIdRef.current
  };
};

/**
 * Workout-specific auto focus hook
 */
export const useWorkoutAutoFocus = ({
  sectionExercises,
  completedExercises,
  setFocusedExerciseId,
  isRestoringFocus
}: WorkoutAutoFocusOptions) => {
  
  const handleSectionComplete = useCallback((section: string): any => {
    console.log(`[useAutoFocus] Section "${section}" completed, looking for next exercise...`);
    
    if (isRestoringFocus) {
      console.log('[useAutoFocus] Skipping auto-focus (restoring focus)');
      return null; // Don't auto-focus during restoration
    }
    
    const exercises = sectionExercises[section] || [];
    const incompleteExercises = exercises.filter(exercise => 
      !completedExercises.has(exercise.exercise_id)
    );
    
    if (incompleteExercises.length > 0) {
      // Focus on the first incomplete exercise in this section
      const firstIncomplete = incompleteExercises[0];
      console.log(`[useAutoFocus] Found incomplete exercise in "${section}":`, firstIncomplete.exercise_id);
      setFocusedExerciseId(firstIncomplete.exercise_id, section);
      return firstIncomplete;
    } else {
      // All exercises in this section are complete, look for next section
      console.log(`[useAutoFocus] All exercises in "${section}" complete, checking next sections...`);
      const sections = ['warmup', 'training', 'cooldown'];
      const currentSectionIndex = sections.indexOf(section);
      
      for (let i = currentSectionIndex + 1; i < sections.length; i++) {
        const nextSection = sections[i];
        const nextSectionExercises = sectionExercises[nextSection] || [];
        const nextIncompleteExercises = nextSectionExercises.filter(exercise => 
          !completedExercises.has(exercise.exercise_id)
        );
        
        console.log(`[useAutoFocus] Checking section "${nextSection}": ${nextIncompleteExercises.length} incomplete exercises`);
        
        if (nextIncompleteExercises.length > 0) {
          const firstIncomplete = nextIncompleteExercises[0];
          console.log(`[useAutoFocus] Moving focus to "${nextSection}":`, firstIncomplete.exercise_id);
          setFocusedExerciseId(firstIncomplete.exercise_id, nextSection);
          return firstIncomplete;
        }
      }
      
      // No more incomplete exercises found
      console.log('[useAutoFocus] No more incomplete exercises found - workout complete!');
      setFocusedExerciseId(null);
      return null;
    }
  }, [sectionExercises, completedExercises, setFocusedExerciseId, isRestoringFocus]);

  return {
    handleSectionComplete
  };
};
