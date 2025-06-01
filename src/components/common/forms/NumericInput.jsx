import React from "react";
import PropTypes from "prop-types";
import Icon from "../Icon";

const NumericInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  className = "",
  error,
  ...props
}) => {
  const handleIncrement = () => {
    if (value < max) {
      onChange(String(Number(value) + step).padStart(2, '0'));
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(String(Number(value) - step).padStart(2, '0'));
    }
  };

  return (
    <div
      className={`inline-flex w-full h-11 p-2.5 bg-transparent justify-between items-center ${
        error ? "border border-red-500" : ""
      } ${className}`}
      {...props}
    >
      <label className="justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-none">
        {label}
      </label>
      <div className="flex justify-start items-center gap-1">
        <button
          onClick={handleDecrement}
          className="w-6 h-6 flex items-center justify-center rotate-90"
          disabled={Number(value) <= min}
        >
          <Icon
            name="arrow_drop_down"
            variant="outlined"
            size={24}
            className="text-slate-200"
          />
        </button>
        <span className="justify-start text-slate-500 text-xl font-medium font-['Space_Grotesk'] leading-normal">
          {String(value).padStart(2, '0')}
        </span>
        <button
          onClick={handleIncrement}
          className="w-6 h-6 flex items-center justify-center -rotate-90"
          disabled={Number(value) >= max}
        >
          <Icon
            name="arrow_drop_down"
            variant="outlined"
            size={24}
            className="text-slate-200"
          />
        </button>
      </div>
    </div>
  );
};

NumericInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  className: PropTypes.string,
  error: PropTypes.bool,
};

export default NumericInput; 