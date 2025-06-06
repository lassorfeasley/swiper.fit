// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=239-5532&t=8685riP4HV63gUQi-4


import React from 'react';
import PropTypes from 'prop-types';
import '../../../../../styles/typography.css';
import SetPill from '../../SetPill';

/**
 * ExerciseTile - Tile component for displaying exercise details with completed sets
 * 
 * Props:
 * - exerciseName: string
 * - sets: number
 * - reps: number
 * - weight: number
 * - unit: string (optional) - Unit of weight ('kg', 'lbs', or 'body')
 * - className: string (optional)
 */
const ExerciseTile = ({
  exerciseName,
  sets = 0,
  reps = 0, 
  weight = 0,
  unit = 'lbs',
  className = '',
}) => {
  return (
    <div 
      className={`w-full max-w-full overflow-x-hidden p-4 bg-stone-50 rounded-lg ${className}`}
      data-component="ExerciseTile"
    >
      <div className="w-full">
        <span className="h2-head whitespace-nowrap block">{exerciseName}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        {Array.from({ length: sets }, (_, i) => (
          <SetPill
            key={i}
            reps={reps}
            weight={weight}
            unit={unit}
            complete={true}
          />
        ))}
      </div>
    </div>
  );
};

ExerciseTile.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  sets: PropTypes.number,
  reps: PropTypes.number,
  weight: PropTypes.number,
  unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
  className: PropTypes.string,
};

export default ExerciseTile;
