/**
 * Exercise navigation utilities for cross-section workout flow
 */

/**
 * Section order for navigation
 */
export const SECTION_ORDER = ['warmup', 'training', 'cooldown'];

/**
 * Find the next incomplete exercise across all sections
 * @param {Array} allExercises - Array of all exercises from all sections
 * @param {string} currentExerciseId - ID of the currently completed exercise
 * @param {Set} completedExercises - Set of completed exercise IDs
 * @returns {Object|null} Next exercise to focus on, or null if none found
 */
export const findNextIncompleteExercise = (allExercises, currentExerciseId, completedExercises) => {
  if (!allExercises || allExercises.length === 0) return null;
  
  const currentIndex = allExercises.findIndex(ex => ex.exercise_id === currentExerciseId);
  
  // Look for next incomplete exercise after current position
  for (let i = currentIndex + 1; i < allExercises.length; i++) {
    const ex = allExercises[i];
    if (!completedExercises.has(ex.exercise_id)) {
      return ex;
    }
  }
  
  // If no next exercise found, look for previous incomplete exercise
  for (let i = currentIndex - 1; i >= 0; i--) {
    const ex = allExercises[i];
    if (!completedExercises.has(ex.exercise_id)) {
      return ex;
    }
  }
  
  return null;
};

/**
 * Find the first incomplete exercise in a specific section
 * @param {Array} exercises - Array of exercises in the section
 * @param {Set} completedExercises - Set of completed exercise IDs
 * @returns {Object|null} First incomplete exercise, or null if all complete
 */
export const findFirstIncompleteInSection = (exercises, completedExercises) => {
  if (!exercises || exercises.length === 0) return null;
  
  for (const exercise of exercises) {
    if (!completedExercises.has(exercise.exercise_id)) {
      return exercise;
    }
  }
  
  return null;
};

/**
 * Find the last incomplete exercise in a specific section
 * @param {Array} exercises - Array of exercises in the section
 * @param {Set} completedExercises - Set of completed exercise IDs
 * @returns {Object|null} Last incomplete exercise, or null if all complete
 */
export const findLastIncompleteInSection = (exercises, completedExercises) => {
  if (!exercises || exercises.length === 0) return null;
  
  for (let i = exercises.length - 1; i >= 0; i--) {
    const exercise = exercises[i];
    if (!completedExercises.has(exercise.exercise_id)) {
      return exercise;
    }
  }
  
  return null;
};

/**
 * Get the next section in order
 * @param {string} currentSection - Current section name
 * @returns {string|null} Next section name, or null if at the end
 */
export const getNextSection = (currentSection) => {
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  if (currentIndex === -1 || currentIndex === SECTION_ORDER.length - 1) {
    return null;
  }
  return SECTION_ORDER[currentIndex + 1];
};

/**
 * Get the previous section in order
 * @param {string} currentSection - Current section name
 * @returns {string|null} Previous section name, or null if at the beginning
 */
export const getPreviousSection = (currentSection) => {
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  if (currentIndex <= 0) {
    return null;
  }
  return SECTION_ORDER[currentIndex - 1];
};

/**
 * Smart navigation logic for when a section is completed
 * @param {string} completedSection - The section that was just completed
 * @param {Object} sectionExercises - Object with exercises for each section
 * @param {Set} completedExercises - Set of all completed exercise IDs
 * @returns {Object|null} Exercise to focus on next, or null if workout should end
 */
export const getNextExerciseAfterSectionComplete = (completedSection, sectionExercises, completedExercises) => {
  // First, try to find the first incomplete exercise in the next section
  const nextSection = getNextSection(completedSection);
  if (nextSection && sectionExercises[nextSection]) {
    const nextExercise = findFirstIncompleteInSection(sectionExercises[nextSection], completedExercises);
    if (nextExercise) {
      return { ...nextExercise, section: nextSection };
    }
  }
  
  // If no next section or no incomplete exercises in next section,
  // look for any incomplete exercises in subsequent sections
  const currentIndex = SECTION_ORDER.indexOf(completedSection);
  for (let i = currentIndex + 1; i < SECTION_ORDER.length; i++) {
    const sectionName = SECTION_ORDER[i];
    if (sectionExercises[sectionName]) {
      const exercise = findFirstIncompleteInSection(sectionExercises[sectionName], completedExercises);
      if (exercise) {
        return { ...exercise, section: sectionName };
      }
    }
  }
  
  // If no incomplete exercises found in subsequent sections,
  // look for incomplete exercises in previous sections
  for (let i = currentIndex - 1; i >= 0; i--) {
    const sectionName = SECTION_ORDER[i];
    if (sectionExercises[sectionName]) {
      const exercise = findLastIncompleteInSection(sectionExercises[sectionName], completedExercises);
      if (exercise) {
        return { ...exercise, section: sectionName };
      }
    }
  }
  
  // If no incomplete exercises found anywhere, return null to end workout
  return null;
};

/**
 * Check if all exercises across all sections are complete
 * @param {Object} sectionExercises - Object with exercises for each section
 * @param {Set} completedExercises - Set of all completed exercise IDs
 * @returns {boolean} True if all exercises are complete
 */
export const areAllExercisesComplete = (sectionExercises, completedExercises) => {
  for (const sectionName of SECTION_ORDER) {
    if (sectionExercises[sectionName]) {
      for (const exercise of sectionExercises[sectionName]) {
        if (!completedExercises.has(exercise.exercise_id)) {
          return false;
        }
      }
    }
  }
  return true;
}; 