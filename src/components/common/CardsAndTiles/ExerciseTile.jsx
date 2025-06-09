import React from 'react';
import PropTypes from 'prop-types';
import TileWrapper from './Wrappers/TileWrapper';
import SetPill from './SetPill';

const ExerciseTile = ({ exerciseName, setConfigs = [], className = '', ...props }) => {
  return (
    <TileWrapper className={className} {...props}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
          </div>
        </div>
      </div>
      <div className="Setpillwrapper self-stretch flex flex-wrap items-start gap-3 content-start p-3 bg-white">
        {setConfigs.map((config, idx) => (
          <SetPill
            key={idx}
            reps={config.reps}
            weight={config.weight}
            unit={config.unit || 'lbs'}
          />
        ))}
      </div>
    </TileWrapper>
  );
};

ExerciseTile.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string
  })),
  className: PropTypes.string,
};

export default ExerciseTile; 