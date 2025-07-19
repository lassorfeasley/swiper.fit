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
    <>
      {showSetNameField && (
        <FormSectionWrapper className="px-0 py-0">
          <TextInput
            label="Set name"
            optional
            value={set_variant || ""}
            onChange={(e) => handleLocalChange("set_variant", e.target.value)}
            onBlur={syncWithParent}
          />
        </FormSectionWrapper>
      )}
      <FormSectionWrapper className="px-0 py-0">
        <ToggleInput
          label="Set type"
          options={setTypeOptions}
          value={set_type}
          onValueChange={handleSetTypeChange}
        />
        {set_type === "reps" ? (
          <NumericInput
            label="Reps"
            value={reps}
            onChange={repsOnChange}
            onBlur={showSetNameField ? syncWithParent : undefined}
            unitLabel="Reps"
          />
        ) : (
          <NumericInput
            label="Duration"
            value={timed_set_duration}
            onChange={durationOnChange}
            onBlur={showSetNameField ? syncWithParent : undefined}
            unitLabel="Seconds"
            step={5}
          />
        )}
        <ToggleInput
          label="Weight unit"
          options={unitOptions}
          value={unit}
          onValueChange={handleUnitChange}
        />
        {unit === "body" ? (
          <div className="w-full inline-flex flex-col justify-start items-start gap-0">
            <div className="self-stretch h-12 bg-white rounded-sm border border-neutral-300 flex justify-center items-center">
              <span className="text-slate-500 text-body">Bodyweight</span>
            </div>
          </div>
        ) : (
          <NumericInput
            label="Weight"
            value={weight}
            onChange={weightOnChange}
            onBlur={showSetNameField ? syncWithParent : undefined}
            unitLabel={unit}
            step={1}
            allowOneDecimal={true}
          />
        )}
      </FormSectionWrapper>
    </>
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
