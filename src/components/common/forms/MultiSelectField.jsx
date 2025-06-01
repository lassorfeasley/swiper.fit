import React from "react";
import PropTypes from "prop-types";

const ToggleButton = ({ label, isSelected, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-7 rounded-sm flex justify-center items-center gap-2.5 ${
        isSelected
          ? "bg-slate-200"
          : "bg-stone-50 outline outline-1 outline-offset-[-1px] outline-slate-200"
      } ${className}`}
    >
      <span
        className={`flex-1 text-center justify-start text-slate-600 ${
          isSelected ? "text-base" : "text-sm"
        } font-normal font-['Space_Grotesk'] leading-none`}
      >
        {label}
      </span>
    </button>
  );
};

ToggleButton.propTypes = {
  label: PropTypes.string.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  className: PropTypes.string,
};

const MultiSelectField = ({
  options = [],
  selectedValues = [],
  onChange,
  className = "",
  ...props
}) => {
  const handleToggle = (value) => {
    if (onChange) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter((v) => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    }
  };

  return (
    <div
      className={`inline-flex w-full h-11 p-3 bg-stone-50 justify-start items-center gap-3 ${className}`}
      {...props}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          label={option.label}
          isSelected={selectedValues.includes(option.value)}
          onClick={() => handleToggle(option.value)}
        />
      ))}
    </div>
  );
};

MultiSelectField.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedValues: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default MultiSelectField; 