/**
 * Scroll snap configuration for different contexts
 */

/**
 * Scroll snap configuration interface
 */
export interface ScrollSnapConfig {
  snapType: string;
  snapPaddingTop: string;
  cardSnapAlign?: string;
  cardScrollMarginTop?: string;
  sectionSnapAlign?: string;
  enableSnap: boolean;
}

/**
 * Scroll snap styles interface
 */
export interface ScrollSnapStyles {
  scrollSnapType: string;
  scrollPaddingTop: string;
}

/**
 * Scroll snap classes interface
 */
export interface ScrollSnapClasses {
  container: string;
  item: string;
}

/**
 * CSS variables interface
 */
export interface ScrollSnapCSSVars {
  '--scroll-snap-type': string;
  '--scroll-padding-top': string;
  '--card-snap-align'?: string;
  '--card-scroll-margin-top'?: string;
}

/**
 * Animation durations interface
 */
export interface AnimationDurations {
  CARD_ANIMATION_DURATION_MS: number;
  SCROLL_DELAY_MS: number;
  FOCUS_TRANSITION_MS: number;
  SWIPE_COMPLETE_ANIMATION_MS: number;
  EXTRA_POST_COMPLETE_DELAY_MS: number;
}

/**
 * Scroll contexts interface
 */
export interface ScrollContexts {
  WORKOUT: string;
  ROUTINE_BUILDER: string;
  DEFAULT: string;
}

export const SCROLL_SNAP_CONFIG: Record<string, ScrollSnapConfig> = {
  // Active workout scroll snap settings
  workout: {
    snapType: 'y mandatory',
    snapPaddingTop: '25vh',
    cardSnapAlign: 'start',
    cardScrollMarginTop: '25vh',
    enableSnap: true
  },
  
  // Routine builder settings
  routineBuilder: {
    snapType: 'y proximity',
    snapPaddingTop: '0',
    sectionSnapAlign: 'start',
    enableSnap: false
  },
  
  // Default settings
  default: {
    snapType: 'none',
    snapPaddingTop: '0',
    cardSnapAlign: 'none',
    cardScrollMarginTop: '0',
    enableSnap: false
  }
};

/**
 * Get scroll snap styles for a specific context
 */
export const getScrollSnapStyles = (configKey: string): ScrollSnapStyles => {
  const config = SCROLL_SNAP_CONFIG[configKey] || SCROLL_SNAP_CONFIG.default;
  
  return {
    scrollSnapType: config.snapType,
    scrollPaddingTop: config.snapPaddingTop
  };
};

/**
 * Get CSS class names for scroll snap behavior
 */
export const getScrollSnapClasses = (configKey: string): ScrollSnapClasses => {
  const config = SCROLL_SNAP_CONFIG[configKey] || SCROLL_SNAP_CONFIG.default;
  
  return {
    container: config.enableSnap ? 'scroll-snap-container' : '',
    item: config.enableSnap ? 'scroll-snap-item' : ''
  };
};

/**
 * Generate CSS variables for scroll snap configuration
 */
export const getScrollSnapCSSVars = (configKey: string): ScrollSnapCSSVars => {
  const config = SCROLL_SNAP_CONFIG[configKey] || SCROLL_SNAP_CONFIG.default;
  
  return {
    '--scroll-snap-type': config.snapType,
    '--scroll-padding-top': config.snapPaddingTop,
    '--card-snap-align': config.cardSnapAlign,
    '--card-scroll-margin-top': config.cardScrollMarginTop
  };
};

/**
 * Constants for animation durations
 */
export const ANIMATION_DURATIONS: AnimationDurations = {
  CARD_ANIMATION_DURATION_MS: 500, // Matches ActiveExerciseCard.jsx
  SCROLL_DELAY_MS: 450, // Card animation with shorter buffer to feel snappier
  FOCUS_TRANSITION_MS: 200,
  // Total time for SwipeSwitch completion animation (3 x 0.35s tweens + ~0.1s buffer)
  SWIPE_COMPLETE_ANIMATION_MS: 1150,
  // Delay after swipe completes before closing/opening next card
  EXTRA_POST_COMPLETE_DELAY_MS: 0
};

/**
 * Scroll snap context types
 */
export const SCROLL_CONTEXTS: ScrollContexts = {
  WORKOUT: 'workout',
  ROUTINE_BUILDER: 'routineBuilder',
  DEFAULT: 'default'
};
