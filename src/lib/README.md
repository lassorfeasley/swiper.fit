# Scroll Utilities

This directory contains utilities for managing scroll behavior, focus management, and scroll snap functionality across the application.

## Files

### `scroll.js`
Core scroll utility functions for the application.

#### Functions

- **`scrollIntoView(element, options)`**
  - Scrolls an element into view with configurable options
  - Options: `behavior`, `block`, `delay`, `offset`
  - Example: `scrollIntoView(element, { behavior: 'smooth', delay: 300 })`

- **`scrollToSection(sectionId, headerOffset)`**
  - Scrolls to a specific section with header offset consideration
  - Automatically handles header height from CSS variables
  - Example: `scrollToSection('section-warmup')`

- **`scrollToElement(target, options)`**
  - Scrolls to a specific element with custom offset
  - Supports both element IDs and HTMLElements
  - Example: `scrollToElement('#exercise-123', { offset: 50 })`

- **`getScrollPosition(container)`**
  - Returns current scroll position
  - Example: `getScrollPosition()`

- **`isInViewport(element, threshold)`**
  - Checks if an element is in viewport
  - Threshold parameter (0-1) for partial visibility
  - Example: `isInViewport(element, 0.5)`

### `scrollSnap.js`
Configuration and utilities for scroll snap behavior.

#### Configuration

- **`SCROLL_SNAP_CONFIG`** - Predefined configurations for different contexts
  - `workout`: Active workout scroll snap settings
  - `routineBuilder`: Routine builder settings
  - `default`: Default settings

- **`ANIMATION_DURATIONS`** - Constants for animation timing
  - `CARD_ANIMATION_DURATION_MS`: 300ms
  - `SCROLL_DELAY_MS`: 350ms
  - `FOCUS_TRANSITION_MS`: 200ms

#### Functions

- **`getScrollSnapStyles(configKey)`** - Returns CSS styles object
- **`getScrollSnapClasses(configKey)`** - Returns CSS class names
- **`getScrollSnapCSSVars(configKey)`** - Returns CSS variables object

### `useFocusScroll.js`
React hooks for managing focus and scroll behavior.

#### Hooks

- **`useFocusScroll(options)`**
  - Main hook for focus and scroll management
  - Options: `scrollDelay`, `scrollBehavior`, `scrollBlock`, `enableHeightTracking`, `enableAutoScroll`, `scrollOffset`
  - Returns: `{ focusedNode, focusedHeight, isFocused, focusRef, focusElement, clearFocus, scrollToFocused }`

- **`useWorkoutFocus(options)`**
  - Specialized hook for workout exercise focus management
  - Pre-configured for workout animations and timing
  - Options: `animationDuration`

### `exerciseNavigation.js`
Utilities for smart cross-section exercise navigation.

#### Functions

- **`findNextIncompleteExercise(allExercises, currentExerciseId, completedExercises)`**
  - Finds the next incomplete exercise across all sections
  - Returns exercise object or null

- **`getNextExerciseAfterSectionComplete(completedSection, sectionExercises, completedExercises)`**
  - Smart navigation when a section is completed
  - Prioritizes next section, then subsequent sections, then previous sections
  - Returns next exercise to focus or null to end workout

- **`areAllExercisesComplete(sectionExercises, completedExercises)`**
  - Checks if all exercises across all sections are complete
  - Returns boolean

### `WorkoutNavigationContext.jsx`
React context for managing cross-section workout state and navigation.

#### Features

- **Global Exercise State**: Tracks exercises across all sections
- **Completion Tracking**: Manages completed exercises globally
- **Smart Navigation**: Automatically finds next exercise when sections complete
- **Progress Statistics**: Provides workout progress metrics
- **Cross-Section Focus**: Manages focus across section boundaries

## Usage Examples

### Basic Focus Management
```jsx
import { useFocusScroll } from '@/hooks/useFocusScroll';

function MyComponent() {
  const { focusRef, focusedHeight, isFocused } = useFocusScroll({
    scrollDelay: 300,
    scrollBehavior: 'smooth'
  });

  return (
    <div ref={focusRef}>
      {isFocused && <p>This element is focused!</p>}
    </div>
  );
}
```

### Section Navigation
```jsx
import { scrollToSection } from '@/lib/scroll';

function Navigation() {
  const handleSectionClick = (sectionId) => {
    scrollToSection(sectionId);
  };

  return (
    <nav>
      <button onClick={() => handleSectionClick('section-warmup')}>
        Warmup
      </button>
    </nav>
  );
}
```

### Scroll Snap Configuration
```jsx
import { getScrollSnapCSSVars, SCROLL_CONTEXTS } from '@/lib/scrollSnap';

function WorkoutContainer() {
  return (
    <div style={getScrollSnapCSSVars(SCROLL_CONTEXTS.WORKOUT)}>
      {/* Workout content */}
    </div>
  );
}
```

### Cross-Section Navigation
```jsx
import { useWorkoutNavigation } from '@/contexts/WorkoutNavigationContext';

function WorkoutSection() {
  const { 
    updateSectionExercises, 
    markExerciseComplete, 
    handleSectionComplete 
  } = useWorkoutNavigation();

  const handleExerciseComplete = (exerciseId) => {
    markExerciseComplete(exerciseId);
    
    // Check if section is complete
    if (allExercisesInSectionComplete) {
      const nextExercise = handleSectionComplete(sectionName);
      if (nextExercise) {
        // Focus on next exercise (possibly in different section)
        focusExercise(nextExercise.exercise_id, nextExercise.section);
      } else {
        // All exercises complete, end workout
        endWorkout();
      }
    }
  };
}
```

## Migration Guide

### From Old Focus Management
**Before:**
```jsx
const [focusedNode, setFocusedNode] = useState(null);
const [focusedCardHeight, setFocusedCardHeight] = useState(0);

const focusedCardRef = useCallback((node) => {
  if (node !== null) {
    setFocusedNode(node);
  }
}, []);

useEffect(() => {
  if (focusedNode) {
    const resizeObserver = new ResizeObserver(() => {
      setFocusedCardHeight(focusedNode.offsetHeight);
    });
    resizeObserver.observe(focusedNode);
    return () => resizeObserver.disconnect();
  }
}, [focusedNode]);
```

**After:**
```jsx
import { useWorkoutFocus } from '@/hooks/useFocusScroll';

const { focusRef, focusedHeight } = useWorkoutFocus({
  animationDuration: CARD_ANIMATION_DURATION_MS
});
```

### From Manual Scroll Functions
**Before:**
```jsx
const scrollSectionIntoView = (key) => {
  const el = document.getElementById(`section-${key}`);
  if (!el) return;
  const headerHeight = parseInt(
    getComputedStyle(document.documentElement).getPropertyValue("--header-height") || "0",
    10
  );
  const rect = el.getBoundingClientRect();
  const scrollContainer = document.documentElement;
  scrollContainer.scrollBy({ top: rect.top - headerHeight, behavior: "smooth" });
};
```

**After:**
```jsx
import { scrollToSection } from '@/lib/scroll';

const scrollSectionIntoView = (key) => {
  scrollToSection(`section-${key}`);
};
```

## Testing

Run the included tests to verify functionality:
```javascript
import { runScrollTests } from '@/lib/scroll.test.js';
runScrollTests();
```

## Benefits

1. **Reusability**: Scroll utilities can be used across different components
2. **Testability**: Pure functions are easier to unit test
3. **Maintainability**: Single source of truth for scroll behavior
4. **Flexibility**: Easy to configure different scroll behaviors per use case
5. **Separation of Concerns**: Scroll logic separated from component logic
6. **Type Safety**: Better TypeScript support with clear interfaces
7. **Performance**: Optimized scroll handling with proper cleanup
8. **Smart Navigation**: Cross-section exercise navigation with automatic focus management 