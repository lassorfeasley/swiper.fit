import React from "react";
import PropTypes from "prop-types";
import NumericInput from "@/components/molecules/numeric-input";
import { ToggleGroup, ToggleGroupItem } from "@/components/atoms/toggle-group";

const WeightCompoundField = ({
  label = "Weight",
  value,
  onChange,
  className = "",
}) => {
  const handleWeightChange = (newWeight) => {
    onChange({ ...value, weight: newWeight });
  };

  const handleUnitChange = (newUnit) => {
    if (!newUnit) return;
    onChange({ ...value, unit: newUnit });
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="font-medium">{label}</label>
      <NumericInput
        value={
          value.weight !== undefined && value.unit !== "body"
            ? value.weight
            : value.unit === "body"
            ? "body"
            : 0
        }
        onChange={handleWeightChange}
        min={0}
        max={999}
        className="w-full"
        incrementing={value.unit !== "body"}
      />
      <ToggleGroup
        type="single"
        value={value.unit}
        onValueChange={handleUnitChange}
        className="w-full bg-white pt-0 pb-3 px-3 gap-3"
      >
        <ToggleGroupItem value="lbs">lbs</ToggleGroupItem>
        <ToggleGroupItem value="kg">kg</ToggleGroupItem>
        <ToggleGroupItem value="body">body</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};

WeightCompoundField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.shape({
    weight: PropTypes.number,
    unit: PropTypes.oneOf(["kg", "lbs", "body"]),
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default WeightCompoundField;
