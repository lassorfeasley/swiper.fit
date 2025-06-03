import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Dropdown from './Dropdown';

const ExerciseSetForm = ({ 
  setNumber = 1,
  initialReps = 10,
  initialWeight = 25,
  initialUnit = 'lbs',
  onRepsChange,
  onWeightChange,
  onUnitChange,
}) => {
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(initialWeight);
  const [unit, setUnit] = useState(initialUnit);
  const [isOpen, setIsOpen] = useState(false);

  const handleRepsChange = (newValue) => {
    setReps(newValue);
    onRepsChange?.(newValue);
  };

  const handleWeightChange = (newValue) => {
    setWeight(newValue);
    onWeightChange?.(newValue);
  };

  const handleUnitChange = (newUnit) => {
    setUnit(newUnit);
    onUnitChange?.(newUnit);
  };

  const increment = (current, setter) => {
    const newValue = current + 1;
    setter(newValue);
    return newValue;
  };

  const decrement = (current, setter) => {
    const newValue = Math.max(0, current - 1);
    setter(newValue);
    return newValue;
  };

  return (
    <Dropdown 
      label={`Set ${setNumber}`}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    >
      <div data-layer="RepsAndWeightWrapper" className="w-full bg-neutral-300 rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start gap-px overflow-hidden">
        <div data-layer="Numeric field" data-property-1="inriment up and down" className="NumericField self-stretch px-4 py-3 bg-white inline-flex justify-between items-center">
          <div data-layer="Field label" className="FieldLabel justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">Reps</div>
          <div data-layer="IncrimenterMetricWrapper" className="Incrimentermetricwrapper size- flex justify-start items-center gap-1">
            <button 
              onClick={() => handleRepsChange(decrement(reps, setReps))}
              className="ChevronLeft relative p-1 hover:bg-gray-100 rounded"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M19.0605 7.9395C19.3418 8.22079 19.4997 8.60225 19.4997 9C19.4997 9.39775 19.3418 9.77921 19.0605 10.0605L14.121 15L19.0605 19.9395C19.3338 20.2224 19.485 20.6013 19.4816 20.9946C19.4781 21.3879 19.3204 21.7641 19.0423 22.0422C18.7642 22.3203 18.3879 22.4781 17.9946 22.4815C17.6014 22.4849 17.2224 22.3337 16.9395 22.0605L10.9395 16.0605C10.6583 15.7792 10.5004 15.3977 10.5004 15C10.5004 14.6023 10.6583 14.2208 10.9395 13.9395L16.9395 7.9395C17.2208 7.65829 17.6023 7.50032 18 7.50032C18.3978 7.50032 18.7793 7.65829 19.0605 7.9395V7.9395Z" fill="var(--neutral-300, #D4D4D4)"/>
              </svg>
            </button>
            <div data-layer="00" className="justify-start text-slate-500 text-xl font-normal font-['Space_Grotesk'] leading-loose min-w-[2ch] text-center">
              {reps.toString().padStart(2, '0')}
            </div>
            <button 
              onClick={() => handleRepsChange(increment(reps, setReps))}
              className="ChevronRight relative p-1 hover:bg-gray-100 rounded"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.9395 22.0605C10.6583 21.7792 10.5004 21.3977 10.5004 21C10.5004 20.6023 10.6583 20.2208 10.9395 19.9395L15.879 15L10.9395 10.0605C10.6663 9.7776 10.5151 9.39869 10.5185 9.0054C10.522 8.6121 10.6797 8.23589 10.9578 7.95777C11.2359 7.67966 11.6121 7.52191 12.0054 7.51849C12.3987 7.51507 12.7776 7.66626 13.0605 7.9395L19.0605 13.9395C19.3418 14.2208 19.4997 14.6023 19.4997 15C19.4997 15.3977 19.3418 15.7792 19.0605 16.0605L13.0605 22.0605C12.7793 22.3417 12.3978 22.4997 12 22.4997C11.6023 22.4997 11.2208 22.3417 10.9395 22.0605Z" fill="var(--neutral-300, #D4D4D4)"/>
              </svg>
            </button>
          </div>
        </div>
        <div data-layer="WeightForm" className="Weightform self-stretch flex flex-col justify-start items-start">
          <div data-layer="Numeric field" data-property-1="inriment up and down" className="NumericField self-stretch px-4 py-3 bg-white inline-flex justify-between items-center">
            <div data-layer="Field label" className="FieldLabel justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">Weight</div>
            <div data-layer="IncrimenterMetricWrapper" className="Incrimentermetricwrapper size- flex justify-start items-center gap-1">
              <button 
                onClick={() => handleWeightChange(decrement(weight, setWeight))}
                className="ChevronLeft relative p-1 hover:bg-gray-100 rounded"
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M19.0605 7.9395C19.3418 8.22079 19.4997 8.60225 19.4997 9C19.4997 9.39775 19.3418 9.77921 19.0605 10.0605L14.121 15L19.0605 19.9395C19.3338 20.2224 19.485 20.6013 19.4816 20.9946C19.4781 21.3879 19.3204 21.7641 19.0423 22.0422C18.7642 22.3203 18.3879 22.4781 17.9946 22.4815C17.6014 22.4849 17.2224 22.3337 16.9395 22.0605L10.9395 16.0605C10.6583 15.7792 10.5004 15.3977 10.5004 15C10.5004 14.6023 10.6583 14.2208 10.9395 13.9395L16.9395 7.9395C17.2208 7.65829 17.6023 7.50032 18 7.50032C18.3978 7.50032 18.7793 7.65829 19.0605 7.9395V7.9395Z" fill="var(--neutral-300, #D4D4D4)"/>
                </svg>
              </button>
              <div data-layer="00" className="justify-start text-slate-500 text-xl font-normal font-['Space_Grotesk'] leading-loose min-w-[2ch] text-center">
                {weight.toString().padStart(2, '0')}
              </div>
              <button 
                onClick={() => handleWeightChange(increment(weight, setWeight))}
                className="ChevronRight relative p-1 hover:bg-gray-100 rounded"
              >
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M10.9395 22.0605C10.6583 21.7792 10.5004 21.3977 10.5004 21C10.5004 20.6023 10.6583 20.2208 10.9395 19.9395L15.879 15L10.9395 10.0605C10.6663 9.7776 10.5151 9.39869 10.5185 9.0054C10.522 8.6121 10.6797 8.23589 10.9578 7.95777C11.2359 7.67966 11.6121 7.52191 12.0054 7.51849C12.3987 7.51507 12.7776 7.66626 13.0605 7.9395L19.0605 13.9395C19.3418 14.2208 19.4997 14.6023 19.4997 15C19.4997 15.3977 19.3418 15.7792 19.0605 16.0605L13.0605 22.0605C12.7793 22.3417 12.3978 22.4997 12 22.4997C11.6023 22.4997 11.2208 22.3417 10.9395 22.0605Z" fill="var(--neutral-300, #D4D4D4)"/>
                </svg>
              </button>
            </div>
          </div>
          <div data-layer="Multi-select field" className="MultiSelectField self-stretch px-3 pb-3 bg-white inline-flex justify-start items-center gap-3">
            {['lbs', 'kg', 'body'].map((unitOption) => (
              <button
                key={unitOption}
                onClick={() => handleUnitChange(unitOption)}
                className={`Togglebuttonwrapper flex-1 h-7 rounded-sm flex justify-center items-center gap-2.5 transition-colors ${
                  unit === unitOption
                    ? 'bg-slate-200'
                    : 'bg-stone-50 outline outline-1 outline-offset-[-1px] outline-slate-200'
                }`}
              >
                <div className={`Lbs flex-1 text-center justify-start text-slate-600 ${
                  unit === unitOption ? 'text-base' : 'text-sm'
                } font-normal font-['Space_Grotesk']`}>
                  {unitOption}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Dropdown>
  );
};

ExerciseSetForm.propTypes = {
  setNumber: PropTypes.number,
  initialReps: PropTypes.number,
  initialWeight: PropTypes.number,
  initialUnit: PropTypes.oneOf(['lbs', 'kg', 'body']),
  onRepsChange: PropTypes.func,
  onWeightChange: PropTypes.func,
  onUnitChange: PropTypes.func,
};

export default ExerciseSetForm; 