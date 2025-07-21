import { useCallback, useEffect, useRef, useState } from 'react';
import { scrollIntoView } from '@/lib/scroll';

/**
 * Custom hook for managing focus and automatic scrolling
 * @param {Object} options - Configuration options
 * @param {number} options.scrollDelay - Delay before scrolling in milliseconds
 * @param {string} options.scrollBehavior - Scroll behavior ('smooth', 'auto', 'instant')
 * @param {string} options.scrollBlock - Vertical alignment for scrollIntoView
 * @param {boolean} options.enableHeightTracking - Whether to track element height changes
 * @param {boolean} options.enableAutoScroll - Whether to automatically scroll on focus change
 * @param {number} options.scrollOffset - Additional offset to apply when scrolling
 * @returns {Object} Object containing focus management utilities
 */
export const useFocusScroll = (options = {}) => {
  const {
    scrollDelay = 0,
    scrollBehavior = 'smooth',
    scrollBlock = 'start',
    enableHeightTracking = true,
    enableAutoScroll = true,
    scrollOffset = 0
  } = options;
  
  const [focusedNode, setFocusedNode] = useState(null);
  const [focusedHeight, setFocusedHeight] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  // Ref for the currently focused element
  const focusRef = useCallback((node) => {
    if (node !== null) {
      setFocusedNode(node);
      setIsFocused(true);
    } else {
      setFocusedNode(null);
      setIsFocused(false);
    }
  }, []);
  
  // Height tracking with ResizeObserver
  useEffect(() => {
    if (!focusedNode || !enableHeightTracking) return;
    
    const resizeObserver = new ResizeObserver(() => {
      setFocusedHeight(focusedNode.offsetHeight);
    });
    
    resizeObserver.observe(focusedNode);
    return () => resizeObserver.disconnect();
  }, [focusedNode, enableHeightTracking]);
  
  // Auto-scroll on focus change
  useEffect(() => {
    if (!focusedNode || !enableAutoScroll) return;
    
    scrollIntoView(focusedNode, {
      behavior: scrollBehavior,
      block: scrollBlock,
      delay: scrollDelay,
      offset: scrollOffset
    });
  }, [focusedNode, enableAutoScroll, scrollBehavior, scrollBlock, scrollDelay, scrollOffset]);
  
  // Manual scroll function
  const scrollToFocused = useCallback(() => {
    if (!focusedNode) return;
    
    scrollIntoView(focusedNode, {
      behavior: scrollBehavior,
      block: scrollBlock,
      delay: scrollDelay,
      offset: scrollOffset
    });
  }, [focusedNode, scrollBehavior, scrollBlock, scrollDelay, scrollOffset]);
  
  // Focus management functions
  const focusElement = useCallback((element) => {
    if (element) {
      focusRef(element);
    }
  }, [focusRef]);
  
  const clearFocus = useCallback(() => {
    setFocusedNode(null);
    setIsFocused(false);
    setFocusedHeight(0);
  }, []);
  
  return {
    // State
    focusedNode,
    focusedHeight,
    isFocused,
    
    // Refs
    focusRef,
    
    // Actions
    focusElement,
    clearFocus,
    scrollToFocused
  };
};

/**
 * Specialized hook for workout exercise focus management
 * @param {Object} options - Configuration options
 * @param {number} options.animationDuration - Duration of card animations in ms
 * @returns {Object} Object containing workout-specific focus utilities
 */
export const useWorkoutFocus = (options = {}) => {
  const { animationDuration = 300 } = options;
  
  const focusScroll = useFocusScroll({
    scrollDelay: animationDuration + 50, // Wait for animation to complete
    scrollBehavior: 'smooth',
    scrollBlock: 'start',
    enableHeightTracking: true,
    enableAutoScroll: true
  });
  
  return {
    ...focusScroll,
    // Additional workout-specific utilities can be added here
  };
}; 