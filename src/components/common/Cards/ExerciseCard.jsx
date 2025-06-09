import React from 'react';
import PropTypes from 'prop-types';
import CardWrapper from './Wrappers/CardWrapper';
import SetPill from '@/components/ui/SetPill';

const ExerciseCard = ({ exerciseName, setConfigs = [], className = '', onEdit }) => {
  return (
    <CardWrapper className={className}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            className="ml-2 text-blue-500 hover:underline"
            onClick={onEdit}
            tabIndex={0}
          >
            Edit
          </button>
        )}
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
  onEdit: PropTypes.func,
};

export default ExerciseCard; 