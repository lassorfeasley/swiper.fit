import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CardPill from '@/components/molecules/CardPill';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SwiperSheet } from '@/components/ui/swiper-sheet';
import SetEditForm from '@/components/common/forms/SetEditForm';
import CardWrapper from '@/components/common/Cards/Wrappers/CardWrapper';
import { Reorder } from 'framer-motion';

const ExerciseCard = ({ 
  exerciseName, 
  setConfigs = [], 
  className = '', 
  onEdit, 
  onSetConfigsChange, 
  mode = 'default',
  reorderable = false,
  reorderValue,
  ...props 
}) => {
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

  const cardContent = (
    <div data-layer="CardContentsWrapper" className="w-full p-4 bg-stone-50 rounded-lg">
      <div data-layer="ExersiceCardContent" className="w-full flex flex-col gap-2">
        <div data-layer="Exercise Name" className="w-full text-slate-950 text-lg font-medium font-['Space_Grotesk'] leading-7">
          {exerciseName}
        </div>
        <div data-layer="Frame 5" data-property-1="Default" className="w-full flex flex-wrap gap-2">
          {localSetConfigs.map((config, idx) => (
            <CardPill
              key={idx}
              reps={config.reps}
              weight={config.weight}
              unit={config.unit || 'lbs'}
              editable={setsAreEditable}
              onEdit={() => handleSetEdit(idx)}
              complete={mode === 'completed'}
              className={mode === 'completed' ? 'bg-green-500 text-white' : ''}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <CardWrapper className={className}>
      {reorderable ? (
        <Reorder.Item value={reorderValue} className="w-full">
          {cardContent}
        </Reorder.Item>
      ) : (
        cardContent
      )}
      {setsAreEditable && (
        <SwiperSheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetHeader className="mb-4">
            <SheetTitle>Edit set</SheetTitle>
          </SheetHeader>
          <SetEditForm
            onSave={handleEditFormSave}
            initialValues={editFormValues}
          />
        </SwiperSheet>
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
  reorderable: PropTypes.bool,
  reorderValue: PropTypes.any,
};

export default ExerciseCard; 