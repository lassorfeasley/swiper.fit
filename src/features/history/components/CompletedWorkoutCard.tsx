import React from "react";

interface CompletedWorkoutCardProps {
  name: string;
  subtitle?: string;
  relativeLabel?: string;
  [key: string]: any; // For ...props
}

/**
 * CompletedWorkoutCard – card representation of a completed or logged workout.
 *
 * Props:
 *  • name – workout name (e.g., "Monday morning workout").
 *  • subtitle – secondary info (e.g., muscle group or program name).
 *  • relativeLabel – relative date (e.g., "Today", "2 days ago").
 */
const CompletedWorkoutCard = ({ name, subtitle, relativeLabel, ...props }: CompletedWorkoutCardProps) => {
  return (
    <div
      data-layer="workout-card"
      className="RoutineCard w-full p-3 bg-white rounded-xl border border-neutral-300 inline-flex justify-center items-end gap-2"
      {...props}
    >
      <div data-layer="Frame 5010" className="Frame5010 w-full inline-flex flex-col justify-start items-start gap-3">
        <div data-layer="Frame 5011" className="Frame5011 self-stretch flex flex-col justify-center items-start gap-1">
          <div data-layer="Today" className="Today justify-start text-neutral-neutral-500 text-xs font-medium font-['Be_Vietnam_Pro'] leading-none">
            {relativeLabel}
          </div>
          <div data-layer="Monday morning workout" className="MondayMorningWorkout self-stretch justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
            {name}
          </div>
        </div>
        <div data-layer="Biceps and chest" className="BicepsAndChest justify-start text-neutral-neutral-400 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

export default CompletedWorkoutCard;