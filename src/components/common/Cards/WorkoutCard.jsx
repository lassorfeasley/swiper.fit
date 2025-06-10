import React from 'react';
import PropTypes from 'prop-types';
import CardWrapper from './Wrappers/CardWrapper';

const WorkoutCard = ({ workoutName, exerciseCount = 0, programName = '', duration = '', className = '', ...props }) => {
  return (
    <CardWrapper className={className} {...props}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{workoutName}</div>
          <div className="flex flex-col gap-1">
            {programName && (
              <div className="Programname self-stretch justify-start text-slate-500 text-xs font-normal font-['Space_Grotesk'] leading-none">
                {programName}
              </div>
            )}
            <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
              {`${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`}
              {duration && ` • ${duration}`}
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
};

WorkoutCard.propTypes = {
  workoutName: PropTypes.string.isRequired,
  exerciseCount: PropTypes.number,
  programName: PropTypes.string,
  duration: PropTypes.string,
  className: PropTypes.string,
};

export default WorkoutCard; 