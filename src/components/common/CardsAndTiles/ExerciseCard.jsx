import React from 'react';
import PropTypes from 'prop-types';
import CardWrapper from './Wrappers/CardWrapper';
import SetPill from './SetPill';

const ExerciseCard = ({ exerciseName, setConfigs = [], className = '', ...props }) => {
  return (
    <CardWrapper className={className} {...props}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
          </div>
        </div>
      </div>
      <div className="Frame6 self-stretch flex flex-col justify-start items-start gap-[1px]">
        {setConfigs.map((config, idx) => (
          <div key={idx} className="SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start gap-2">
            <div className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center">
              <div className="SetOne justify-center text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
                {`Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][idx] || idx+1}`}
              </div>
              <SetPill
                reps={config.reps}
                weight={config.weight}
                unit={config.unit || 'lbs'}
              />
            </div>
          </div>
        ))}
      </div>
    </CardWrapper>
  );
};

ExerciseCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string
  })),
  className: PropTypes.string,
};

export default ExerciseCard; 