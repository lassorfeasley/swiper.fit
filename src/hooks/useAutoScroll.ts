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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToElement = (elementId: string | number): void => {
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

    const elementRect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const elementTop = elementRect.top + window.pageYOffset;
    const elementHeight = elementRect.height;
    
    // Calculate target scroll position
    const targetScrollTop = elementTop - (viewportHeight * viewportPosition) + (elementHeight * viewportPosition);
    
    // Check if element is already in the desired position
    const currentScrollTop = window.pageYOffset;
    const scrollDifference = Math.abs(currentScrollTop - targetScrollTop);
    
    if (scrollDifference < recenterThresholdPx) {
      return; // Already positioned correctly
    }

    // Perform the scroll
    window.scrollTo({
      top: targetScrollTop,
      behavior: scrollBehavior
    });

    lastScrollTimeRef.current = Date.now();
    onScrolled?.();
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
    // Clear any existing timeouts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    clearRecentering();

    if (focusedId) {
      // Reset retry count when focusedId changes
      retryCountRef.current = 0;

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
    }

    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
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
      clearRecentering();
    };
  }, []);
};
