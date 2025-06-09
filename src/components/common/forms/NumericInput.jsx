import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const NumericInput = ({
  label,
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
}) => {
  const [internalValue, setInternalValue] = useState(value?.toString() ?? "");

  useEffect(() => {
    // Sync internal value if prop changes from outside
    if (value?.toString() !== internalValue) {
      setInternalValue(value?.toString() ?? "");
    }
    // eslint-disable-next-line
  }, [value]);

  const decrement = () => {
    if (readOnly) return;
    const newValue = Math.max(min, Number(value) - step);
    onChange(newValue);
  };
  const increment = () => {
    if (readOnly) return;
    const newValue = Math.min(max, Number(value) + step);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    if (readOnly) return;
    const val = e.target.value;
    // Allow empty string for typing
    if (val === "") {
      setInternalValue("");
      return;
    }
    // Only allow valid numbers (optionally with up to two decimals)
    const pattern = allowTwoDecimals ? /^-?\d*(\.\d{0,2})?$/ : /^-?\d*$/;
    if (pattern.test(val)) {
      setInternalValue(val);
      const num = Number(val);
      if (!isNaN(num) && val !== "-" && val !== "." && val !== "-." && val !== "0.") {
        if (num >= min && num <= max) {
          onChange(num);
        }
      }
    }
  };

  const handleBlur = () => {
    if (readOnly) return;
    let num = Number(internalValue);
    if (isNaN(num)) num = min;
    num = Math.max(min, Math.min(max, num));
    // If allowTwoDecimals, round to two decimals, else integer
    num = allowTwoDecimals ? Math.round(num * 100) / 100 : Math.round(num);
    setInternalValue(num.toString());
    onChange(num);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center gap-4 px-4 py-2 border rounded-md shadow-sm w-fit h-[52px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={decrement}
          className="text-xl"
          disabled={readOnly || value <= min}
          tabIndex={-1}
        >
          −
        </Button>
        <input
          id={id}
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          readOnly={readOnly}
          className="w-12 h-[52px] text-center border-none focus:outline-none bg-transparent"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={increment}
          className="text-xl"
          disabled={readOnly || value >= max}
          tabIndex={-1}
        >
          +
        </Button>
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
  readOnly: PropTypes.bool,
  id: PropTypes.string,
  allowTwoDecimals: PropTypes.bool, // If true, allow up to two decimal places
};

export default NumericInput; 