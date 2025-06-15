import React from 'react';
import PropTypes from 'prop-types';
import SetBuilderForm from './SetBuilderForm';

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

const setTypeOptions = [
  { label: 'Reps', value: 'reps' },
  { label: 'Timed', value: 'timed' },
];

const SetEditForm = ({
  formPrompt = "Edit set",
  onSave,
  initialValues = { reps: 0, weight: 0, unit: 'lbs' },
  className = '',
}) => {
  const [formValues, setFormValues] = React.useState(initialValues);
  const [setType, setSetType] = React.useState(initialValues.set_type || 'reps');

  React.useEffect(() => {
    setFormValues(initialValues);
    setSetType(initialValues.set_type || 'reps');
  }, [initialValues]);

  // Default to 30 seconds when switching to timed
  const handleSetTypeChange = (val) => {
    setSetType(val);
    setFormValues(prev => {
      const next = { ...prev, set_type: val };
      if (val === 'timed' && (!prev.timed_set_duration || prev.timed_set_duration === 0)) {
        next.timed_set_duration = 30;
      }
      if (val === 'reps') {
        next.timed_set_duration = undefined;
      }
      return next;
    });
  };

  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave({ ...formValues, set_type: setType });
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <SetBuilderForm
        setType={setType}
        onSetTypeChange={handleSetTypeChange}
        reps={formValues.reps}
        timed_set_duration={formValues.timed_set_duration}
        onRepsChange={v => handleFormChange('reps', v)}
        onTimedDurationChange={v => handleFormChange('timed_set_duration', v)}
        weight={formValues.weight}
        unit={formValues.unit}
        onWeightChange={v => handleFormChange('weight', v)}
        onUnitChange={unit => unit && handleFormChange('unit', unit)}
      />
      <button
        onClick={handleSave}
        className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
      >
        Save
      </button>
    </div>
  );
};

SetEditForm.propTypes = {
  formPrompt: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
    set_type: PropTypes.string,
    timed_set_duration: PropTypes.number,
  }),
  className: PropTypes.string,
};

export default SetEditForm; 