import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from '@/components/ui/numeric-input';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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
    <div className={`flex flex-col gap-4 ${className}`}>
      <NumericInput
        label="Reps"
        value={formValues.reps}
        onChange={v => handleFormChange('reps', v)}
        min={0}
        max={999}
        className="w-full"
      />
      <NumericInput
        label="Weight"
        value={formValues.weight !== undefined && formValues.unit !== 'body' ? formValues.weight : (formValues.unit === 'body' ? 'body' : 0)}
        onChange={v => handleFormChange('weight', v)}
        min={0}
        max={999}
        className="w-full"
        incrementing={formValues.unit !== 'body'}
      />
      <ToggleGroup
        type="single"
        value={formValues.unit}
        onValueChange={unit => unit && handleFormChange('unit', unit)}
        className="w-full bg-white pt-0 pb-3 px-3 gap-3"
      >
        <ToggleGroupItem value="lbs">lbs</ToggleGroupItem>
        <ToggleGroupItem value="kg">kg</ToggleGroupItem>
        <ToggleGroupItem value="body">body</ToggleGroupItem>
      </ToggleGroup>
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