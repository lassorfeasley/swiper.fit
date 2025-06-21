import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import {
  SwiperAccordion,
  SwiperAccordionItem,
  SwiperAccordionTrigger,
  SwiperAccordionContent,
} from "@/components/molecules/swiper-accordion";
import SwiperAccordionGroup from "@/components/molecules/swiper-accordion-group";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SetEditForm from "./SetEditForm";

const unitOptions = [
  { label: "lbs", value: "lbs" },
  { label: "kg", value: "kg" },
  { label: "body", value: "body" },
];

const setTypeOptions = [
  { label: "Reps", value: "reps" },
  { label: "Timed", value: "timed" },
];

const AddExerciseToProgramForm = ({
  onAddExercise,
  onAddExerciseFuture,
  onCancel,
  formPrompt = "Add to program",
  initialSets = 3,
  initialSetConfigs = [],
}) => {
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState(initialSets || 3);
  const [setConfigs, setSetConfigs] = useState(
    Array.from(
      { length: initialSets || 3 },
      (_, i) =>
        initialSetConfigs[i] || {
          reps: 3,
          weight: 25,
          unit: "lbs",
          set_type: "reps",
        }
    )
  );
  const [openSet, setOpenSet] = useState("defaults");
  const [setDefaults, setSetDefaults] = useState({
    reps: initialSetConfigs[0]?.reps ?? 3,
    weight: initialSetConfigs[0]?.weight ?? 25,
    unit: initialSetConfigs[0]?.unit ?? "lbs",
    set_type: initialSetConfigs[0]?.set_type ?? "reps",
    timed_set_duration: initialSetConfigs[0]?.timed_set_duration,
  });

  useEffect(() => {
    setSetConfigs((prev) => {
      const arr = Array.from(
        { length: sets },
        (_, i) => prev[i] || { ...setDefaults }
      );
      return arr;
    });
  }, [sets, setDefaults]);

  const handleSetFieldChange = (idx, newValues) => {
    setSetConfigs((prev) =>
      prev.map((cfg, i) => (i === idx ? newValues : cfg))
    );
  };

  const handleSetDefaultsChange = (newValues) => {
    setSetDefaults(newValues);
  };

  const handleSaveToday = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) {
      alert("Exercise name is required.");
      return;
    }
    if (sets < 1) {
      alert("At least one set is required.");
      return;
    }
    if (typeof onAddExercise === "function") {
      onAddExercise({
        name: exerciseName,
        setConfigs,
        sets,
      });
    }
  };

  const handleSaveFuture = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) {
      alert("Exercise name is required.");
      return;
    }
    if (sets < 1) {
      alert("At least one set is required.");
      return;
    }
    if (typeof onAddExerciseFuture === "function") {
      onAddExerciseFuture({
        name: exerciseName,
        setConfigs,
        sets,
      });
    }
  };

  return (
    <form className="Editexerciseform w-full max-w-sm box-border inline-flex flex-col justify-start items-start gap-6">
      <div className="CreateExercise self-stretch justify-start text-slate-600 text-heading-lg font-medium leading-7">
        {formPrompt}
      </div>
      <div className="Frame13 self-stretch flex flex-col justify-start items-start gap-3">
        <TextInput
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          customPlaceholder="Exercise name"
        />
        <div className="NumericField self-stretch h-20 flex flex-col justify-start items-start gap-1">
          <div className="FieldLabel justify-start text-slate-600 text-label">
            Sets
          </div>
          <NumericInput value={sets} onChange={setSets} min={1} max={10} />
        </div>
      </div>
      <div className="my-2 text-slate-600 text-heading-sm font-normal leading-tight">
        Set defaults are global - edit individual sets for more control.
      </div>
      <SwiperAccordionGroup>
        <SwiperAccordion
          type="single"
          collapsible
          value={openSet}
          onValueChange={setOpenSet}
          className="w-full"
        >
          <SwiperAccordionItem
            value="defaults"
            className="border-b border-neutral-300"
          >
            <SwiperAccordionTrigger>
              <span className="font-bold">Set defaults</span>
            </SwiperAccordionTrigger>
            <SwiperAccordionContent>
              <div className="atomic-set-builder-form w-full flex flex-col justify-start items-start gap-6">
                <SetEditForm
                  isChildForm
                  initialValues={setDefaults}
                  onValuesChange={handleSetDefaultsChange}
                />
              </div>
            </SwiperAccordionContent>
          </SwiperAccordionItem>

          {Array.from({ length: sets }).map((_, idx) => {
            const setConfig = setConfigs[idx] || setDefaults;
            return (
              <SwiperAccordionItem
                key={idx}
                value={String(idx)}
                className="border-b border-neutral-300"
              >
                <SwiperAccordionTrigger>{`Set ${
                  [
                    "one",
                    "two",
                    "three",
                    "four",
                    "five",
                    "six",
                    "seven",
                    "eight",
                    "nine",
                    "ten",
                  ][idx] || idx + 1
                }`}</SwiperAccordionTrigger>
                <SwiperAccordionContent>
                  <div className="flex flex-col gap-4 py-2">
                    <div className="atomic-set-builder-form w-full flex flex-col justify-start items-start gap-6">
                      <SetEditForm
                        isChildForm
                        initialValues={setConfig}
                        onValuesChange={(newValues) =>
                          handleSetFieldChange(idx, newValues)
                        }
                      />
                    </div>
                  </div>
                </SwiperAccordionContent>
              </SwiperAccordionItem>
            );
          })}
        </SwiperAccordion>
      </SwiperAccordionGroup>

      <div className="Frame7 self-stretch flex flex-col justify-start items-start gap-3">
        <div className="w-full space-y-3">
          <div className="text-slate-600 text-body font-medium leading-tight">
            Update program?
          </div>
          <SwiperButton
            type="button"
            onClick={handleSaveToday}
            className="w-full"
            disabled={!exerciseName.trim()}
            variant={!exerciseName.trim() ? "ghost" : "default"}
          >
            Just for today
          </SwiperButton>
          <SwiperButton
            type="button"
            variant={!exerciseName.trim() ? "ghost" : "outline"}
            onClick={handleSaveFuture}
            className="w-full"
            disabled={!exerciseName.trim()}
          >
            For future workouts
          </SwiperButton>
          <SwiperButton
            type="button"
            variant="destructive"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </SwiperButton>
        </div>
      </div>
    </form>
  );
};

AddExerciseToProgramForm.propTypes = {
  onAddExercise: PropTypes.func,
  onAddExerciseFuture: PropTypes.func,
  onCancel: PropTypes.func,
  formPrompt: PropTypes.string,
  initialSets: PropTypes.number,
  initialSetConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.oneOf(["kg", "lbs", "body"]),
      set_type: PropTypes.string,
      timed_set_duration: PropTypes.number,
    })
  ),
};

export default AddExerciseToProgramForm;
