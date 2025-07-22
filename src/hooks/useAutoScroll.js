import { useEffect } from 'react';

/**
 * Custom hook for auto-scrolling to focused elements
 * @param {Object} options - Configuration options
 * @param {string|number} options.focusedId - The ID of the currently focused element
 * @param {string} options.elementPrefix - Prefix for element IDs (e.g., 'exercise-')
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 * @param {string} options.scrollBehavior - Scroll behavior ('smooth', 'auto', 'instant')
 */
export const useAutoScroll = ({
  focusedId,
  elementPrefix = '',
  viewportPosition = 0.2,
  scrollBehavior = 'smooth'
}) => {
  useEffect(() => {
    if (!focusedId) return;

    const elementId = elementPrefix ? `${elementPrefix}${focusedId}` : focusedId;
    const element = document.getElementById(elementId);
    
    if (element) {
      // Calculate position to place element at specified viewport position
      const viewportHeight = window.innerHeight;
      const targetPosition = viewportHeight * viewportPosition;
      
      // Get the element's position relative to the viewport
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top;
      
      // Calculate how much to scroll to position the element at target position
      const scrollOffset = elementTop - targetPosition;
      
      // Scroll the window
      window.scrollBy({
        top: scrollOffset,
        behavior: scrollBehavior
      });
    }
  }, [focusedId, elementPrefix, viewportPosition, scrollBehavior]);
};

/**
 * Specialized hook for workout exercise auto-scroll
 * @param {Object} options - Configuration options
 * @param {Object} options.focusedExercise - The currently focused exercise object
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 */
export const useWorkoutAutoScroll = ({
  focusedExercise,
  viewportPosition = 0.2
}) => {
  useAutoScroll({
    focusedId: focusedExercise?.exercise_id,
    elementPrefix: 'exercise-',
    viewportPosition,
    scrollBehavior: 'smooth'
  });
};
