import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-scrolling to focused elements
 * @param {Object} options - Configuration options
 * @param {string|number} options.focusedId - The ID of the currently focused element
 * @param {string} options.elementPrefix - Prefix for element IDs (e.g., 'exercise-')
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 * @param {string} options.scrollBehavior - Scroll behavior ('smooth', 'auto', 'instant')
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default 100ms)
 */
export const useAutoScroll = ({
  focusedId,
  elementPrefix = '',
  viewportPosition = 0.2,
  scrollBehavior = 'smooth',
  debounceMs = 100
}) => {
  const timeoutRef = useRef(null);
  const lastFocusedIdRef = useRef(null);

  useEffect(() => {
    if (!focusedId) return;

    // Prevent duplicate scrolls for the same element
    if (lastFocusedIdRef.current === focusedId) {
      return;
    }

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the scroll action
    timeoutRef.current = setTimeout(() => {
      const elementId = elementPrefix ? `${elementPrefix}${focusedId}` : focusedId;
      const element = document.getElementById(elementId);
      
      if (element) {
        // Add a small delay to ensure DOM has updated with new stacking positions
        setTimeout(() => {
          // Calculate position to place element at specified viewport position
          const viewportHeight = window.innerHeight;
          const targetPosition = viewportHeight * viewportPosition;
          
          // Get the element's position relative to the viewport
          const elementRect = element.getBoundingClientRect();
          const elementTop = elementRect.top;
          
          // Calculate how much to scroll to position the element at target position
          const scrollOffset = elementTop - targetPosition;
          
          // Only scroll if the offset is significant (more than 10px)
          if (Math.abs(scrollOffset) > 10) {
            console.log(`[useAutoScroll] Scrolling to exercise ${focusedId}, offset: ${scrollOffset}px`);
            window.scrollBy({
              top: scrollOffset,
              behavior: scrollBehavior
            });
          } else {
            console.log(`[useAutoScroll] Skipping scroll for exercise ${focusedId} - offset too small: ${scrollOffset}px`);
          }
        }, 50); // Small delay to ensure DOM updates
        
        lastFocusedIdRef.current = focusedId;
      }
    }, debounceMs);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [focusedId, elementPrefix, viewportPosition, scrollBehavior, debounceMs]);
};

/**
 * Specialized hook for workout exercise auto-scroll
 * @param {Object} options - Configuration options
 * @param {Object} options.focusedExercise - The currently focused exercise object
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default 150ms for workouts)
 */
export const useWorkoutAutoScroll = ({
  focusedExercise,
  viewportPosition = 0.2,
  debounceMs = 150
}) => {
  useAutoScroll({
    focusedId: focusedExercise?.exercise_id,
    elementPrefix: 'exercise-',
    viewportPosition,
    scrollBehavior: 'smooth',
    debounceMs
  });
};
