import React from "react";
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
}) => {
  const decrement = () => {
    if (readOnly) return;
    onChange(Math.max(min, Number(value) - step));
  };
  const increment = () => {
    if (readOnly) return;
    onChange(Math.min(max, Number(value) + step));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="flex items-center gap-4 px-4 py-2 border rounded-md shadow-sm w-fit">
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
          type="number"
          value={value}
          readOnly
          className="w-12 text-center border-none focus:outline-none bg-transparent"
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
};

export default NumericInput; 