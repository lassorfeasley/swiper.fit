import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import SlideUpForm from '../SlideUpForm';
import TextField from '../TextField';
import NumericInput from '../NumericInput';
import SetDropdown from './SetDropdown';
import Icon from '../../Icon';
import WeightCompoundField from './WeightCompoundField';

const ExerciseSetConfiguration = ({ onActionIconClick, formPrompt = "Create a new exercise", actionIconName = "arrow_forward", initialName, initialSets, initialReps, initialWeight, initialUnit, initialSetConfigs, ...props }) => {
  const inputRef = useRef(null);
  const [exerciseName, setExerciseName] = useState(initialName || '');
  const [sets, setSets] = useState(initialSets ?? 3); // Default value of 3
  const [reps, setReps] = useState(initialReps ?? 12); // Default value of 12
  const [weightIncrement, setWeightIncrement] = useState(initialWeight ?? 25); // Default value of 25
  const [unit, setUnit] = useState(initialUnit || 'lbs'); // Default value of lbs
  const [openSetIndex, setOpenSetIndex] = useState(null); // Track which SetDropdown is open
  // Per-set data: [{ reps, weight, unit }]
  const [setConfigs, setSetConfigs] = useState(() =>
    initialSetConfigs && Array.isArray(initialSetConfigs) && initialSetConfigs.length > 0
      ? initialSetConfigs
      : Array.from({ length: initialSets ?? 3 }, () => ({ reps: initialReps ?? 12, weight: initialWeight ?? 25, unit: initialUnit || 'lbs' }))
  );

  // Keep setConfigs in sync with sets count and defaults
  useEffect(() => {
    setSetConfigs(prev => {
      const arr = Array.from({ length: sets }, (_, i) => prev[i] || { reps, weight: weightIncrement, unit });
      return arr.map(cfg => ({
        reps: cfg.reps ?? reps,
        weight: cfg.weight ?? weightIncrement,
        unit: cfg.unit ?? unit,
      }));
    });
  }, [sets, reps, weightIncrement, unit]);

  // Autofocus the input on mount (if provided)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const isReady = exerciseName.trim().length > 0;

  const handleSetChange = (idx, field, value) => {
    setSetConfigs(prev => prev.map((cfg, i) => i === idx ? { ...cfg, [field]: value } : cfg));
  };

  const handleActionIconClick = () => {
    if (onActionIconClick) {
      onActionIconClick({
        name: exerciseName,
        sets,
        reps,
        weight: weightIncrement,
        unit,
        setConfigs,
      });
    } else {
      alert('Action icon clicked!');
    }
  };

  return (
    <SlideUpForm
      formPrompt={formPrompt}
      actionIcon={
        <Icon
          name={actionIconName}
          size={32}
          className={isReady ? 'text-black cursor-pointer' : 'text-gray-300 cursor-not-allowed'}
        />
      }
      onActionIconClick={isReady ? handleActionIconClick : undefined}
      {...props}
    >
      <div className="w-full flex flex-col gap-0">
        <div className="bg-white rounded-xl p-4 flex flex-col gap-0">
          <TextField
            label="Exercise name"
            value={exerciseName}
            onChange={e => setExerciseName(e.target.value)}
            placeholder="Enter exercise name"
            inputRef={inputRef}
            className="w-full"
          />
          <NumericInput
            label="Sets"
            value={sets}
            onChange={newSets => setSets(Math.max(0, Number(newSets)))}
            incrementing={true}
            className="w-full"
          />
          <NumericInput
            label="Reps"
            value={reps}
            onChange={setReps}
            incrementing={true}
            className="w-full"
          />
          <WeightCompoundField
            weight={weightIncrement}
            onWeightChange={setWeightIncrement}
            unit={unit}
            onUnitChange={setUnit}
          />
        </div>
        {sets > 1 && Array.from({ length: sets }, (_, i) => (
          <SetDropdown
            key={`set-${i + 1}`}
            setNumber={i + 1}
            defaultReps={reps}
            defaultWeight={weightIncrement}
            defaultUnit={unit}
            isOpen={openSetIndex === i + 1}
            onToggle={() => setOpenSetIndex(openSetIndex === i + 1 ? null : i + 1)}
            reps={setConfigs[i]?.reps}
            weight={setConfigs[i]?.weight}
            unit={setConfigs[i]?.unit}
            onRepsChange={val => handleSetChange(i, 'reps', val)}
            onWeightChange={val => handleSetChange(i, 'weight', val)}
            onUnitChange={val => handleSetChange(i, 'unit', val)}
          />
        ))}
      </div>
    </SlideUpForm>
  );
};

ExerciseSetConfiguration.propTypes = {
  onActionIconClick: PropTypes.func,
  formPrompt: PropTypes.string,
  actionIconName: PropTypes.string,
  initialName: PropTypes.string,
  initialSets: PropTypes.number,
  initialReps: PropTypes.number,
  initialWeight: PropTypes.number,
  initialUnit: PropTypes.string,
  initialSetConfigs: PropTypes.array,
};

export default ExerciseSetConfiguration; 