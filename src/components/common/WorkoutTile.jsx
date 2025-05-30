import React from 'react';
import PropTypes from 'prop-types';

/**
 * WorkoutTile - List-style tile for workout history
 *
 * Props:
 * - workoutName: string
 * - programName: string
 * - exerciseCount: number
 * - duration: string (formatted as 00H:00M)
 * - onClick: function (optional)
 */
const WorkoutTile = ({
  workoutName,
  programName,
  exerciseCount,
  duration,
  onClick,
  className = '',
}) => (
  <div
    className={`flex flex-col px-0 py-4 border-b border-[#e5e7eb] cursor-pointer bg-transparent ${className}`}
    onClick={onClick}
    style={{ minHeight: 64 }}
    data-component="WorkoutTile"
  >
    <span className="text-lg font-bold text-[#353942] leading-tight">{workoutName}</span>
    <span className="text-base text-[#5A6B7A] mt-1">{programName}</span>
    <div className="flex items-center gap-4 mt-1">
      <span className="text-sm font-bold text-[#353942]">{exerciseCount} exercises</span>
      <span className="text-sm font-bold text-[#353942]">[{duration}]</span>
    </div>
  </div>
);

WorkoutTile.propTypes = {
  workoutName: PropTypes.string.isRequired,
  programName: PropTypes.string,
  exerciseCount: PropTypes.number.isRequired,
  duration: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default WorkoutTile; 