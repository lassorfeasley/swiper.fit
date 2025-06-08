import React from 'react';
import PropTypes from 'prop-types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "../../../../../src/components/ui/sheet";
import NumericInput from 'components/common/forms/NumericInput';
import ToggleGroup from 'components/common/forms/ToggleGroup';

const SetEditSheet = ({
  isOpen,
  onOpenChange,
  formPrompt = "Edit set",
  onSave,
  initialValues = { reps: 0, weight: 0, unit: 'lbs' },
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
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle>{formPrompt}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4">
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
            options={[
              { label: 'lbs', value: 'lbs' },
              { label: 'kg', value: 'kg' },
              { label: 'body', value: 'body' },
            ]}
            value={formValues.unit}
            onChange={unit => handleFormChange('unit', unit)}
            className="w-full bg-white pt-0 pb-3 px-3 gap-3"
          />
        </div>
        <SheetFooter className="mt-6">
          <button
            onClick={handleSave}
            className="w-full bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors"
          >
            Save
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

SetEditSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  formPrompt: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  initialValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
  }),
};

export default SetEditSheet; 