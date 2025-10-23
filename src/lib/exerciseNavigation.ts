/**
 * Exercise navigation utilities for cross-section workout flow
 */

/**
 * Section order for navigation
 */
export const SECTION_ORDER = ['warmup', 'training', 'cooldown'] as const;

export type SectionName = typeof SECTION_ORDER[number];

/**
 * Exercise interface for navigation
 */
export interface Exercise {
  exercise_id: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Exercise with section information
 */
export interface ExerciseWithSection extends Exercise {
  section: SectionName;
}

/**
 * Section exercises mapping
 */
export interface SectionExercises {
  [key: string]: Exercise[];
}

/**
 * Find the next incomplete exercise across all sections
 */
export const findNextIncompleteExercise = (
  allExercises: Exercise[],
  currentExerciseId: string,
  completedExercises: Set<string>
): Exercise | null => {
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
 */
export const findFirstIncompleteInSection = (
  exercises: Exercise[],
  completedExercises: Set<string>
): Exercise | null => {
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
 */
export const findLastIncompleteInSection = (
  exercises: Exercise[],
  completedExercises: Set<string>
): Exercise | null => {
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
 */
export const getNextSection = (currentSection: SectionName): SectionName | null => {
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  if (currentIndex === -1 || currentIndex === SECTION_ORDER.length - 1) {
    return null;
  }
  return SECTION_ORDER[currentIndex + 1];
};

/**
 * Get the previous section in order
 */
export const getPreviousSection = (currentSection: SectionName): SectionName | null => {
  const currentIndex = SECTION_ORDER.indexOf(currentSection);
  if (currentIndex <= 0) {
    return null;
  }
  return SECTION_ORDER[currentIndex - 1];
};

/**
 * Smart navigation logic for when a section is completed
 */
export const getNextExerciseAfterSectionComplete = (
  completedSection: SectionName,
  sectionExercises: SectionExercises,
  completedExercises: Set<string>
): ExerciseWithSection | null => {
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
 */
export const areAllExercisesComplete = (
  sectionExercises: SectionExercises,
  completedExercises: Set<string>
): boolean => {
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
