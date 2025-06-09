import React, { useRef, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import NumericInput from "@/components/common/forms/NumericInput";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/src/components/ui/accordion";
import WeightCompoundField from "./WeightCompoundField";
import { Card } from "@/components/ui/card";
import SetConfigurationCard from './SetConfigurationCard';
import { Button } from '@/components/ui/button';

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

  // Reset state when editingExercise changes (i.e., when initialSetConfigs or initialSets change)
  useEffect(() => {
    setSets(initialSets ?? 3);
    setSetConfigs(
      initialSetConfigs && Array.isArray(initialSetConfigs) && initialSetConfigs.length > 0
        ? initialSetConfigs.slice(0, initialSets ?? 3)
        : Array.from({ length: initialSets ?? 3 }, () => ({
            reps: 12,
            weight: 25,
            unit: "lbs",
          }))
    );
  }, [initialSets, initialSetConfigs]);

  // Keep setConfigs in sync with sets count
  useEffect(() => {
    setSetConfigs((prevConfigs) => {
      const newSize = sets || 0;
      const oldSize = prevConfigs.length;

      // Always truncate to newSize
      let newSetConfigs = prevConfigs.slice(0, newSize);

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
    setSetConfigs((prev) =>
      prev.map((cfg, i) =>
        i === idx ? { ...cfg, [field]: value } : cfg
      )
    );
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
    <>
      <SheetHeader className="items-start">
        <SheetTitle className="text-left w-full">{formPrompt}</SheetTitle>
        <SheetDescription>
          Configure the exercise name, number of sets, and set details below.
        </SheetDescription>
      </SheetHeader>
      <div className="w-full flex flex-col gap-6 overflow-y-auto max-h-[70vh]">
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
          onChange={(newSets) => setSets(Math.max(1, Math.min(20, Number(newSets))))}
          incrementing={true}
          className="w-full"
          min={1}
          max={20}
        />
        {sets > 0 && (
          <Accordion type="single" collapsible className="w-full mt-4">
            {Array.from({ length: sets }, (_, i) => (
              <AccordionItem key={`set-${i}`} value={`set-${i}`}>
                <AccordionTrigger>
                  {`Set ${i + 1}`}
                </AccordionTrigger>
                <AccordionContent>
                  <SetConfigurationCard
                    reps={setConfigs[i]?.reps ?? 12}
                    onRepsChange={(val) => handleSetChange(i, "reps", val)}
                    weight={setConfigs[i]?.weight ?? 25}
                    onWeightChange={(val) => handleSetChange(i, "weight", val)}
                    unit={setConfigs[i]?.unit ?? "lbs"}
                    onUnitChange={(val) => handleSetChange(i, "unit", val)}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
      <Button
        className="w-full mt-6"
        onClick={isReady ? handleActionIconClick : undefined}
        disabled={!isReady}
      >
        Done
      </Button>
    </>
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
