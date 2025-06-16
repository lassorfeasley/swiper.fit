import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generates a workout name based on the current day and time of day
 * @returns {string} A workout name like "Monday Morning Workout" or "Tuesday Evening Workout"
 */
export const generateWorkoutName = () => {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Get hour in 24-hour format
  const hour = now.getHours();
  
  // Determine time of day
  let timeOfDay;
  if (hour >= 5 && hour < 12) {
    timeOfDay = 'Morning';
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = 'Afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = 'Evening';
  } else {
    timeOfDay = 'Night';
  }
  
  return `${day} ${timeOfDay} Workout`;
};
