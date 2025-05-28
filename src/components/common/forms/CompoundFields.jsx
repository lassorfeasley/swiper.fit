import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from './NumericInput';
import ToggleGroup from './ToggleGroup';

const CompoundFields = ({
  weight,
  onWeightChange,
  unit,
  onUnitChange,
  weightLabel = 'Weight',
  allowDecimal = true,
  className = '',
}) => {
  return (
    <div className={`w-full bg-white rounded-xl p-4 flex flex-col gap-4 mt-4 ${className}`}>
      <NumericInput
        label={weightLabel}
        value={weight}
        onChange={onWeightChange}
        incrementing={true}
        className="w-full"
        allowDecimal={allowDecimal}
      />
      <ToggleGroup
        options={[
          { label: 'lbs', value: 'lbs' },
          { label: 'kg', value: 'kg' },
          { label: 'body', value: 'body' },
        ]}
        value={unit}
        onChange={onUnitChange}
      />
    </div>
  );
};

CompoundFields.propTypes = {
  weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onWeightChange: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  weightLabel: PropTypes.string,
  allowDecimal: PropTypes.bool,
  className: PropTypes.string,
};

export default CompoundFields; 