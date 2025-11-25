import { useEffect, useRef } from 'react';

interface AutoScrollOptions {
  focusedId: string | number | null;
  elementPrefix?: string;
  viewportPosition?: number;
  scrollBehavior?: 'smooth' | 'auto' | 'instant';
  debounceMs?: number;
  maxRetries?: number;
  recenterOnIdleMs?: number;
  recenterThresholdPx?: number;
  onScrolled?: () => void;
  /**
   * Optional delay before performing the initial scroll after a focus change.
   * This is useful when the focused element animates its height (e.g. cards
   * expanding/collapsing), so we measure after the layout has settled.
   */
  initialScrollDelayMs?: number;
}

/**
 * Custom hook for auto-scrolling to focused elements
 */
export const useAutoScroll = ({
  focusedId,
  elementPrefix = '',
  viewportPosition = 0.2,
  scrollBehavior = 'smooth',
  debounceMs = 100,
  maxRetries = 10,
  recenterOnIdleMs = 5000,
  recenterThresholdPx = 24,
  onScrolled,
  initialScrollDelayMs = 0
}: AutoScrollOptions): void => {
  // Track the most recent focusedId this hook has seen. This lets us ignore
  // any in-flight retries or idle recenter timers that were scheduled for an
  // older focus target, preventing \"scroll to old card, then back to new card\"
  // glitches when focus changes quickly.
  const latestFocusedIdRef = useRef<string | number | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollAnimationFrameRef = useRef<number | null>(null);

  // Custom smooth scroll with easing for a more natural, less jarring animation
  const smoothScrollTo = (targetY: number, duration: number = 600): void => {
    // Cancel any existing scroll animation
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }

    const startY = window.pageYOffset;
    const distance = targetY - startY;
    let startTime: number | null = null;

    // Ease-in-out cubic function for smooth acceleration and deceleration
    const easeInOutCubic = (t: number): number => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animateScroll = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      
      window.scrollTo(0, startY + distance * eased);
      
      if (progress < 1) {
        scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);
      } else {
        scrollAnimationFrameRef.current = null;
      }
    };

    scrollAnimationFrameRef.current = requestAnimationFrame(animateScroll);
  };

  const scrollToElement = (elementId: string | number): void => {
    // Ignore scroll requests for stale focus targets
    if (latestFocusedIdRef.current !== null && elementId !== latestFocusedIdRef.current) {
      return;
    }

    const fullId = `${elementPrefix}${elementId}`;
    const element = document.getElementById(fullId);
    
    if (!element) {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        scrollTimeoutRef.current = setTimeout(() => {
          scrollToElement(elementId);
        }, debounceMs);
      }
      return;
    }

    // Reset retry count on successful element find
    retryCountRef.current = 0;

    // Check if element height is stable (not still expanding/collapsing)
    // This ensures we measure and scroll when the card is at its final size
    const elementRect = element.getBoundingClientRect();
    const currentHeight = elementRect.height;
    
    // Wait a short time and check if height changed (element still animating)
    const heightCheckDelay = 100; // Check after 100ms
    const heightStabilityThreshold = 2; // Allow 2px tolerance for sub-pixel rendering
    
    scrollTimeoutRef.current = setTimeout(() => {
      // Re-check if this is still the target (might have changed during delay)
      if (latestFocusedIdRef.current !== null && elementId !== latestFocusedIdRef.current) {
        return; // Focus changed, abort
      }
      
      const checkElement = document.getElementById(fullId);
      if (!checkElement) {
        // Element disappeared, retry
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          scrollTimeoutRef.current = setTimeout(() => {
            scrollToElement(elementId);
          }, debounceMs);
        }
        return;
      }
      
      const checkRect = checkElement.getBoundingClientRect();
      const newHeight = checkRect.height;
      const heightChanged = Math.abs(newHeight - currentHeight) > heightStabilityThreshold;
      
      if (heightChanged) {
        // Height is still changing (card expanding/collapsing), retry after a bit
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          scrollTimeoutRef.current = setTimeout(() => {
            scrollToElement(elementId);
          }, debounceMs);
        }
        return;
      }
      
      // Height is stable - proceed with scroll measurement and execution
      const viewportHeight = window.innerHeight;
      const elementTop = checkRect.top + window.pageYOffset;
      
      // Calculate target scroll position so that the TOP of the element
      // sits at viewportPosition * viewportHeight from the top of the viewport.
      const targetScrollTop = elementTop - (viewportHeight * viewportPosition);
      
      // Check if element is already in the desired position
      const currentScrollTop = window.pageYOffset;
      const scrollDifference = Math.abs(currentScrollTop - targetScrollTop);
      
      if (scrollDifference < recenterThresholdPx) {
        return; // Already positioned correctly
      }

      // Perform the scroll with custom smooth animation for better UX
      if (scrollBehavior === 'smooth') {
        smoothScrollTo(targetScrollTop, 600); // 600ms custom eased animation
      } else {
        window.scrollTo({
          top: targetScrollTop,
          behavior: scrollBehavior
        });
      }

      lastScrollTimeRef.current = Date.now();
      onScrolled?.();
    }, heightCheckDelay);
  };

  const clearRecentering = (): void => {
    if (recenterTimeoutRef.current) {
      clearTimeout(recenterTimeoutRef.current);
      recenterTimeoutRef.current = null;
    }
  };

  const scheduleRecentering = (): void => {
    clearRecentering();
    
    if (recenterOnIdleMs && focusedId) {
      recenterTimeoutRef.current = setTimeout(() => {
        scrollToElement(focusedId);
      }, recenterOnIdleMs);
    }
  };

  useEffect(() => {
    // Clear any existing timeouts and animations
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    if (scrollAnimationFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimationFrameRef.current);
      scrollAnimationFrameRef.current = null;
    }
    clearRecentering();

    if (focusedId) {
      // Reset retry count when focusedId changes to a new non-null value
      retryCountRef.current = 0;
      // Record the latest focus target for all subsequent scroll attempts
      latestFocusedIdRef.current = focusedId;

      const performScroll = (): void => {
        // Scroll to the element
        scrollToElement(focusedId);
        // Schedule recentering if configured
        scheduleRecentering();
      };

      // Optionally delay the first scroll so that animated elements
      // (like expanding cards) have time to reach their final height.
      if (initialScrollDelayMs > 0) {
        scrollTimeoutRef.current = setTimeout(performScroll, initialScrollDelayMs);
      } else {
        performScroll();
      }
    } else {
      // When focusedId becomes null (e.g., during card collapse transition),
      // don't clear latestFocusedIdRef - keep it so stale scrolls are still blocked.
      // Only clear timeouts and recentering to stop any in-flight scrolls.
      // This prevents scrolling to an old card when focus is temporarily null.
    }

    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
      clearRecentering();
    };
  }, [focusedId, elementPrefix, viewportPosition, scrollBehavior, debounceMs, maxRetries, recenterOnIdleMs, recenterThresholdPx, initialScrollDelayMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (scrollAnimationFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimationFrameRef.current);
        scrollAnimationFrameRef.current = null;
      }
      clearRecentering();
    };
  }, []);
};
