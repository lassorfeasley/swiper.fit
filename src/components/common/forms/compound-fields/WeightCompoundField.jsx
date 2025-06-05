import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from '../NumericInput';
import ToggleGroup from '../ToggleGroup';

const WeightCompoundField = ({
  weight = 25,
  onWeightChange,
  unit,
  onUnitChange,
  weightLabel = 'Weight',
  allowDecimal = true,
  className = '',
}) => {
  const isBody = unit === 'body';
  return (
    <div className={`w-full bg-white rounded-lg flex flex-col gap-0 overflow-hidden ${className}`}>
      <NumericInput
        label={weightLabel}
        value={isBody ? 'body' : weight}
        onChange={isBody ? () => {} : onWeightChange}
        incrementing={!isBody}
        className={`w-full ${isBody ? 'bg-gray-100 text-h2 font-h2 leading-h2 text-[#353942] cursor-not-allowed' : ''}`}
        allowDecimal={allowDecimal}
        readOnly={isBody}
        textAlign={isBody ? 'left' : 'center'}
      />
      <div
        style={{
          display: 'flex',
          padding: '0px 0px 0px 0px ',
          justifyContent: 'center',
          alignItems: 'flex-start',
          gap: '12px',
          alignSelf: 'stretch',
        }}
      >
        <ToggleGroup
          options={[
            { label: 'lbs', value: 'lbs' },
            { label: 'kg', value: 'kg' },
            { label: 'body', value: 'body' },
          ]}
          value={unit}
          onChange={onUnitChange}
          className="w-full"
        />
      </div>
    </div>
  );
};

WeightCompoundField.propTypes = {
  weight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onWeightChange: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  weightLabel: PropTypes.string,
  allowDecimal: PropTypes.bool,
  className: PropTypes.string,
};

export default WeightCompoundField; 