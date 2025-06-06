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
      className={`Exercisetile self-stretch p-5 bg-stone-50 inline-flex flex-col justify-center items-start gap-4 ${className}`}
      data-layer="ExerciseTile"
    >
      <div data-layer="[Exercise name]" className="ExerciseName w-96 h-7 justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">
        {exerciseName}
      </div>
      <div data-layer="Frame 5" data-property-1="Default" className="Frame5 inline-flex flex-wrap justify-start items-center gap-2">
        {Array.from({ length: sets }, (_, i) => (
          <SetPill
            key={i}
            reps={reps}
            weight={weight}
            unit={unit}
            complete={true}
            className="Setpill px-1 py-0.5 bg-green-500 rounded-sm flex justify-start items-center gap-1"
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
