import React from "react";
import PropTypes from "prop-types";

/**
 * WorkoutCard – card representation of a completed or logged workout.
 *
 * Props:
 *  • name – workout name (e.g., "Monday morning workout").
 *  • subtitle – secondary info (e.g., muscle group or program name).
 *  • relativeLabel – relative date (e.g., "Today", "2 days ago").
 */
const WorkoutCard = ({ name, subtitle, relativeLabel, ...props }) => {
  return (
    <div
      className="w-full max-w-[500px] p-4 bg-white border-b border-neutral-neutral-300 flex flex-col justify-start items-start gap-2"
      {...props}
    >
      <div className="w-full text-slate-950 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight truncate">
        {name}
      </div>
      <div className="w-full flex justify-between items-center gap-2">
        <div className="text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none truncate">
          {subtitle}
        </div>
        <div className="text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-none whitespace-nowrap">
          {relativeLabel}
        </div>
      </div>
    </div>
  );
};

WorkoutCard.propTypes = {
  name: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  relativeLabel: PropTypes.string,
};

export default WorkoutCard; 