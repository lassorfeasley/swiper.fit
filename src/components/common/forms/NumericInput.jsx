import React from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icon';

const NumericInput = ({
  label,
  value,
  onChange,
  incrementing = false,
  min = 0,
  max = 999, // Allow up to 3 digits for max
  step = 1,
  className = '',
  allowDecimal = false,
  ...props
}) => {
  const handleDecrement = () => {
    if (onChange) onChange(Math.max(min, Number(value) - step));
  };

  const handleIncrement = () => {
    if (onChange) onChange(Math.min(max, Number(value) + step));
  };

  const handleInputChange = (e) => {
    let newValue = e.target.value;
    if (allowDecimal) {
      // Allow only numbers with at most one decimal and one digit after the decimal
      if (/^\d*(\.\d{0,1})?$/.test(newValue)) {
        if (newValue === '' || (Number(newValue) >= min && Number(newValue) <= max)) {
          onChange(newValue);
        }
      }
    } else {
      // Only allow integers
      if (/^\d*$/.test(newValue)) {
        if (newValue === '' || (Number(newValue) >= min && Number(newValue) <= max)) {
          onChange(newValue);
        }
      }
    }
  };

  // Format the display value with leading zero for single digits if max is < 100, otherwise don't pad for 3 digits
  const displayValue = max < 100 ? String(value).padStart(2, '0') : String(value);

  // Calculate maxLength for input
  let maxLength = String(max).length;
  if (allowDecimal) {
    maxLength = String(max).length + 2; // digits + '.' + one decimal digit
  }

  return (
    <div
      className={`flex items-center justify-between bg-white ${className}`}
      style={{
        height: 60,
        padding: '10px', // Consistent padding
        flexShrink: 0,
      }}
      {...props}
    >
      <span className="text-h2 font-h2 leading-h2 font-space text-light-balck">
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}> {/* Increased gap for better spacing */}
        {incrementing && (
          <button
            type="button"
            onClick={handleDecrement}
            className="p-1"
            tabIndex={-1}
            aria-label="Decrement"
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <Icon name="chevron_left" size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
        <input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          maxLength={maxLength}
          size={displayValue.length > 0 ? displayValue.length : 1} // Dynamic size
          className="text-h1 font-h1 leading-h1 font-space text-[#4B6584] text-center select-none bg-transparent border-none outline-none m-0"
          style={{ padding: 0, margin: 0, textAlign: 'center' }}
        />
        {incrementing && (
          <button
            type="button"
            onClick={handleIncrement}
            className="p-1"
            tabIndex={-1}
            aria-label="Increment"
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', padding: 0 }}
          >
            <Icon name="chevron_right" size={24} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

NumericInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  incrementing: PropTypes.bool,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  className: PropTypes.string,
  allowDecimal: PropTypes.bool,
};

export default NumericInput; 