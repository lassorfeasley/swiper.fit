import React, { useState, useEffect, memo, useRef } from "react";
import PropTypes from "prop-types";
import NumericInput from "@/components/molecules/numeric-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import ToggleInput from "@/components/molecules/toggle-input";
import { TextInput } from "@/components/molecules/text-input";
import FormSectionWrapper from "./wrappers/FormSectionWrapper";

const setTypeOptions = [
  { label: "Reps", value: "reps" },
  { label: "Timed", value: "timed" },
];

const unitOptions = [
  { label: "lbs", value: "lbs" },
  { label: "kg", value: "kg" },
  { label: "body", value: "body" },
];

const FormContent = ({
  formValues,
  showSetNameField,
  handleLocalChange,
  handleSetTypeChange,
  handleUnitChange,
  syncWithParent,
  repsOnChange,
  durationOnChange,
  weightOnChange,
  onDelete,
  addType,
  onAddTypeChange,
}) => {
  const {
    set_type = "reps",
    reps = 0,
    weight = 0,
    unit = "lbs",
    timed_set_duration = 30,
    set_variant = "",
  } = formValues;

  return (
    <div className="w-full bg-stone-50 inline-flex flex-col justify-start items-center">
      {showSetNameField && (
                <div className="self-stretch p-4 border-b border-neutral-300 flex flex-col justify-center items-start">
          <TextInput
            label="Set name"
            value={set_variant || ""}
            onChange={(e) => handleLocalChange("set_variant", e.target.value)}
            onBlur={syncWithParent}
            customPlaceholder=""
          />
        </div>
      )}
      
      <div className="self-stretch p-4 border-b border-neutral-300 flex flex-col justify-center items-start gap-3">
        <div data-field-label="true" className="w-full flex flex-col justify-start items-center gap-2">
          <div className="self-stretch justify-start text-slate-500 text-sm font-medium leading-tight">Set type</div>
          <div className="self-stretch rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden">
            <ToggleInput
              value={set_type}
              onValueChange={handleSetTypeChange}
              options={setTypeOptions}
              className="flex-1 h-7"
            />
          </div>
        </div>
        <div data-feild-label="false" data-optional="false" data-property-1="default" data-show-units="true" className="self-stretch flex flex-col justify-start items-start gap-2">
          {set_type === "reps" ? (
            <NumericInput
              value={reps}
              onChange={repsOnChange}
              onBlur={showSetNameField ? syncWithParent : undefined}
              unitLabel="Reps"
              className="self-stretch h-12"
            />
          ) : (
            <NumericInput
              value={timed_set_duration}
              onChange={durationOnChange}
              onBlur={showSetNameField ? syncWithParent : undefined}
              unitLabel="Seconds"
              step={5}
              className="self-stretch h-12"
            />
          )}
        </div>
      </div>
      
      <div className="self-stretch p-4 border-b border-neutral-300 flex flex-col justify-center items-start gap-3">
        <div data-field-label="true" className="w-full flex flex-col justify-start items-center gap-2">
          <div className="self-stretch justify-start text-slate-500 text-sm font-medium leading-tight">Weight unit</div>
          <div className="self-stretch rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden">
            <ToggleInput
              value={unit}
              onValueChange={handleUnitChange}
              options={unitOptions}
              className="flex-1 h-7"
            />
          </div>
        </div>
        <div data-feild-label="false" data-optional="false" data-property-1="default" data-show-units="true" className="self-stretch flex flex-col justify-start items-start gap-2">
          {unit === "body" ? (
            <div className="self-stretch h-12 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-center items-center">
              <span className="text-slate-500 text-body">Bodyweight</span>
            </div>
          ) : (
            <NumericInput
              value={weight}
              onChange={weightOnChange}
              onBlur={showSetNameField ? syncWithParent : undefined}
              unitLabel={unit}
              step={1}
              allowOneDecimal={true}
              className="self-stretch h-12"
            />
          )}
        </div>
      </div>
      
      <div className="self-stretch p-4 border-b border-neutral-300 flex flex-col justify-center items-start">
        <div data-field-label="true" className="w-full flex flex-col justify-start items-center gap-2">
          <div className="self-stretch justify-start text-slate-500 text-sm font-medium leading-tight">Keep new settings?</div>
          <div className="self-stretch rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden">
            <ToggleInput
              value={addType || "today"}
              onValueChange={onAddTypeChange}
              options={[
                { label: "Just for today", value: "today" },
                { label: "Permanently", value: "future" }
              ]}
              className="flex-1 h-7"
            />
          </div>
        </div>
      </div>
      
      <div className="self-stretch p-4 flex flex-col justify-center items-start">
        <button
          onClick={onDelete}
          className="w-full h-12 px-4 py-2 bg-red-400 rounded inline-flex justify-center items-center gap-2.5 hover:bg-red-500 transition-colors"
        >
          <div className="justify-start text-white text-base font-medium leading-tight">Delete set</div>
        </button>
      </div>
    </div>
  );
};

const SetEditForm = React.forwardRef((
    {
      formPrompt = "Edit set",
      onSave,
      onSaveForFuture,
      onDelete,
      saveButtonText = "Just for today",
      onValuesChange,
      isChildForm,
      initialValues = {
        reps: 0,
        weight: 0,
        unit: "lbs",
        set_type: "reps",
        set_variant: "",
      },
      className = "",
      showSetNameField = true,
      hideActionButtons = false,
      hideInternalHeader = false,
      onDirtyChange,
      isUnscheduled,
      onSetProgrammaticUpdate,
      addType,
      onAddTypeChange,
      hideToggle = false,
    },
    ref
  ) => {
    const [formValues, setFormValues] = useState(initialValues);
    const initialRef = React.useRef(initialValues);
    const initialAddTypeRef = React.useRef(addType);

    // Reset form values when initialValues changes (e.g., when editing a different set)
    useEffect(() => {
      setFormValues(initialValues);
    }, [initialValues]);

    // track dirty (after addType defined)
    React.useEffect(() => {
      const dirtyForm = JSON.stringify(formValues) !== JSON.stringify(initialRef.current);
      const dirtyScope = addType !== initialAddTypeRef.current;
      onDirtyChange?.(dirtyForm || dirtyScope);
    }, [formValues, addType, onDirtyChange]);

    React.useImperativeHandle(ref, () => ({
      getFormValues: () => formValues,
    }));

    // Store the last non-bodyweight value for restore-on-toggle
    const [lastNonBodyWeight, setLastNonBodyWeight] = useState({ weight: initialValues.weight, unit: initialValues.unit });

    // Update lastNonBodyWeight if initialValues changes and is not body
    useEffect(() => {
      if (initialValues.unit !== 'body') {
        setLastNonBodyWeight({ weight: initialValues.weight, unit: initialValues.unit });
      }
    }, [initialValues.weight, initialValues.unit]);

    // Remove all direct onValuesChange calls from setFormValues and handlers
    const handleLocalChange = (field, value) => {
      const newValues = { ...formValues, [field]: value };
      setFormValues(newValues);
      if (onValuesChange) {
        onValuesChange(newValues);
      }
    };

    const syncWithParent = () => {
      // This is called onBlur, so it's safe to call onValuesChange here
      if (onValuesChange) {
        onValuesChange(formValues);
      }
    };

    const handleImmediateSync = (field, value) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
    };

    const handleSetTypeChange = (val) => {
      if (!val) return;
      const newValues = { ...formValues, set_type: val };
      if (
        val === "timed" &&
        (!formValues.timed_set_duration || formValues.timed_set_duration === 0)
      ) {
        newValues.timed_set_duration = 30;
      }
      setFormValues(newValues);
      if (onValuesChange) {
        onValuesChange(newValues);
      }
    };

    const handleUnitChange = (val) => {
      if (val) {
        let newValues = { ...formValues, unit: val };
        if (val === "body") {
          setLastNonBodyWeight({ weight: formValues.weight, unit: formValues.unit });
        } else {
          if (formValues.unit === "body") {
            newValues.weight = lastNonBodyWeight.weight || 25;
          }
        }
        setFormValues(newValues);
        if (onValuesChange) {
          onValuesChange(newValues);
        }
      }
    };

    const weightOnChange = showSetNameField
      ? (val) => handleLocalChange("weight", val)
      : (val) => handleImmediateSync("weight", val);

    const handleSave = () => {
      if (addType === "future" && onSaveForFuture) {
        onSaveForFuture(formValues);
      } else {
        onSave(formValues);
      }
    };

    const repsOnChange = showSetNameField
      ? (val) => handleLocalChange("reps", val)
      : (val) => handleImmediateSync("reps", val);
    const durationOnChange = showSetNameField
      ? (val) => handleLocalChange("timed_set_duration", val)
      : (val) => handleImmediateSync("timed_set_duration", val);

    const handleSaveSet = async () => {
      const isProgramUpdate = addType === "future";

      if (isProgramUpdate) {
        if (onSetProgrammaticUpdate) {
          onSetProgrammaticUpdate(
            formValues.exerciseId,
            formValues.routine_set_id,
            formValues
          );
        }
      } else {
        if (onSave) {
          onSave(formValues);
        }
      }
    };

    // Simplify: always render the form content; parent handles Save/Delete
    return (
      <FormContent
        formValues={formValues}
        showSetNameField={showSetNameField}
        handleLocalChange={handleLocalChange}
        handleSetTypeChange={handleSetTypeChange}
        handleUnitChange={handleUnitChange}
        syncWithParent={syncWithParent}
        repsOnChange={repsOnChange}
        durationOnChange={durationOnChange}
        weightOnChange={weightOnChange}
        onDelete={onDelete}
        addType={addType}
        onAddTypeChange={onAddTypeChange}
      />
    );
});

SetEditForm.displayName = "SetEditForm";

SetEditForm.propTypes = {
  formPrompt: PropTypes.string,
  onSave: PropTypes.func,
  onSaveForFuture: PropTypes.func,
  onDelete: PropTypes.func,
  saveButtonText: PropTypes.string,
  onValuesChange: PropTypes.func,
  isChildForm: PropTypes.bool,
  initialValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.oneOf(["kg", "lbs", "body"]),
    set_type: PropTypes.string,
    timed_set_duration: PropTypes.number,
    set_variant: PropTypes.string,
    ui_id: PropTypes.number,
  }),
  className: PropTypes.string,
  showSetNameField: PropTypes.bool,
  hideActionButtons: PropTypes.bool,
  hideInternalHeader: PropTypes.bool,
  onDirtyChange: PropTypes.func,
  isUnscheduled: PropTypes.bool,
  onSetProgrammaticUpdate: PropTypes.func,
  addType: PropTypes.string,
  onAddTypeChange: PropTypes.func,
  hideToggle: PropTypes.bool,
};

export default SetEditForm;
