import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import SlideUpForm from "../SlideUpForm";
import { Input } from "components/ui/input";
import NumericInput from "../NumericInput";
import SetDropdown from "./SetDropdown";
import FormGroupWrapper from "../FormWrappers/FormGroupWrapper";

const ExerciseSetConfiguration = ({
  onActionIconClick,
  formPrompt = "Create a new exercise",
  initialName,
  initialSets,
  initialSetConfigs,
  ...props
}) => {
  const inputRef = useRef(null);
  const [exerciseName, setExerciseName] = useState(initialName || "");
  const [sets, setSets] = useState(initialSets ?? 3); // Default value of 3
  const [openSetIndex, setOpenSetIndex] = useState(0); // First set open by default
  // Per-set data: [{ reps, weight, unit }]
  const [setConfigs, setSetConfigs] = useState(() =>
    initialSetConfigs &&
    Array.isArray(initialSetConfigs) &&
    initialSetConfigs.length > 0
      ? initialSetConfigs
      : Array.from({ length: initialSets ?? 3 }, () => ({
          reps: 12,
          weight: 25,
          unit: "lbs",
        }))
  );

  // Keep setConfigs in sync with sets count
  useEffect(() => {
    setSetConfigs((prevConfigs) => {
      const newSize = sets || 0;
      const oldSize = prevConfigs.length;

      if (newSize === oldSize) {
        return prevConfigs;
      }

      const newSetConfigs = [...prevConfigs];
      newSetConfigs.length = newSize; // Truncate or expand array

      // If expanding, fill new spots with default values from the first set, or hardcoded defaults
      if (newSize > oldSize) {
        const defaultSet = {
          reps: prevConfigs[0]?.reps ?? 12,
          weight: prevConfigs[0]?.weight ?? 25,
          unit: prevConfigs[0]?.unit ?? "lbs",
        };
        for (let i = oldSize; i < newSize; i++) {
          newSetConfigs[i] = { ...defaultSet };
        }
      }

      return newSetConfigs;
    });
  }, [sets]);

  // Autofocus the input on mount (if provided)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isReady = exerciseName.trim().length > 0;

  // Helper: when editing first set, update all sets that still match the old first set value
  const handleSetChange = (idx, field, value) => {
    setSetConfigs((prev) => {
      if (field === "unit") {
        // Enforce single unit for all sets
        return prev.map((cfg) => ({ ...cfg, unit: value }));
      }
      if (idx === 0) {
        // Editing the first set: update all sets that match the old first set value
        const oldFirst = prev[0];
        return prev.map((cfg, i) => {
          if (i === 0) return { ...cfg, [field]: value };
          // Only update if this set matches the old first set value for this field
          if (cfg[field] === oldFirst[field]) {
            return { ...cfg, [field]: value };
          }
          return cfg;
        });
      } else {
        // Editing a later set: just update that set
        return prev.map((cfg, i) =>
          i === idx ? { ...cfg, [field]: value } : cfg
        );
      }
    });
  };

  const handleActionIconClick = () => {
    if (onActionIconClick) {
      onActionIconClick({
        name: exerciseName,
        sets,
        setConfigs,
      });
    } else {
      alert("Action icon clicked!");
    }
  };

  return (
    <SlideUpForm
      formPrompt={formPrompt}
      isReady={isReady}
      onActionIconClick={isReady ? handleActionIconClick : undefined}
      {...props}
    >
      <div className="w-full flex flex-col gap-0">
        <FormGroupWrapper>
          <Input
            type="text"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            placeholder="Enter exercise name"
            className="w-full"
          />
          <NumericInput
            label="Sets"
            value={sets}
            onChange={(newSets) => setSets(Math.max(0, Number(newSets)))}
            incrementing={true}
            className="w-full"
          />
        </FormGroupWrapper>
        {sets > 0 &&
          Array.from({ length: sets }, (_, i) => (
            <SetDropdown
              key={`set-${i}`}
              setNumber={i + 1}
              defaultReps={setConfigs[0]?.reps ?? 12}
              defaultWeight={setConfigs[0]?.weight ?? 25}
              defaultUnit={setConfigs[0]?.unit ?? "lbs"}
              isOpen={openSetIndex === i}
              onToggle={() => setOpenSetIndex(openSetIndex === i ? null : i)}
              reps={setConfigs[i]?.reps ?? 12}
              weight={setConfigs[i]?.weight ?? 25}
              unit={setConfigs[i]?.unit ?? "lbs"}
              onRepsChange={(val) => handleSetChange(i, "reps", val)}
              onWeightChange={(val) => handleSetChange(i, "weight", val)}
              onUnitChange={(val) => handleSetChange(i, "unit", val)}
            />
          ))}
      </div>
    </SlideUpForm>
  );
};

ExerciseSetConfiguration.propTypes = {
  onActionIconClick: PropTypes.func,
  formPrompt: PropTypes.string,
  initialName: PropTypes.string,
  initialSets: PropTypes.number,
  initialSetConfigs: PropTypes.array,
};

export default ExerciseSetConfiguration;
