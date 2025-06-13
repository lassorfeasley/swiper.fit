import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from '@/components/molecules/numeric-input';
import ToggleInput from '@/components/molecules/toggle-input';

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

const SetEditForm = ({
  formPrompt = "Edit set",
  onSave,
  initialValues = { reps: 0, weight: 0, unit: 'lbs' },
  className = '',
}) => {
  const [formValues, setFormValues] = React.useState(initialValues);

  // Reset form values when initialValues change
  React.useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleFormChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(formValues);
  };

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
      <div className="flex flex-col gap-1">
        <label className="text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Reps</label>
        <NumericInput
          value={formValues.reps}
          onChange={v => handleFormChange('reps', v)}
          min={0}
          max={999}
          className="w-full"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight</label>
        <NumericInput
          value={formValues.weight !== undefined && formValues.unit !== 'body' ? formValues.weight : (formValues.unit === 'body' ? 'body' : 0)}
          onChange={v => handleFormChange('weight', v)}
          min={0}
          max={999}
          className="w-full"
          incrementing={formValues.unit !== 'body'}
        />
      </div>
      <ToggleInput
        label="Weight unit"
        options={unitOptions}
        value={formValues.unit}
        onChange={unit => unit && handleFormChange('unit', unit)}
        className="w-full"
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
  }),
  className: PropTypes.string,
};

export default SetEditForm; 