import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a workout name based on the current day and time of day
 * @returns A workout name like "Monday Morning Workout" or "Tuesday Evening Workout"
 */
export const generateWorkoutName = (): string => {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });

  // Get hour in 24-hour format
  const hour = now.getHours();

  // Determine time of day
  let timeOfDay: string;
  if (hour >= 5 && hour < 12) {
    timeOfDay = "Morning";
  } else if (hour >= 12 && hour < 17) {
    timeOfDay = "Afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeOfDay = "Evening";
  } else {
    timeOfDay = "Night";
  }

  return `${day} ${timeOfDay} Workout`;
};

// Format elapsed time as 'M:SS' or 'H:MM:SS'
export const formatSeconds = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const secString = seconds.toString().padStart(2, "0");
  if (hours > 0) {
    const hourString = hours.toString();
    const minString = minutes.toString().padStart(2, "0");
    return `${hourString}:${minString}:${secString}`;
  } else {
    const minString = minutes.toString();
    return `${minString}:${secString}`;
  }
};

// Always format as HH:MM:SS with leading zeros
export const formatSecondsHHMMSS = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
