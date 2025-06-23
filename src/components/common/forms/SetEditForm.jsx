import React, { useState, useEffect, memo } from "react";
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
        <TextInput
          label="Set name"
          optional
          value={set_variant}
          onChange={(e) => handleLocalChange("set_variant", e.target.value)}
          onBlur={syncWithParent}
        />
      )}
      <ToggleInput
        label="Set type"
        options={setTypeOptions}
        value={set_type}
        onChange={handleSetTypeChange}
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
        onChange={handleUnitChange}
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
    </>
  );
};

const SetEditForm = memo(
  ({
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
  }) => {
    const [formValues, setFormValues] = useState(initialValues);
    const initialRef = React.useRef(initialValues);

    // track dirty
    React.useEffect(() => {
      const dirty =
        JSON.stringify(formValues) !== JSON.stringify(initialRef.current);
      onDirtyChange?.(dirty);
    }, [formValues, onDirtyChange]);

    const handleLocalChange = (field, value) => {
      setFormValues((prev) => {
        const newVals = { ...prev, [field]: value };
        if (onValuesChange) onValuesChange(newVals);
        return newVals;
      });
    };

    const syncWithParent = () => {
      if (onValuesChange) {
        onValuesChange(formValues);
      }
    };

    const handleImmediateSync = (field, value) => {
      const newValues = { ...formValues, [field]: value };
      setFormValues(newValues);
      if (onValuesChange) {
        onValuesChange(newValues);
      }
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
        const newValues = { ...formValues, unit: val };
        setFormValues(newValues);
        if (onValuesChange) {
          onValuesChange(newValues);
        }
      }
    };

    const weightOnChange = showSetNameField
      ? (val) => handleLocalChange("weight", val)
      : (val) => handleImmediateSync("weight", val);

    // Toggle for saving scope
    const [addType, setAddType] = useState("today");

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

    if (isChildForm) {
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
    }

    return (
      <div className={`w-full flex flex-col justify-start items-start gap-0 ${className}`}>
        {!isChildForm && !hideInternalHeader && (
          <div className="EditSetOne self-stretch h-6 justify-start text-slate-600 text-lg font-medium leading-7">
            {formPrompt}
          </div>
        )}
        <FormSectionWrapper>
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
        </FormSectionWrapper>
        {!isChildForm && (
          <div className="flex flex-col gap-3 border-t border-neutral-300 pt-4 pb-4">
            {onSaveForFuture && (
              <ToggleInput
                label="Keep new settings?"
                options={[
                  { label: "Just for today", value: "today" },
                  { label: "Permanently", value: "future" },
                ]}
                value={addType}
                onChange={(val) => val && setAddType(val)}
              />
            )}
            {!hideActionButtons && (
              <>
                <SwiperButton
                  onClick={handleSave}
                  variant="default"
                  className="w-full"
                >
                  Save
                </SwiperButton>
                {onDelete && (
                  <SwiperButton
                    onClick={onDelete}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete Set
                  </SwiperButton>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

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
};

export default SetEditForm;
