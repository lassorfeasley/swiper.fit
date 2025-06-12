import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CardWrapper from './Wrappers/CardWrapper';
import CardPill from '@/components/molecules/CardPill';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import SetEditForm from '@/components/common/forms/SetEditForm';

const ExerciseCard = ({ exerciseName, setConfigs = [], className = '', onEdit, onSetConfigsChange, mode = 'default' }) => {
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSetIndex, setEditSetIndex] = useState(null);
  const [editFormValues, setEditFormValues] = useState({ reps: 0, weight: 0, unit: 'lbs' });
  const [localSetConfigs, setLocalSetConfigs] = useState(setConfigs);

  const setsAreEditable = onSetConfigsChange !== undefined && mode !== 'completed';

  // Keep localSetConfigs in sync with setConfigs prop
  useEffect(() => {
    setLocalSetConfigs(setConfigs);
  }, [setConfigs]);

  // Open edit sheet for a set
  const handleSetEdit = (idx) => {
    if (!setsAreEditable) return;
    setEditSetIndex(idx);
    setEditFormValues(localSetConfigs[idx]);
    setEditSheetOpen(true);
  };

  // Save edited set values
  const handleEditFormSave = (values) => {
    setLocalSetConfigs(prev => {
      const updated = prev.map((cfg, i) => i === editSetIndex ? { ...cfg, ...values } : cfg);
      if (onSetConfigsChange) {
        onSetConfigsChange(updated);
      }
      return updated;
    });
    setEditSheetOpen(false);
    setEditSetIndex(null);
  };

  return (
    <CardWrapper className={className}>
      <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {localSetConfigs.length === 0 ? 'No sets' : localSetConfigs.length === 1 ? 'One set' : localSetConfigs.length === 2 ? 'Two sets' : localSetConfigs.length === 3 ? 'Three sets' : `${localSetConfigs.length} sets`}
          </div>
        </div>
        {onEdit && (
          <button
            type="button"
            className="ml-2 text-blue-500 hover:underline"
            onClick={onEdit}
            tabIndex={0}
          >
            Edit
          </button>
        )}
      </div>
      <div className="Setpillwrapper self-stretch flex flex-wrap items-start gap-3 content-start p-3 bg-white">
        {localSetConfigs.map((config, idx) => (
          <CardPill
            key={idx}
            reps={config.reps}
            weight={config.weight}
            unit={config.unit || 'lbs'}
            editable={setsAreEditable}
            onEdit={() => handleSetEdit(idx)}
            complete={mode === 'completed'}
          />
        ))}
      </div>
      {setsAreEditable && (
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit set</SheetTitle>
          </SheetHeader>
          <SetEditForm
            onSave={handleEditFormSave}
            initialValues={editFormValues}
          />
        </SheetContent>
      </Sheet>
      )}
    </CardWrapper>
  );
};

ExerciseCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string
  })),
  className: PropTypes.string,
  onEdit: PropTypes.func,
  onSetConfigsChange: PropTypes.func,
  mode: PropTypes.oneOf(['default', 'completed']),
};

export default ExerciseCard; 