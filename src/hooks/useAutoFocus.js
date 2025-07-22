import { useCallback, useRef } from 'react';

/**
 * Generic auto focus hook for managing focus state
 * @param {Object} options - Configuration options
 * @param {Array} options.items - Array of items to manage focus for
 * @param {Function} options.setFocusedItem - Function to set the focused item
 * @param {Function} options.isItemComplete - Function to check if an item is complete
 * @param {string} options.itemIdKey - Key to use for item ID (default: 'id')
 */
export const useAutoFocus = ({
  items = [],
  setFocusedItem,
  isItemComplete = () => false,
  itemIdKey = 'id'
}) => {
  const lastFocusedIdRef = useRef(null);

  // Focus on the first incomplete item
  const focusFirstIncomplete = useCallback(() => {
    const firstIncomplete = items.find(item => !isItemComplete(item[itemIdKey]));
    
    if (firstIncomplete) {
      const itemId = firstIncomplete[itemIdKey];
      
      // Prevent duplicate focus calls
      if (lastFocusedIdRef.current === itemId) {
        return firstIncomplete;
      }
      
      setFocusedItem(firstIncomplete);
      lastFocusedIdRef.current = itemId;
      return firstIncomplete;
    }
    
    return null;
  }, [items, setFocusedItem, isItemComplete, itemIdKey]);

  // Focus on the next incomplete item after a given item
  const focusNextIncomplete = useCallback((currentItemId) => {
    const currentIndex = items.findIndex(item => item[itemIdKey] === currentItemId);
    
    if (currentIndex === -1) {
      return null;
    }
    
    // Look for next incomplete item after current position
    for (let i = currentIndex + 1; i < items.length; i++) {
      const item = items[i];
      if (!isItemComplete(item[itemIdKey])) {
        const itemId = item[itemIdKey];
        
        // Prevent duplicate focus calls
        if (lastFocusedIdRef.current === itemId) {
          return item;
        }
        
        setFocusedItem(item);
        lastFocusedIdRef.current = itemId;
        return item;
      }
    }
    
    // If no next item found, look for previous incomplete item
    for (let i = currentIndex - 1; i >= 0; i--) {
      const item = items[i];
      if (!isItemComplete(item[itemIdKey])) {
        const itemId = item[itemIdKey];
        
        // Prevent duplicate focus calls
        if (lastFocusedIdRef.current === itemId) {
          return item;
        }
        
        setFocusedItem(item);
        lastFocusedIdRef.current = itemId;
        return item;
      }
    }
    
    return null;
  }, [items, setFocusedItem, isItemComplete, itemIdKey]);

  // Check if all items are complete
  const areAllItemsComplete = useCallback(() => {
    return items.every(item => isItemComplete(item[itemIdKey]));
  }, [items, isItemComplete, itemIdKey]);

  return {
    focusFirstIncomplete,
    focusNextIncomplete,
    areAllItemsComplete
  };
};

/**
 * Specialized hook for workout exercise auto focus
 * @param {Object} options - Configuration options
 * @param {Object} options.sectionExercises - Object with exercises for each section
 * @param {Set} options.completedExercises - Set of completed exercise IDs
 * @param {Function} options.setFocusedExercise - Function to set the focused exercise
 * @param {boolean} options.isRestoringFocus - Flag to prevent auto-focus when restoring from database
 */
export const useWorkoutAutoFocus = ({
  sectionExercises,
  completedExercises,
  setFocusedExercise,
  isRestoringFocus = false
}) => {
  const lastFocusedExerciseIdRef = useRef(null);

  // Flatten all exercises into a single array for cross-section navigation
  const allExercises = [
    ...sectionExercises.warmup.map(ex => ({ ...ex, section: 'warmup' })),
    ...sectionExercises.training.map(ex => ({ ...ex, section: 'training' })),
    ...sectionExercises.cooldown.map(ex => ({ ...ex, section: 'cooldown' }))
  ];

  const isExerciseComplete = useCallback((exerciseId) => {
    return completedExercises.has(exerciseId);
  }, [completedExercises]);

  const baseAutoFocus = useAutoFocus({
    items: allExercises,
    setFocusedItem: setFocusedExercise,
    isItemComplete: isExerciseComplete,
    itemIdKey: 'exercise_id'
  });

  // Focus on the first incomplete exercise in the workout
  const focusFirstExercise = useCallback(() => {
    // Don't auto-focus if we're restoring focus from database
    if (isRestoringFocus) {
      return null;
    }
    
    const sections = ['warmup', 'training', 'cooldown'];
    
    for (const section of sections) {
      const exercises = sectionExercises[section] || [];
      const firstIncomplete = exercises.find(ex => !completedExercises.has(ex.exercise_id));
      
      if (firstIncomplete) {
        const exerciseId = firstIncomplete.exercise_id;
        
        // Prevent duplicate focus calls
        if (lastFocusedExerciseIdRef.current === exerciseId) {
          return firstIncomplete;
        }
        
        setFocusedExercise({ ...firstIncomplete, section });
        lastFocusedExerciseIdRef.current = exerciseId;
        return firstIncomplete;
      }
    }
    
    // If all exercises are complete, don't focus on anything
    return null;
  }, [sectionExercises, completedExercises, setFocusedExercise, isRestoringFocus]);

  // Handle section completion and find next exercise
  const handleSectionComplete = useCallback((completedSection) => {
    // First, try to find the first incomplete exercise in the next section
    const getNextSection = (currentSection) => {
      const sections = ['warmup', 'training', 'cooldown'];
      const currentIndex = sections.indexOf(currentSection);
      return currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null;
    };

    const findFirstIncompleteInSection = (exercises, completedExercises) => {
      return exercises.find(ex => !completedExercises.has(ex.exercise_id));
    };

    const nextSection = getNextSection(completedSection);
    if (nextSection && sectionExercises[nextSection]) {
      const nextExercise = findFirstIncompleteInSection(sectionExercises[nextSection], completedExercises);
      if (nextExercise) {
        const exerciseId = nextExercise.exercise_id;
        
        // Prevent duplicate focus calls
        if (lastFocusedExerciseIdRef.current === exerciseId) {
          return { ...nextExercise, section: nextSection };
        }
        
        const result = { ...nextExercise, section: nextSection };
        setFocusedExercise(result);
        lastFocusedExerciseIdRef.current = exerciseId;
        return result;
      }
    }
    
    // If no next section or no incomplete exercises in next section,
    // look for any incomplete exercises in subsequent sections
    const sections = ['warmup', 'training', 'cooldown'];
    const currentIndex = sections.indexOf(completedSection);
    
    for (let i = currentIndex + 1; i < sections.length; i++) {
      const sectionName = sections[i];
      if (sectionExercises[sectionName]) {
        const exercise = findFirstIncompleteInSection(sectionExercises[sectionName], completedExercises);
        if (exercise) {
          const exerciseId = exercise.exercise_id;
          
          // Prevent duplicate focus calls
          if (lastFocusedExerciseIdRef.current === exerciseId) {
            return { ...exercise, section: sectionName };
          }
          
          const result = { ...exercise, section: sectionName };
          setFocusedExercise(result);
          lastFocusedExerciseIdRef.current = exerciseId;
          return result;
        }
      }
    }
    
    // If no incomplete exercises found in subsequent sections,
    // look for incomplete exercises in previous sections
    for (let i = currentIndex - 1; i >= 0; i--) {
      const sectionName = sections[i];
      if (sectionExercises[sectionName]) {
        const exercise = findFirstIncompleteInSection(sectionExercises[sectionName], completedExercises);
        if (exercise) {
          const exerciseId = exercise.exercise_id;
          
          // Prevent duplicate focus calls
          if (lastFocusedExerciseIdRef.current === exerciseId) {
            return { ...exercise, section: sectionName };
          }
          
          const result = { ...exercise, section: sectionName };
          setFocusedExercise(result);
          lastFocusedExerciseIdRef.current = exerciseId;
          return result;
        }
      }
    }
    
    // If no incomplete exercises found anywhere, return null to end workout
    setFocusedExercise(null);
    return null;
  }, [sectionExercises, completedExercises, setFocusedExercise]);

  return {
    ...baseAutoFocus,
    handleSectionComplete
  };
};
