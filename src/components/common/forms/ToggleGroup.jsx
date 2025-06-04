import React from 'react';
import PropTypes from 'prop-types';

const ToggleButton = ({ label, isSelected, onClick }) => (
  <div
    className={`flex-1 h-7 ${
      isSelected
        ? 'bg-slate-200'
        : 'bg-stone-50 outline outline-1 outline-offset-[-1px] outline-slate-200'
    } rounded-sm flex justify-center items-center Togglebuttonwrapper`}
    data-layer="ToggleButtonWrapper"
    data-property-1={isSelected ? 'Selected' : 'default'}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
    role="button"
    tabIndex={0}
    onKeyPress={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
  >
    <div
      className={`text-center justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal`}
      data-layer={label}
    >
      {label}
    </div>
  </div>
);

ToggleButton.propTypes = {
  label: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

const ToggleGroup = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`w-full inline-flex items-start gap-2 Togglegroup px-3 pb-3 pt-0 ${className}`} data-layer="ToggleGroup" role="group">
      {options.map(option => (
        <ToggleButton
          key={option.value}
          label={option.label}
          isSelected={value === option.value}
          onClick={() => onChange(option.value)}
        />
      ))}
    </div>
  );
};

ToggleGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default ToggleGroup; 