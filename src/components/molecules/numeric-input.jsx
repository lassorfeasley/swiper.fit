import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

const NumericInput = ({
  label = false,
  labelText,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className = "",
  incrementing = true,
  readOnly = false,
  id,
  allowTwoDecimals = false,
  allowOneDecimal = false,
  unitLabel,
}) => {
  const [internalValue, setInternalValue] = useState(value?.toString() ?? "");
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isFocused && value?.toString() !== internalValue) {
      setInternalValue(value?.toString() ?? "");
    }
  }, [value, isFocused, internalValue]);

  const getWrapperStyles = () => {
    const baseStyles = "self-stretch h-12 bg-white rounded-sm border border-neutral-300 flex justify-start items-center gap-0";
    if (readOnly) {
      return cn(baseStyles, "border-neutral-300");
    }
    if (isFocused) {
      return cn(baseStyles, "border-slate-600");
    }
    if (isHovered) {
      return cn(baseStyles, "border-slate-600");
    }
    return cn(baseStyles, "border-neutral-300");
  };

  const getInputStyles = () => {
    const baseStyles = "flex-1 text-center text-base font-normal font-['Space_Grotesk'] leading-normal bg-transparent border-none focus:outline-none focus:ring-0";
    if (readOnly) {
      return cn(baseStyles, "text-neutral-300");
    }
    if (isFocused) {
      return cn(baseStyles, "text-slate-600");
    }
    return cn(baseStyles, "text-slate-500");
  };

  const decrement = () => {
    if (readOnly) return;
    const newValue = Math.max(min, Number(value) - step);
    onChange(allowOneDecimal ? parseFloat(newValue.toFixed(1)) : newValue);
  };

  const increment = () => {
    if (readOnly) return;
    const newValue = Math.min(max, Number(value) + step);
    onChange(allowOneDecimal ? parseFloat(newValue.toFixed(1)) : newValue);
  };

  const handleInputChange = (e) => {
    if (readOnly) return;
    const val = e.target.value;

    if (val === "") {
      setInternalValue("");
      onChange(min);
      return;
    }

    let pattern = /^-?\d*$/;
    if (allowTwoDecimals) {
      pattern = /^-?\d*(\.\d{0,2})?$/;
    } else if (allowOneDecimal) {
      pattern = /^-?\d*(\.\d{0,1})?$/;
    }

    if (pattern.test(val)) {
      setInternalValue(val);
      
      if (val.endsWith('.') || val === '-' || val === '-.') {
          return;
      }

      const num = Number(val);
      if (!isNaN(num)) {
        if (num >= min && num <= max) {
          onChange(num);
        }
      }
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (readOnly) return;
    let num = Number(internalValue);
    if (isNaN(num)) num = min;
    num = Math.max(min, Math.min(max, num));
    if (allowTwoDecimals) {
      num = Math.round(num * 100) / 100;
    } else if (allowOneDecimal) {
      num = Math.round(num * 10) / 10;
    } else {
      num = Math.round(num);
    }
    setInternalValue(num.toString());
    onChange(num);
  };

  return (
    <div
      className={cn("w-full inline-flex flex-col justify-start items-start gap-0", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={getWrapperStyles()}>
        {incrementing && (
          <button
            onClick={decrement}
            disabled={readOnly || value <= min}
            className="flex-1 h-full flex justify-center items-center disabled:opacity-50 bg-transparent p-0 border-0 border-r border-neutral-300 first:rounded-l-sm"
            type="button"
            tabIndex={-1}
            style={{ minWidth: 40 }}
          >
            <Minus className="w-4 h-4 text-neutral-400" strokeWidth={2} />
          </button>
        )}
        <div className="flex-1 flex flex-col justify-center items-center">
          <input
            id={id}
            type="text"
            value={internalValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onFocus={() => setIsFocused(true)}
            readOnly={readOnly}
            className={getInputStyles()}
            style={{ minWidth: 40 }}
          />
          {unitLabel && (
            <div className="text-center text-slate-500 text-sm font-normal font-['Space_Grotesk'] leading-tight">{unitLabel}</div>
          )}
        </div>
        {incrementing && (
          <button
            onClick={increment}
            disabled={readOnly || value >= max}
            className="flex-1 h-full flex justify-center items-center disabled:opacity-50 bg-transparent p-0 border-0 border-l border-neutral-300 last:rounded-r-sm"
            type="button"
            tabIndex={-1}
            style={{ minWidth: 40 }}
          >
            <Plus className="w-4 h-4 text-neutral-400" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};

NumericInput.propTypes = {
  label: PropTypes.node,
  labelText: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  className: PropTypes.string,
  incrementing: PropTypes.bool,
  readOnly: PropTypes.bool,
  id: PropTypes.string,
  allowTwoDecimals: PropTypes.bool,
  allowOneDecimal: PropTypes.bool,
  unitLabel: PropTypes.string,
};

export default NumericInput; 