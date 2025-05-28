import React, { useEffect } from 'react';
import Dropdown from '../Dropdown';
import NumericInput from '../NumericInput';
import WeightCompoundField from './WeightCompoundField';

const numberToWord = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
  // Add more if needed
];

const SetDropdown = ({ setNumber, defaultReps = 10, defaultWeight = 25, defaultUnit = 'lbs', className = '', isOpen, onToggle, reps, weight, unit, onRepsChange, onWeightChange, onUnitChange }) => {
  const setLabel = `Set ${numberToWord[setNumber] ? numberToWord[setNumber].charAt(0).toUpperCase() + numberToWord[setNumber].slice(1) : setNumber}`;

  // Sync local state with controlled props (for backward compatibility, but prefer controlled)
  useEffect(() => {
    if (onRepsChange) onRepsChange(reps ?? defaultReps);
    if (onWeightChange) onWeightChange(weight ?? defaultWeight);
    if (onUnitChange) onUnitChange(unit ?? defaultUnit);
    // eslint-disable-next-line
  }, []);

  return (
    <Dropdown
      value={setLabel}
      className={`w-full mt-4 ${className}`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="p-4 flex flex-col gap-4">
        <NumericInput
          label="Reps"
          value={reps}
          onChange={onRepsChange}
          incrementing={true}
          className="w-full"
        />
        <WeightCompoundField
          weight={weight}
          onWeightChange={onWeightChange}
          unit={unit}
          onUnitChange={onUnitChange}
        />
      </div>
    </Dropdown>
  );
};

export default SetDropdown; 