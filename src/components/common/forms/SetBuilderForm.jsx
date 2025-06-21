import React, { useState, useEffect } from "react";
import ToggleInput from "@/components/molecules/toggle-input";
import NumericInput from "@/components/molecules/numeric-input";

const setTypeOptions = [
  { label: "Reps", value: "reps" },
  { label: "Timed", value: "timed" },
];
const unitOptions = [
  { label: "lbs", value: "lbs" },
  { label: "kg", value: "kg" },
  { label: "body", value: "body" },
];

export default function SetBuilderForm({ initialDefaults, onDefaultsChange }) {
  const [defaults, setDefaults] = useState(initialDefaults);

  useEffect(() => {
    setDefaults(initialDefaults);
  }, [initialDefaults]);

  const handleDefaultChange = (field, value) => {
    const newDefaults = { ...defaults, [field]: value };
    setDefaults(newDefaults);
    onDefaultsChange(field, value);
  };

  const handleSetTypeChange = (val) => {
    handleDefaultChange("set_type", val);
    if (val === "timed" && !defaults.timed_set_duration) {
      handleDefaultChange("timed_set_duration", 30);
    }
  };

  return (
    <div className="w-full self-stretch flex flex-col justify-start items-start gap-3">
      <div className="w-full self-stretch flex flex-col justify-start items-start gap-4">
        <div className="w-full self-stretch flex flex-col justify-start items-center gap-1">
          <div className="w-full self-stretch justify-start text-slate-600 text-label">
            Set type
          </div>
          <ToggleInput
            options={setTypeOptions}
            value={defaults.set_type}
            onChange={handleSetTypeChange}
          />
        </div>
        <div className="w-full self-stretch flex flex-col justify-start items-start gap-1">
          <NumericInput
            value={
              defaults.set_type === "reps"
                ? defaults.reps
                : defaults.timed_set_duration
            }
            onChange={(val) =>
              defaults.set_type === "reps"
                ? handleDefaultChange("reps", val)
                : handleDefaultChange("timed_set_duration", val)
            }
            min={0}
            max={999}
            unitLabel={defaults.set_type === "reps" ? "reps" : "seconds"}
          />
        </div>
        <div className="w-full self-stretch flex flex-col justify-start items-center gap-1">
          <div className="w-full self-stretch justify-start text-slate-600 text-label">
            Weight unit
          </div>
          <ToggleInput
            options={unitOptions}
            value={defaults.unit}
            onChange={(val) => handleDefaultChange("unit", val)}
          />
        </div>
        <div className="w-full self-stretch flex flex-col justify-start items-start gap-1">
          <NumericInput
            value={defaults.unit !== "body" ? defaults.weight : "body"}
            onChange={(val) => handleDefaultChange("weight", val)}
            min={0}
            max={999}
            incrementing={defaults.unit !== "body"}
            unitLabel={defaults.unit !== "body" ? defaults.unit : undefined}
          />
        </div>
      </div>
    </div>
  );
}
