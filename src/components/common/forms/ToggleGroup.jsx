import React from 'react';
import PropTypes from 'prop-types';

const ToggleGroup = ({ options, value, onChange, className = '' }) => {
  return (
    <div className={`flex w-full gap-4 ${className}`} role="group">
      {options.map(option => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`flex items-center justify-center gap-[10px] h-[30px] flex-[1_0_0] text-h2 font-h2 leading-h2 font-medium transition-colors ${
              isSelected
                ? ''
                : 'border border-[#DCDDE1] rounded-[4px]'
            }`}
            style={{
              display: 'flex',
              height: '30px',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '10px',
              flex: '1 0 0',
              borderRadius: 4,
              background: isSelected ? '#F2F2F7' : undefined,
              border: isSelected ? 'none' : '1px solid #DCDDE1',
            }}
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        );
      })}
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