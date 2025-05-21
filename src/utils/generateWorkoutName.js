// Helper: Convert integer to Roman numeral (1–10 for simplicity)
function intToRoman(num) {
  const romans = [
    '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'
  ];
  return romans[num] || num.toString();
}

// Helper: Get time-of-day bucket
function getTimeOfDayBucket(date) {
  const hour = date.getHours();
  if (hour >= 4 && hour < 8) return 'Early Morning';
  if (hour >= 8 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 16) return 'Afternoon';
  if (hour >= 16 && hour < 20) return 'Evening';
  if (hour >= 20 && hour < 24) return 'Night';
  return 'Late Night';
}

// Main function
async function generateWorkoutName(createdAt, programName, userId, supabase) {
  const dayOfWeek = createdAt.toLocaleDateString('en-US', { weekday: 'long' });
  const bucket = getTimeOfDayBucket(createdAt);

  // Get start and end of the day in UTC
  const startOfDay = new Date(createdAt);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(createdAt);
  endOfDay.setHours(23, 59, 59, 999);

  // Query for existing workouts for this user, day, and bucket
  const { data, error } = await supabase
    .from('workouts')
    .select('id, created_at')
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (error) {
    console.error('Error fetching workouts:', error);
    // Fallback to no suffix
    return `${dayOfWeek} ${bucket} ${programName} workout`;
  }

  // Count how many workouts are in the same bucket
  const countInBucket = (data || []).filter(w => {
    const workoutDate = new Date(w.created_at);
    return getTimeOfDayBucket(workoutDate) === bucket;
  }).length;

  const roman = countInBucket > 0 ? ` ${intToRoman(countInBucket + 1)}` : '';

  return `${dayOfWeek} ${bucket} ${programName} workout${roman}`;
}

export { generateWorkoutName }; 