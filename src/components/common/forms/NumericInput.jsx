import React, { useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";
// Add FormContext for form detection
import { FormContext } from "./TextField";

const NumericInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  className = "",
  incrementing = true,
  allowDecimal = true,
  readOnly = false,
  textAlign = 'center',
}) => {
  const isInForm = useContext(FormContext) || false;
  const [internalDisplayValue, setInternalDisplayValue] = useState(value?.toString() ?? min.toString());

  useEffect(() => {
    // Sync display value when 'value' prop changes from outside, 
    // or if the display value is not a valid representation of the current numeric value.
    const currentNumericDisplay = allowDecimal ? parseFloat(internalDisplayValue) : parseInt(internalDisplayValue, 10);
    const numericValueProp = typeof value === 'number' ? value : (typeof value === 'string' && !isNaN(parseFloat(value)) ? parseFloat(value) : min) ;

    if (readOnly) {
        setInternalDisplayValue(value?.toString() ?? "");
    } else if (isNaN(currentNumericDisplay) || currentNumericDisplay !== numericValueProp) {
        setInternalDisplayValue(numericValueProp.toString());
    }
  }, [value, readOnly, allowDecimal, min]);

  const processAndPropagate = (strValue, isBlurEvent = false) => {
    if (readOnly) return;

    if (strValue === "") {
      onChange(min);
      if(isBlurEvent) setInternalDisplayValue(min.toString());
      return;
    }
    // Allow typing just a minus sign or a decimal point initially
    if (strValue === "-" || (allowDecimal && (strValue === "." || strValue === "-."))) {
        if(isBlurEvent) { // On blur, these are invalid standalone
            onChange(min);
            setInternalDisplayValue(min.toString());
        }
        // Otherwise, allow user to continue typing
        return;
    }

    let numericVal = allowDecimal ? parseFloat(strValue) : parseInt(strValue, 10);

    if (!isNaN(numericVal)) {
      let clampedVal = Math.max(min, Math.min(max, numericVal));
      if (allowDecimal) {
        // Ensure up to one decimal place
        clampedVal = parseFloat(clampedVal.toFixed(1));
      } else {
        clampedVal = Math.round(clampedVal);
      }
      if (clampedVal !== value) {
        onChange(clampedVal);
      }
      // On blur, always sync display with the processed value
      if(isBlurEvent) setInternalDisplayValue(clampedVal.toString());
    } else if (isBlurEvent) {
      // If parsing failed on blur, revert to the last valid prop value or min
      const lastGoodValue = (typeof value === 'number' ? value : min);
      onChange(lastGoodValue);
      setInternalDisplayValue(lastGoodValue.toString());
    }
  };

  const handleInputChange = (e) => {
    if (readOnly) return;
    const newStr = e.target.value;
    setInternalDisplayValue(newStr);
    // Basic validation for valid characters during typing
    const pattern = allowDecimal ? /^-?\d*\.?\d{0,1}$/ : /^-?\d*$/;
    if (newStr === "" || newStr === "-" || (allowDecimal && (newStr === "." || newStr === "-.")) || pattern.test(newStr)) {
        // If it looks like a valid number in progress, try to propagate
        if (newStr !== "" && newStr !== "-" && newStr !== "." && newStr !== "-.") {
             processAndPropagate(newStr, false); // process but don't force display update if it's blur
        }
    } else {
        // Invalid char typed, revert display to last valid prop value if input becomes non-pattern matching
        // This is tricky; for now, let blur handle final cleanup of invalid strings.
        // Or, we could parse the old internalDisplayValue and set based on that.
    }
  };

  const handleInputBlur = () => {
    if (readOnly) return;
    processAndPropagate(internalDisplayValue, true);
  };

  const handleIncrement = () => {
    if (readOnly || value >= max) return;
    let currentVal = (typeof value === 'number' ? value : parseFloat(internalDisplayValue));
    if(isNaN(currentVal)) currentVal = min > 0 ? min: 0;
    const newVal = Math.min(max, currentVal + step);
    onChange(allowDecimal ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
  };

  const handleDecrement = () => {
    if (readOnly || value <= min) return;
    let currentVal = (typeof value === 'number' ? value : parseFloat(internalDisplayValue));
    if(isNaN(currentVal)) currentVal = min > 0 ? min: 0;
    const newVal = Math.max(min, currentVal - step);
    onChange(allowDecimal ? parseFloat(newVal.toFixed(1)) : Math.round(newVal));
  };
  
  const inputStyles = `bg-transparent text-slate-500 text-xl font-['Space_Grotesk'] leading-loose text-center focus:outline-none border-none`;

  return (
    <div className={`w-full ${isInForm ? 'bg-transparent border-none rounded-none' : 'bg-white'} ${className}`}>
      <div className={`px-3 py-3 inline-flex justify-between items-center w-full ${isInForm ? 'bg-transparent border-none rounded-none' : ''}`}>
        <div className="text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">
          {label}
        </div>
        {incrementing && (
          <div className="flex justify-start items-center gap-1">
            <button 
              onClick={handleDecrement}
              disabled={readOnly || value <= min}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 focus:outline-none focus:bg-transparent"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M19.0605 7.9395C19.3418 8.22079 19.4997 8.60225 19.4997 9C19.4997 9.39775 19.3418 9.77921 19.0605 10.0605L14.121 15L19.0605 19.9395C19.3338 20.2224 19.485 20.6013 19.4816 20.9946C19.4781 21.3879 19.3204 21.7641 19.0423 22.0422C18.7642 22.3203 18.3879 22.4781 17.9946 22.4815C17.6014 22.4849 17.2224 22.3337 16.9395 22.0605L10.9395 16.0605C10.6583 15.7792 10.5004 15.3977 10.5004 15C10.5004 14.6023 10.6583 14.2208 10.9395 13.9395L16.9395 7.9395C17.2208 7.65829 17.6023 7.50032 18 7.50032C18.3978 7.50032 18.7793 7.65829 19.0605 7.9395V7.9395Z" fill="var(--neutral-300, #D4D4D4)"/>
              </svg>
            </button>
            <input 
              type="text"
              value={readOnly ? value?.toString() : internalDisplayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              readOnly={readOnly}
              className={`${inputStyles} w-16 min-w-[3ch] max-w-[20px] text-${textAlign}`}
              aria-label={label}
            />
            <button 
              onClick={handleIncrement}
              disabled={readOnly || value >= max}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 focus:outline-none focus:bg-transparent"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M10.9395 22.0605C10.6583 21.7792 10.5004 21.3977 10.5004 21C10.5004 20.6023 10.6583 20.2208 10.9395 19.9395L15.879 15L10.9395 10.0605C10.6663 9.7776 10.5151 9.39869 10.5185 9.0054C10.522 8.6121 10.6797 8.23589 10.9578 7.95777C11.2359 7.67966 11.6121 7.52191 12.0054 7.51849C12.3987 7.51507 12.7776 7.66626 13.0605 7.9395L19.0605 13.9395C19.3418 14.2208 19.4997 14.6023 19.4997 15C19.4997 15.3977 19.3418 15.7792 19.0605 16.0605L13.0605 22.0605C12.7793 22.3417 12.3978 22.4997 12 22.4997C11.6023 22.4997 11.2208 22.3417 10.9395 22.0605Z" fill="var(--neutral-300, #D4D4D4)"/>
              </svg>
            </button>
          </div>
        )}
        {!incrementing && (
          <div className={`flex-1 min-w-[3ch] text-${textAlign}`}>
             <input 
              type="text"
              value={readOnly ? value?.toString() : internalDisplayValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              readOnly={readOnly}
              className={`${inputStyles} w-full`}
              aria-label={label}
            />
          </div>
        )}
      </div>
    </div>
  );
};

NumericInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  className: PropTypes.string,
  incrementing: PropTypes.bool,
  allowDecimal: PropTypes.bool,
  readOnly: PropTypes.bool,
  textAlign: PropTypes.string,
};

export default NumericInput; 