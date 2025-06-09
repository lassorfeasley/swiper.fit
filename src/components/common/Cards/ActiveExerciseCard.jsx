import React, { useState, useRef, useEffect, useMemo } from 'react';
import SwipeSwitch from '@/components/ui/swipe-switch';
import SetPill from '@/components/ui/SetPill';
import SetEditSheet from '@/components/common/forms/SetEditSheet';
import WeightCompoundField from '@/components/common/forms/compound-fields/WeightCompoundField';
import NumericInput from '@/components/ui/numeric-input';
import Icon from '@/components/common/Icon';
import PropTypes from 'prop-types';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import CardWrapper from './Wrappers/CardWrapper';

const ActiveExerciseCard = ({
  exerciseId,
  exerciseName,
  initialSetConfigs = [],
  onSetComplete,
  onSetDataChange,
  isUnscheduled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [setConfigs, setSetConfigs] = useState(initialSetConfigs);
  const [openSetIndex, setOpenSetIndex] = useState(null);

  const handleSetDataChange = (configIndex, field, value) => {
    const updatedConfigs = setConfigs.map((config, index) => {
      if (index === configIndex) {
        return { ...config, [field]: value };
      }
      return config;
    });
    setSetConfigs(updatedConfigs);
    onSetDataChange?.(exerciseId, configIndex, field, value);
  };

  const onPillClick = (index) => {
    setOpenSetIndex(index);
  };

  const handleSetEdit = (configIndex, newConfig) => {
    const updatedConfigs = [...setConfigs];
    updatedConfigs[configIndex] = newConfig;
    setSetConfigs(updatedConfigs);
  };

  const handleSheetClose = () => {
    setOpenSetIndex(null);
  };

  return (
    <CardWrapper
      className="ActiveExerciseCard w-full"
      isExpanded={isExpanded}
      setIsExpanded={setIsExpanded}
      cardTitle={exerciseName}
    >
      <div className="flex flex-col gap-2 p-2">
        {setConfigs.map((config, index) => (
          <SetPill
            key={index}
            setNumber={index + 1}
            reps={config.reps}
            weight={config.weight}
            weightUnit={config.unit}
            isComplete={config.isComplete}
            onClick={() => onPillClick(index)}
            onSwipeRight={() => onSetComplete(exerciseId, index)}
          />
        ))}
        {isUnscheduled && (
          <div className="text-center text-sm text-gray-500 mt-2">
            Unscheduled Exercise
          </div>
        )}
      </div>

      {openSetIndex !== null && (
        <SetEditSheet
          isOpen={openSetIndex !== null}
          onClose={handleSheetClose}
          setNumber={openSetIndex + 1}
          initialReps={setConfigs[openSetIndex]?.reps}
          initialWeight={setConfigs[openSetIndex]?.weight}
          initialWeightUnit={setConfigs[openSetIndex]?.unit}
          onSave={(newConfig) => {
            handleSetEdit(openSetIndex, newConfig);
            handleSheetClose();
          }}
        />
      )}
    </CardWrapper>
  );
};

ActiveExerciseCard.propTypes = {
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  exerciseName: PropTypes.string.isRequired,
  initialSetConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      isComplete: PropTypes.bool,
    })
  ),
  onSetComplete: PropTypes.func,
  onSetDataChange: PropTypes.func,
  isUnscheduled: PropTypes.bool,
};

export default ActiveExerciseCard; 