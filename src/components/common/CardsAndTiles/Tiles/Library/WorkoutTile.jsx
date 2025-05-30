// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=61-814&m=dev


import React from 'react';
import PropTypes from 'prop-types';
import '../../../../../styles/typography.css';

/**
 * WorkoutTile - Tile-style component for workout history
 *
 * Props:
 * - workoutName: string
 * - programName: string
 * - exerciseCount: number
 * - duration: string (formatted as 00H:00M)
 * - onClick: function (optional)
 * - className: string (optional)
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
    className={`flex flex-col w-full p-5 items-start gap-3 cursor-pointer bg-white ${className}`}
    onClick={onClick}
    data-component="WorkoutTile"
  >
    <div className="flex flex-col gap-1 w-full">
      <span className="h1-head">{workoutName}</span>
      <span className="h2-head">{programName}</span>
    </div>
    <div className="flex items-center gap-3">
      <span className="metric">{exerciseCount} exercises</span>
      <span className="metric">|</span>
      <span className="metric">{duration} time</span>
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