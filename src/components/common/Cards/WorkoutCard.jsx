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
      className="RoutineCard w-full max-w-[500px] p-3 bg-white rounded-xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex justify-center items-end gap-2"
      {...props}
    >
      <div className="Frame5010 w-full inline-flex flex-col justify-start items-start gap-3">
        <div className="Frame5011 self-stretch inline-flex justify-start items-center gap-px">
          <div className="flex-1 truncate text-neutral-900 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {name}
          </div>
          <div className="text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3 whitespace-nowrap">
            {relativeLabel}
          </div>
        </div>
        <div className="text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-3 truncate">
          {subtitle}
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