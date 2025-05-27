import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TextField = ({
  label,
  value,
  onChange,
  placeholder = '',
  error = '',
  type = 'text',
  className = '',
  inputRef,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const shouldShowFocusedStyle = isFocused || value.length > 0;

  return (
    <div
      className={`flex bg-white w-full transition-colors ${className} border-2 border-transparent focus-within:border-[#23262B] ${error ? 'border-red-500' : ''}`}
      style={{
        width: '100%',
        height: '60px',
        padding: '10px',
        flexShrink: 0,
        ...(shouldShowFocusedStyle ? {
          flexDirection: 'column',
          alignItems: 'flex-start',
        } : {
          flexDirection: 'row',
          alignItems: 'center',
        })
      }}
      {...props}
    >
      {label && (
        <label 
          className={`transition-all ${
            shouldShowFocusedStyle 
              ? "text-[#2F3640] text-xs font-medium tracking-[0.48px] uppercase" 
              : "text-h2 font-h2 leading-h2 font-space text-light-balck"
          }`}
        >
          {label}
        </label>
      )}
      <input
        ref={inputRef}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={error ? placeholder : ''}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          flex-1 bg-white focus:outline-none border-none
          text-h2 font-h2 leading-h2 font-space text-[#2F3640]
          ${shouldShowFocusedStyle ? 'mt-1' : ''}
        `}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};

TextField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  error: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.instanceOf(Element) })
  ]),
};

export default TextField;