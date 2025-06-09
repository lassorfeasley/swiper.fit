import React from 'react';
import PropTypes from 'prop-types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SetEditForm from './SetEditForm';

const SetEditSheet = ({
  isOpen,
  onOpenChange,
  formPrompt = "Edit set",
  onSave,
  initialValues = { reps: 0, weight: 0, unit: 'lbs' },
}) => {
  const handleSave = (formValues) => {
    onSave(formValues);
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle>{formPrompt}</SheetTitle>
        </SheetHeader>
        <SetEditForm
          formPrompt={formPrompt}
          onSave={handleSave}
          initialValues={initialValues}
        />
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