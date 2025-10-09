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
  debounceMs = 60,
  maxRetries = 8,
  recenterOnIdleMs = 5000,
  recenterThresholdPx = 40,
  preferNativeScrollIntoView = true
}) => {
  const timeoutRef = useRef(null);
  const lastFocusedIdRef = useRef(null);
  const retryCountRef = useRef(0);
  const idleTimeoutRef = useRef(null);
  const suppressRecenterUntilRef = useRef(0);

  // Helper: wait for layout & paint with a double-RAF
  const afterNextPaint = (cb) => {
    requestAnimationFrame(() => requestAnimationFrame(cb));
  };

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
        performScroll(element, focusedId, viewportPosition, scrollBehavior, preferNativeScrollIntoView);
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
          performScroll(alternativeElement, focusedId, viewportPosition, scrollBehavior, preferNativeScrollIntoView);
          lastFocusedIdRef.current = focusedId;
          retryCountRef.current = 0; // Reset retry count on success
        } else {
          // Last resort: scroll to the first exercise element we can find
          const firstExerciseElement = document.querySelector('[id^="exercise-"]');
          if (firstExerciseElement) {
            console.log(`[useAutoScroll] Scrolling to first available exercise as fallback`);
            performScroll(firstExerciseElement, focusedId, viewportPosition, scrollBehavior, preferNativeScrollIntoView);
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
  }, [focusedId, elementPrefix, viewportPosition, scrollBehavior, debounceMs, maxRetries, preferNativeScrollIntoView]);

  // Helper function to perform the actual scroll
  const performScroll = (element, focusedId, viewportPosition, scrollBehavior, preferNative) => {
    afterNextPaint(() => {
      if (preferNative && typeof element.scrollIntoView === 'function') {
        element.scrollIntoView({ block: 'start', behavior: scrollBehavior });
        suppressRecenterUntilRef.current = Date.now() + 600;
        return;
      }

      // Fallback: compute offset manually
      const viewportHeight = window.innerHeight;
      const targetPosition = viewportHeight * viewportPosition;
      const elementRect = element.getBoundingClientRect();
      const elementTop = elementRect.top;
      const scrollOffset = elementTop - targetPosition;
      if (Math.abs(scrollOffset) > 10) {
        window.scrollBy({ top: scrollOffset, behavior: scrollBehavior });
        suppressRecenterUntilRef.current = Date.now() + 600;
      }
    });
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

        // If using native scrolling, rely on CSS scroll-margin-top alignment
        if (preferNativeScrollIntoView && typeof element.scrollIntoView === 'function') {
          const { top } = element.getBoundingClientRect();
          if (Math.abs(top) >= recenterThresholdPx) {
            element.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        } else {
          const viewportHeight = window.innerHeight;
          const targetPosition = viewportHeight * viewportPosition;
          const { top: elementTop } = element.getBoundingClientRect();
          const delta = elementTop - targetPosition;
          if (Math.abs(delta) >= recenterThresholdPx) {
            performScroll(element, focusedId, viewportPosition, 'smooth', preferNativeScrollIntoView);
          }
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
  }, [focusedId, elementPrefix, viewportPosition, recenterOnIdleMs, recenterThresholdPx, preferNativeScrollIntoView]);
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
  debounceMs = 60,
  maxRetries = 8,
  recenterOnIdleMs = 0,
  recenterThresholdPx = 40
}) => {
  useAutoScroll({
    focusedId: focusedExercise?.exercise_id,
    elementPrefix: 'exercise-',
    viewportPosition,
    scrollBehavior: 'smooth',
    debounceMs,
    maxRetries,
    recenterOnIdleMs,
    recenterThresholdPx,
    preferNativeScrollIntoView: true
  });
};
