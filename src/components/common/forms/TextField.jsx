// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1692&t=qLasGdJck7GcZoku-4


import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

const TextField = ({
  label,
  value,
  onChange,
  placeholder = '',
  error = '',
  type = 'text',
  className = '',
  inputRef: externalInputRef,
  onEnter,
  isLastField = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;
  const shouldShowFocusedStyle = isFocused || value.length > 0;

  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim().length > 0) {
      e.preventDefault();
      if (onEnter) {
        onEnter();
      } else if (isLastField) {
        // If this is the last field and no onEnter handler is provided,
        // try to find and submit the closest form
        const form = inputRef.current?.closest('form');
        if (form) {
          form.requestSubmit();
        }
      } else {
        // Find the next input field and focus it
        const inputs = Array.from(document.querySelectorAll('input, textarea, select, button:not([type="button"])'));
        const currentIndex = inputs.indexOf(inputRef.current);
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          const nextInput = inputs[currentIndex + 1];
          nextInput.focus();
          // If the next input is a text input, select its content
          if (nextInput.type === 'text' && nextInput.value) {
            nextInput.select();
          }
        }
      }
    }
  };

  return (
    <div
      className={`flex bg-white w-full transition-colors ${className} border-2 border-transparent focus-within:border-[#23262B] ${error ? 'border-red-500' : ''} cursor-text`}
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
      onClick={handleContainerClick}
      role="textbox"
      tabIndex={-1}
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
        onKeyDown={handleKeyDown}
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
  onEnter: PropTypes.func,
  isLastField: PropTypes.bool,
};

export default TextField;