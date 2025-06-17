import React, { useState, useEffect, memo } from 'react';
import PropTypes from 'prop-types';
import NumericInput from '@/components/molecules/numeric-input';
import { SwiperButton } from '@/components/molecules/swiper-button';
import ToggleInput from '@/components/molecules/toggle-input';
import { TextInput } from '@/components/molecules/text-input';

const setTypeOptions = [
  { label: 'Reps', value: 'reps' },
  { label: 'Timed', value: 'timed' },
];

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
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
  const { set_type = 'reps', reps = 0, weight = 0, unit = 'lbs', timed_set_duration = 30, set_variant = '' } = formValues;

  return (
    <div className="Frame14 self-stretch flex flex-col justify-start items-start gap-4">
      {showSetNameField && <TextInput
        label="Name set (optional)"
        value={set_variant}
        onChange={(e) => handleLocalChange('set_variant', e.target.value)}
        onBlur={syncWithParent}
        customPlaceholder="e.g. Set one, Warm-up"
      />}
      <ToggleInput
          label="Set type"
          options={setTypeOptions}
          value={set_type}
          onChange={handleSetTypeChange}
      />
      {set_type === 'reps' ? (
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
      {unit === 'body' ? (
        <div className="w-full inline-flex flex-col justify-start items-start gap-0">
          <div className="self-stretch h-12 bg-white rounded-sm border border-neutral-300 flex justify-center items-center">
            <span className="text-slate-500 text-base font-normal font-['Space_Grotesk'] leading-normal">Bodyweight</span>
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
    </div>
  );
};

const SetEditForm = memo(({
  formPrompt = "Edit set",
  onSave,
  onSaveForFuture,
  onValuesChange,
  isChildForm,
  initialValues = { reps: 0, weight: 0, unit: 'lbs', set_type: 'reps', set_variant: '' },
  className = '',
  showSetNameField = true,
}) => {
  const [formValues, setFormValues] = useState(initialValues);

  const handleLocalChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
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
    if (val === 'timed' && (!formValues.timed_set_duration || formValues.timed_set_duration === 0)) {
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

  const handleSaveToday = () => {
    onSave(formValues);
  };

  const handleSaveFuture = () => {
    if (onSaveForFuture) {
      onSaveForFuture(formValues);
    } else {
      onSave(formValues);
    }
  };

  const repsOnChange = showSetNameField ? (val) => handleLocalChange('reps', val) : (val) => handleImmediateSync('reps', val);
  const durationOnChange = showSetNameField ? (val) => handleLocalChange('timed_set_duration', val) : (val) => handleImmediateSync('timed_set_duration', val);
  const weightOnChange = showSetNameField ? (val) => handleLocalChange('weight', val) : (val) => handleImmediateSync('weight', val);

  if (isChildForm) {
    return (
      <div className={`Setconfigurationform w-full inline-flex flex-col justify-start items-start gap-6 ${className}`}>
        <div className="Atomicsetbuilderform w-full flex flex-col justify-start items-start gap-6">
          <div className="Frame7 self-stretch flex flex-col justify-start items-start gap-3">
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
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`Setconfigurationform w-full inline-flex flex-col justify-start items-start gap-6 ${className}`}>
      {!isChildForm && <div className="EditSetOne self-stretch h-6 justify-start text-slate-600 text-lg font-medium font-['Space_Grotesk'] leading-7">{formPrompt}</div>}
      <div className="Atomicsetbuilderform w-full flex flex-col justify-start items-start gap-6">
        <div className="Frame7 self-stretch flex flex-col justify-start items-start gap-3">
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
        </div>
      </div>
      {!isChildForm && <div className="Frame6 self-stretch flex flex-col justify-start items-start gap-3">
        {onSaveForFuture && <div className="UpdateProgram self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Update program?</div>}
        <SwiperButton onClick={handleSaveToday} variant="default" className="w-full">
          Just for today
        </SwiperButton>
        {onSaveForFuture && (
          <SwiperButton onClick={handleSaveFuture} variant="destructive" className="w-full">
            For future workouts
          </SwiperButton>
        )}
      </div>}
    </div>
  );
});

SetEditForm.propTypes = {
  formPrompt: PropTypes.string,
  onSave: PropTypes.func,
  onSaveForFuture: PropTypes.func,
  onValuesChange: PropTypes.func,
  isChildForm: PropTypes.bool,
  initialValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
    set_type: PropTypes.string,
    timed_set_duration: PropTypes.number,
    set_variant: PropTypes.string,
  }),
  className: PropTypes.string,
  showSetNameField: PropTypes.bool,
};

export default SetEditForm; 