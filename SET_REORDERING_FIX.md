# Set Reordering Fix

## Problem

When sets were renamed, they would appear to "reorder" because the naming logic was using array indices instead of the actual `set_order` values. This caused sets to get different names when they were processed, making it appear as if they had changed positions.

## Root Cause

The issue was in the `fetchExercises` function in `ActiveWorkoutSection.jsx`. The problematic logic was:

1. **Array-based naming**: Sets were assigned default names like `Set ${index + 1}` based on their position in the array
2. **Late sorting**: The sorting by `set_order` happened after the naming, which could cause inconsistencies
3. **Inconsistent naming**: When sets were renamed, they would get names based on their current array position rather than their actual order

## The Fix

**File:** `src/pages/Workout/ActiveWorkoutSection.jsx`

**Changes Made:**

1. **Move sorting earlier**: Sort by `set_order` before assigning default names
2. **Use set_order for naming**: Assign default names based on `set_order` instead of array index
3. **Maintain consistency**: Ensure set names are always based on their actual order
4. **Add set_order to database**: Ensure all set creation includes proper `set_order` values

### Database Consistency Fixes

**handleAddExerciseToday** (lines 708-730):
- Added `set_order: idx + 1` to all set creation
- Ensures new exercises have properly ordered sets

**handleAddSetToExercise** (lines 1220-1230):
- Added `set_order: newSetNumber` to new set creation
- Ensures added sets have proper order values

**handleSaveExerciseEdit** (lines 1045-1055):
- Added `set_order: set.set_order || 1` to set insertion
- Ensures edited exercises maintain proper ordering

### Before (Problematic):
```javascript
// Assign names based on array position
mergedSetConfigs.forEach((set, index) => {
  if (!set.set_variant) {
    set.set_variant = `Set ${index + 1}`; // ❌ Uses array index
  }
});

// Sort after naming
mergedSetConfigs.sort((a, b) => {
  const aOrder = a.set_order ?? 0;
  const bOrder = b.set_order ?? 0;
  return aOrder - bOrder;
});
```

### After (Fixed):
```javascript
// Sort first to establish correct order
mergedSetConfigs.sort((a, b) => {
  const aOrder = a.set_order ?? 0;
  const bOrder = b.set_order ?? 0;
  return aOrder - bOrder;
});

// Assign names based on actual set_order
mergedSetConfigs.forEach((set) => {
  if (!set.set_variant) {
    const setOrder = set.set_order ?? 1;
    set.set_variant = `Set ${setOrder}`; // ✅ Uses actual set_order
  }
});
```

## What This Fixes

- ✅ **No more reordering on rename**: Sets maintain their position when renamed
- ✅ **Consistent naming**: Set names are always based on their actual order
- ✅ **Stable positioning**: Sets don't jump around when their names change
- ✅ **Database consistency**: All sets now have proper `set_order` values
- ✅ **New exercise sets**: Sets added during active workouts have proper ordering
- ✅ **Preserved functionality**: All existing reordering features still work

## Testing

The fix was tested by:
- ✅ Build compilation (no syntax errors)
- ✅ Logic verification (naming based on set_order)
- ✅ Order preservation (sets don't reorder when renamed)

## Impact

This fix ensures that:
1. **Set names are consistent** with their actual order in the workout
2. **Renaming doesn't cause reordering** - sets stay in their intended positions
3. **The user experience is stable** - no unexpected movement of sets
4. **Existing reordering functionality** continues to work as expected 