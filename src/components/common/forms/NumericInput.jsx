import React, { useRef, useState, useEffect } from 'react';
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
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleDecrement = () => {
    if (onChange) onChange(String(Math.max(min, Number(value) - step)));
  };

  const handleIncrement = () => {
    if (onChange) onChange(String(Math.min(max, Number(value) + step)));
  };

  const handleInputChange = (e) => {
    let newValue = e.target.value;
    if (allowDecimal) {
      // Allow only numbers with at most one decimal and one digit after the decimal
      if (/^\d*(\.\d{0,1})?$/.test(newValue) || newValue === '') {
        onChange(newValue);
      }
    } else {
      // Only allow integers
      if (/^\d*$/.test(newValue) || newValue === '') {
        onChange(newValue);
      }
    }
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    e.target.select();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (value === '') {
      // If user leaves it blank, and a min is set, consider setting to min.
      // Or, parent can decide. For now, if it's empty, call onChange with min.
      // This behavior can be adjusted based on desired UX for empty inputs.
      if (min !== undefined && String(min) !== value) {
         onChange(String(min));
      }
      return;
    }
    let num = Number(value);
    if (isNaN(num)) num = min;
    if (num < min) num = min;
    if (num > max) num = max;
    if (String(num) !== String(value)) {
      onChange(String(num));
    }
  };

  let inputValueToRender;
  if (isFocused) {
    inputValueToRender = String(value); // Show raw value when focused
  } else {
    inputValueToRender = value === '' ? String(min).padStart(2, '0') : (max < 100 ? String(value).padStart(2, '0') : String(value)); // Padded/formatted when not focused, or min if empty
  }
  
  let maxLength = String(max).length;
  if (allowDecimal) {
    maxLength = String(max).length + 2;
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
          ref={inputRef}
          type="text"
          value={inputValueToRender}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          maxLength={maxLength}
          size={inputValueToRender.length > 0 ? inputValueToRender.length : 1} // Dynamic size
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