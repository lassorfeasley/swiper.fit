# Exercise Addition Fix

## Problem

Users were unable to add new exercises to their workouts. The error message was:
```
Failed to add exercise. Please try again.
```

The console showed a `PGRST116` error:
```
{code: 'PGRST116', details: 'Results contain 2 rows, application/vnd.pgrst.object+json requires 1 row', hint: null, message: 'JSON object requested, multiple (or no) rows returned'}
```

## Root Cause

The issue was in the `handleAddExerciseToday` function in `ActiveWorkoutSection.jsx`. When inserting a new exercise into the `workout_exercises` table, the code was using:

```javascript
.select("*")  // ❌ Returns all columns and expects multiple rows
```

Instead of:

```javascript
.select("id").single()  // ✅ Returns only the ID and expects a single row
```

## The Fix

**File:** `src/pages/Workout/ActiveWorkoutSection.jsx`
**Lines:** 683-693

**Before:**
```javascript
const { data: workoutExercises, error: workoutExerciseError } =
  await supabase
    .from("workout_exercises")
    .insert({
      workout_id: activeWorkout.id,
      exercise_id: exerciseId,
      exercise_order: nextOrder,
      snapshot_name: exerciseName.trim(),
      section_override: section,
    })
    .select("*");  // ❌ Problematic
```

**After:**
```javascript
const { data: workoutExercise, error: workoutExerciseError } =
  await supabase
    .from("workout_exercises")
    .insert({
      workout_id: activeWorkout.id,
      exercise_id: exerciseId,
      exercise_order: nextOrder,
      snapshot_name: exerciseName.trim(),
      section_override: section,
    })
    .select("id")  // ✅ Only select the ID
    .single();     // ✅ Expect a single row
```

## Why This Happened

1. **PostgREST Behavior**: When using `.select("*")` with an INSERT operation, PostgREST expects to return multiple rows or an array
2. **Single Row Expectation**: The code was expecting a single JSON object (due to the context)
3. **Mismatch**: This caused the `PGRST116` error when PostgREST tried to return multiple rows for a single object request

## Verification

- ✅ Build compilation successful
- ✅ No syntax errors
- ✅ Exercise addition should now work correctly
- ✅ Both "Just for today" and "Permanently" options should work

## Related Functions

The `handleAddExerciseFuture` function already had the correct pattern:
```javascript
.select("id").single()  // ✅ Already correct
```

## Testing

To test the fix:
1. Start a workout
2. Try to add a new exercise to any section
3. Verify that the exercise is added successfully
4. Check that no `PGRST116` errors appear in the console 