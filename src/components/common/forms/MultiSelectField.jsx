import React from "react";
import PropTypes from "prop-types";
import ToggleButton from './ToggleGroup';

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