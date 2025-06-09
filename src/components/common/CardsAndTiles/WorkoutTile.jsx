import React from 'react';
import PropTypes from 'prop-types';
import TileWrapper from './Wrappers/TileWrapper';

const WorkoutTile = ({ workoutName, exerciseCount = 0, className = '', ...props }) => {
  return (
    <TileWrapper className={className} {...props}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{workoutName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {exerciseCount === 1 ? 'One exercise' : `${exerciseCount} exercises`}
          </div>
        </div>
      </div>
    </TileWrapper>
  );
};

WorkoutTile.propTypes = {
  workoutName: PropTypes.string.isRequired,
  exerciseCount: PropTypes.number,
  className: PropTypes.string,
};

export default WorkoutTile; 