import React from "react";
import ActionPill from "../../../components/shared/ActionPill";

interface CompletedWorkoutCardProps {
  name: string;
  subtitle?: string;
  relativeLabel?: string;
  onReviewClick?: (e: React.MouseEvent) => void;
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
const CompletedWorkoutCard = ({ name, subtitle, relativeLabel, onReviewClick, ...props }: CompletedWorkoutCardProps) => {
  return (
    <div
      data-layer="workout-summary-card"
      className="WorkoutSummaryCard w-full p-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-neutral-300 inline-flex flex-col justify-center items-start gap-10"
      {...props}
    >
      <div data-layer="label-wrapper" className="LabelWrapper w-full h-9 flex flex-col justify-center items-start gap-1">
        <div data-layer="Monday morning workout" className="MondayMorningWorkout justify-start text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-5">
          {name}
        </div>
        <div data-layer="Frame 5017" className="Frame5017 self-stretch inline-flex justify-start items-start gap-1">
          <div data-layer="Biceps and chest" className="BicepsAndChest justify-start text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
            {subtitle || "Workout"}
          </div>
          <div data-layer="|" className="justify-start text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">|</div>
          <div data-layer="October 27, 2025" className="October272025 justify-start text-neutral-neutral-400 text-xs font-medium font-['Be_Vietnam_Pro'] leading-3">
            {relativeLabel}
          </div>
        </div>
      </div>
      <div data-layer="Frame 5016" className="Frame5016 size- flex flex-col justify-start items-start gap-1">
        <ActionPill 
          label="Review workout" 
          onClick={onReviewClick || (() => {})} 
          color="neutral-dark"
          showText={true}
          showShadow={false}
        />
      </div>
    </div>
  );
};

export default CompletedWorkoutCard;