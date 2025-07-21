/**
 * Scroll snap configuration for different contexts
 */

export const SCROLL_SNAP_CONFIG = {
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
 * @param {string} configKey - The configuration key to use
 * @returns {Object} CSS styles object
 */
export const getScrollSnapStyles = (configKey) => {
  const config = SCROLL_SNAP_CONFIG[configKey] || SCROLL_SNAP_CONFIG.default;
  
  return {
    scrollSnapType: config.snapType,
    scrollPaddingTop: config.snapPaddingTop
  };
};

/**
 * Get CSS class names for scroll snap behavior
 * @param {string} configKey - The configuration key to use
 * @returns {Object} Object with CSS class names
 */
export const getScrollSnapClasses = (configKey) => {
  const config = SCROLL_SNAP_CONFIG[configKey] || SCROLL_SNAP_CONFIG.default;
  
  return {
    container: config.enableSnap ? 'scroll-snap-container' : '',
    item: config.enableSnap ? 'scroll-snap-item' : ''
  };
};

/**
 * Generate CSS variables for scroll snap configuration
 * @param {string} configKey - The configuration key to use
 * @returns {Object} CSS variables object
 */
export const getScrollSnapCSSVars = (configKey) => {
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
export const ANIMATION_DURATIONS = {
  CARD_ANIMATION_DURATION_MS: 300,
  SCROLL_DELAY_MS: 350, // Card animation + buffer
  FOCUS_TRANSITION_MS: 200
};

/**
 * Scroll snap context types
 */
export const SCROLL_CONTEXTS = {
  WORKOUT: 'workout',
  ROUTINE_BUILDER: 'routineBuilder',
  DEFAULT: 'default'
}; 