import React, { useEffect } from 'react';
import Dropdown from '../Dropdown';
import NumericInput from '../NumericInput';
import WeightCompoundField from './WeightCompoundField';
import FormGroupWrapper from '../FormWrappers/FormGroupWrapper';

const numberToWord = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
  // Add more if needed
];

const SetDropdown = ({ setNumber, defaultReps = 10, defaultWeight = 25, defaultUnit = 'lbs', className = '', isOpen, onToggle, reps, weight, unit, onRepsChange, onWeightChange, onUnitChange }) => {
  // Use 1-based set numbering for display
  const setLabel = `Set ${setNumber}`;

  // Sync local state with controlled props (for backward compatibility, but prefer controlled)
  useEffect(() => {
    if (onRepsChange) onRepsChange(reps ?? defaultReps);
    if (onWeightChange) onWeightChange(weight ?? defaultWeight);
    if (onUnitChange) onUnitChange(unit ?? defaultUnit);
    // eslint-disable-next-line
  }, []);

  return (
    <Dropdown
      label={setLabel}
      className={`w-full mt-4 ${className}`}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <FormGroupWrapper>
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
      </FormGroupWrapper>
    </Dropdown>
  );
};

export default SetDropdown; 