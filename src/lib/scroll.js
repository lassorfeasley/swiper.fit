/**
 * Core scroll utilities for the application
 */

/**
 * Scroll an element into view with configurable options
 * @param {HTMLElement} element - The element to scroll into view
 * @param {Object} options - Scroll options
 * @param {string} options.behavior - Scroll behavior ('smooth', 'auto', 'instant')
 * @param {string} options.block - Vertical alignment ('start', 'center', 'end', 'nearest')
 * @param {number} options.delay - Delay before scrolling in milliseconds
 * @param {number} options.offset - Additional offset to apply
 */
export const scrollIntoView = (element, options = {}) => {
  const {
    behavior = 'smooth',
    block = 'start',
    delay = 0,
    offset = 0
  } = options;
  
  if (!element?.scrollIntoView) return;
  
  const scroll = () => {
    element.scrollIntoView({ behavior, block });
    if (offset) {
      // Apply additional offset if needed
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo({
        top: currentScrollTop + offset,
        behavior
      });
    }
  };
  
  if (delay > 0) {
    setTimeout(scroll, delay);
  } else {
    scroll();
  }
};

/**
 * Scroll to a specific section with header offset consideration
 * @param {string} sectionId - The ID of the section to scroll to
 * @param {number} headerOffset - Additional header offset
 */
export const scrollToSection = (sectionId, headerOffset = 0) => {
  const element = document.getElementById(sectionId);
  if (!element) return;
  
  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--header-height") || "0",
    10
  );
  const rect = element.getBoundingClientRect();
  const scrollContainer = document.documentElement;
  scrollContainer.scrollBy({ 
    top: rect.top - headerHeight - headerOffset, 
    behavior: "smooth" 
  });
};

/**
 * Scroll to a specific element with custom offset
 * @param {string|HTMLElement} target - Element ID or HTMLElement
 * @param {Object} options - Scroll options
 */
export const scrollToElement = (target, options = {}) => {
  const {
    behavior = 'smooth',
    offset = 0,
    container = document.documentElement
  } = options;
  
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) return;
  
  const rect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  
  container.scrollBy({
    top: rect.top - containerRect.top - offset,
    behavior
  });
};

/**
 * Get the current scroll position
 * @param {HTMLElement} container - The scroll container (defaults to document)
 * @returns {Object} Object with top and left scroll positions
 */
export const getScrollPosition = (container = document.documentElement) => {
  return {
    top: container.scrollTop || window.pageYOffset,
    left: container.scrollLeft || window.pageXOffset
  };
};

/**
 * Check if an element is in viewport
 * @param {HTMLElement} element - The element to check
 * @param {number} threshold - Threshold for considering element "in view" (0-1)
 * @returns {boolean} Whether the element is in viewport
 */
export const isInViewport = (element, threshold = 0.1) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
  const visibleWidth = Math.min(rect.right, windowWidth) - Math.max(rect.left, 0);
  
  const visibleArea = visibleHeight * visibleWidth;
  const totalArea = rect.height * rect.width;
  
  return visibleArea / totalArea >= threshold;
}; 