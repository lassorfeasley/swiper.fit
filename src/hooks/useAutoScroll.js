import { useEffect, useRef } from 'react';

/**
 * Custom hook for auto-scrolling to focused elements
 * @param {Object} options - Configuration options
 * @param {string|number} options.focusedId - The ID of the currently focused element
 * @param {string} options.elementPrefix - Prefix for element IDs (e.g., 'exercise-')
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 * @param {string} options.scrollBehavior - Scroll behavior ('smooth', 'auto', 'instant')
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default 100ms)
 * @param {number} options.maxRetries - Maximum number of retry attempts (default 10)
 * @param {number} options.recenterOnIdleMs - If set, after this many ms of no interaction, recenter focused element (default 5000)
 * @param {number} options.recenterThresholdPx - How far off-target before we recenter (default 24px)
 */
export const useAutoScroll = ({
  focusedId,
  elementPrefix = '',
  viewportPosition = 0.2,
  scrollBehavior = 'smooth',
  debounceMs = 100,
  maxRetries = 10,
  recenterOnIdleMs = 5000,
  recenterThresholdPx = 24
}) => {
  const timeoutRef = useRef(null);
  const lastFocusedIdRef = useRef(null);
  const retryCountRef = useRef(0);
  const idleTimeoutRef = useRef(null);
  const suppressRecenterUntilRef = useRef(0);

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

    // Reset retry count for new focus
    retryCountRef.current = 0;

    // Debounce the scroll action
    timeoutRef.current = setTimeout(() => {
      const elementId = elementPrefix ? `${elementPrefix}${focusedId}` : focusedId;
      
      // Try to find the element
      let element = document.getElementById(elementId);
      
      if (element) {
        // Element found - scroll to it
        performScroll(element, focusedId, viewportPosition, scrollBehavior);
        lastFocusedIdRef.current = focusedId;
        retryCountRef.current = 0; // Reset retry count on success
      } else {
        // Element not found - try alternative approach
        console.log(`[useAutoScroll] Element not found for ${focusedId}, trying alternative approach...`);
        
        // Look for any element with the exercise ID in its attributes or data
        const alternativeElement = document.querySelector(`[data-exercise-id="${focusedId}"]`) ||
                                  document.querySelector(`[data-exercise="${focusedId}"]`) ||
                                  document.querySelector(`[data-id="${focusedId}"]`);
        
        if (alternativeElement) {
          console.log(`[useAutoScroll] Found alternative element for ${focusedId}`);
          performScroll(alternativeElement, focusedId, viewportPosition, scrollBehavior);
          lastFocusedIdRef.current = focusedId;
          retryCountRef.current = 0; // Reset retry count on success
        } else {
          // Last resort: scroll to the first exercise element we can find
          const firstExerciseElement = document.querySelector('[id^="exercise-"]');
          if (firstExerciseElement) {
            console.log(`[useAutoScroll] Scrolling to first available exercise as fallback`);
            performScroll(firstExerciseElement, focusedId, viewportPosition, scrollBehavior);
            lastFocusedIdRef.current = focusedId;
            retryCountRef.current = 0; // Reset retry count on success
          } else {
            // No exercise elements found - retry with exponential backoff
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              const retryDelay = Math.min(100 * Math.pow(2, retryCountRef.current - 1), 2000); // Exponential backoff, max 2s
              console.log(`[useAutoScroll] No exercise elements found, retrying in ${retryDelay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
              
              setTimeout(() => {
                // Trigger a re-render by updating the focusedId ref
                lastFocusedIdRef.current = null;
              }, retryDelay);
            } else {
              console.log(`[useAutoScroll] No exercise elements found after ${maxRetries} attempts - giving up`);
            }
          }
        }
      }
    }, debounceMs);

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [focusedId, elementPrefix, viewportPosition, scrollBehavior, debounceMs, maxRetries]);

  // Helper function to perform the actual scroll
  const performScroll = (element, focusedId, viewportPosition, scrollBehavior) => {
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
        // Suppress idle recenter reaction to our own programmatic scroll
        suppressRecenterUntilRef.current = Date.now() + 600;
      } else {
        console.log(`[useAutoScroll] Skipping scroll for exercise ${focusedId} - offset too small: ${scrollOffset}px`);
      }
    }, 50);
  };

  // === Idle recenter on user inactivity ===
  useEffect(() => {
    if (!focusedId) return;

    const scheduleIdleCheck = () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (recenterOnIdleMs <= 0) return;
      idleTimeoutRef.current = setTimeout(() => {
        // Avoid reacting immediately after our own programmatic scrolls
        if (Date.now() < suppressRecenterUntilRef.current) return;

        const elementId = elementPrefix ? `${elementPrefix}${focusedId}` : focusedId;
        const element = document.getElementById(elementId) ||
                        document.querySelector(`[data-exercise-id="${focusedId}"]`) ||
                        document.querySelector(`[data-exercise="${focusedId}"]`) ||
                        document.querySelector(`[data-id="${focusedId}"]`);
        if (!element) return;

        const viewportHeight = window.innerHeight;
        const targetPosition = viewportHeight * viewportPosition;
        const { top: elementTop } = element.getBoundingClientRect();
        const delta = elementTop - targetPosition;
        if (Math.abs(delta) >= recenterThresholdPx) {
          console.log(`[useAutoScroll] Idle recentering exercise ${focusedId} (delta ${Math.round(delta)}px)`);
          performScroll(element, focusedId, viewportPosition, 'smooth');
        }
      }, recenterOnIdleMs);
    };

    const onAnyInteraction = () => {
      scheduleIdleCheck();
    };

    // Initial schedule (in case the user doesn't interact after focus change)
    scheduleIdleCheck();

    window.addEventListener('scroll', onAnyInteraction, { passive: true });
    window.addEventListener('wheel', onAnyInteraction, { passive: true });
    window.addEventListener('touchstart', onAnyInteraction, { passive: true });
    window.addEventListener('touchmove', onAnyInteraction, { passive: true });
    window.addEventListener('pointerdown', onAnyInteraction, { passive: true });
    window.addEventListener('keydown', onAnyInteraction);

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      window.removeEventListener('scroll', onAnyInteraction);
      window.removeEventListener('wheel', onAnyInteraction);
      window.removeEventListener('touchstart', onAnyInteraction);
      window.removeEventListener('touchmove', onAnyInteraction);
      window.removeEventListener('pointerdown', onAnyInteraction);
      window.removeEventListener('keydown', onAnyInteraction);
    };
  }, [focusedId, elementPrefix, viewportPosition, recenterOnIdleMs, recenterThresholdPx]);
};

/**
 * Specialized hook for workout exercise auto-scroll
 * @param {Object} options - Configuration options
 * @param {Object} options.focusedExercise - The currently focused exercise object
 * @param {number} options.viewportPosition - Position in viewport (0-1, default 0.2 for 20%)
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default 150ms for workouts)
 * @param {number} options.maxRetries - Maximum number of retry attempts (default 15 for workouts)
 */
export const useWorkoutAutoScroll = ({
  focusedExercise,
  viewportPosition = 0.2,
  debounceMs = 150,
  maxRetries = 15
}) => {
  useAutoScroll({
    focusedId: focusedExercise?.exercise_id,
    elementPrefix: 'exercise-',
    viewportPosition,
    scrollBehavior: 'smooth',
    debounceMs,
    maxRetries
  });
};
