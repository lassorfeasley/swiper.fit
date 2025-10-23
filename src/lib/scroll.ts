/**
 * Core scroll utilities for the application
 */

/**
 * Scroll options interface
 */
export interface ScrollOptions {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  delay?: number;
  offset?: number;
}

/**
 * Element scroll options interface
 */
export interface ElementScrollOptions {
  behavior?: ScrollBehavior;
  offset?: number;
  container?: HTMLElement;
}

/**
 * Scroll position interface
 */
export interface ScrollPosition {
  top: number;
  left: number;
}

/**
 * Scroll an element into view with configurable options
 */
export const scrollIntoView = (element: HTMLElement | null, options: ScrollOptions = {}): void => {
  const {
    behavior = 'smooth',
    block = 'start',
    delay = 0,
    offset = 0
  } = options;
  
  if (!element?.scrollIntoView) return;
  
  const scroll = (): void => {
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
 */
export const scrollToSection = (sectionId: string, headerOffset: number = 0): void => {
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
 */
export const scrollToElement = (target: string | HTMLElement | null, options: ElementScrollOptions = {}): void => {
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
 */
export const getScrollPosition = (container: HTMLElement = document.documentElement): ScrollPosition => {
  return {
    top: container.scrollTop || window.pageYOffset,
    left: container.scrollLeft || window.pageXOffset
  };
};

/**
 * Check if an element is in viewport
 */
export const isInViewport = (element: HTMLElement | null, threshold: number = 0.1): boolean => {
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
