import React from 'react';
import PropTypes from 'prop-types';
import TileWrapper from './Wrappers/TileWrapper';

function ProgramTile({ programName, workoutCount = 0, className = '', ...props }) {
  return (
    <TileWrapper className={className} {...props}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">
            {programName}
          </div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {workoutCount === 1 ? 'One workout' : `${workoutCount} workouts`}
          </div>
        </div>
      </div>
    </TileWrapper>
  );
}

ProgramTile.propTypes = {
  programName: PropTypes.string.isRequired,
  workoutCount: PropTypes.number,
  className: PropTypes.string,
};

export default ProgramTile; 