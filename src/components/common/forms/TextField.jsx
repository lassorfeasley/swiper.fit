// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1692&t=qLasGdJck7GcZoku-4

import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import PropTypes from "prop-types";
import { Input } from "../../../src/components/ui/input";
import { Label } from "../../../src/components/ui/label";
import { cn } from "@/lib/utils";

const FormContext = createContext(false);

export { FormContext };

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

  return (
    <div 
      className={cn(
        "relative w-full",
        !isInForm && "rounded-md",
        className
      )}
      onClick={() => {
        if (!isFocused && inputRef.current) {
          inputRef.current.focus();
        }
      }}
    >
      <Label
        htmlFor={id}
        className={cn(
          "absolute left-3 transition-all duration-200 pointer-events-none",
          isFloating 
            ? "text-xs -top-2.5 bg-background px-1 text-muted-foreground" 
            : "text-base top-1/2 -translate-y-1/2 text-muted-foreground"
        )}
      >
        {label}
      </Label>
      <Input
        type="text"
        id={id}
        ref={inputRef}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={isFloating ? placeholder : ""}
        className={cn(
          "w-full h-14 px-3",
          !isInForm && "border-input",
          error && "border-destructive focus-visible:ring-destructive",
          isFloating && "pt-4"
        )}
        autoComplete="off"
        {...props}
      />
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