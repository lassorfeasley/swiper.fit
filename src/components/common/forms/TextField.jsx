// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1692&t=qLasGdJck7GcZoku-4

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import PropTypes from "prop-types";

const FormContext = createContext(false);

export const FormProvider = ({ children }) => (
  <FormContext.Provider value={true}>
    {children}
  </FormContext.Provider>
);

const TextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  error,
  id,
  inputRef: externalInputRef,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const internalInputRef = useRef(null);
  const inputRef = externalInputRef || internalInputRef;
  const isInForm = useContext(FormContext);

  useEffect(() => {
    setIsFloating(isFocused || value.length > 0);
  }, [isFocused, value]);

  const handleFocus = (e) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const showFloating = isFloating;

  return (
    <div 
      className={`w-full h-14 px-4 bg-white relative ${
        !isInForm ? 'rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300' : ''
      } ${className}`}
      {...props}
    >
      {/* Inactive state: label centered, input hidden */}
      {!showFloating && (
        <label
          htmlFor={id}
          className="absolute left-4 right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl font-['Space_Grotesk'] pointer-events-none select-none w-auto"
        >
          {label}
        </label>
      )}
      {/* Floating state: label stacked above input */}
      {showFloating && (
        <div className="flex flex-col items-start justify-center gap-0 h-full">
          <label
            htmlFor={id}
            className="text-xs text-slate-500 font-['Space_Grotesk'] pointer-events-none select-none"
          >
            {label}
          </label>
          <input
            type="text"
            id={id}
            ref={inputRef}
            value={value}
            onChange={onChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFloating && value.length === 0 ? placeholder : ''}
            className="w-full bg-transparent text-xl text-black font-['Space_Grotesk'] focus:outline-none"
            autoComplete="off"
          />
        </div>
      )}
      {/* Hidden input for focus/typing in inactive state */}
      {!showFloating && (
        <input
          type="text"
          id={id}
          ref={inputRef}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={''}
          className="absolute inset-0 w-full h-full opacity-0 cursor-text bg-transparent focus:outline-none"
          autoComplete="off"
          tabIndex={0}
        />
      )}
    </div>
  );
};

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.bool,
  id: PropTypes.string,
  inputRef: PropTypes.any,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
};

FormProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default TextField;