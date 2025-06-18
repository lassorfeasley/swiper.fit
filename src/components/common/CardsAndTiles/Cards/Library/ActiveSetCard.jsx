import React, { useState, useRef, useEffect } from 'react';
import SwipeSwitch from 'components/workout/SwipeSwitch';
import MetricPill from 'components/common/CardsAndTiles/MetricPill';
import SlideUpForm from 'components/common/forms/SlideUpForm';
import WeightCompoundField from 'components/common/forms/compound-fields/WeightCompoundField';
import NumericInput from 'components/common/forms/NumericInput';
import Icon from 'components/common/Icon';
import PropTypes from 'prop-types';

const ActiveSetCard = ({ 
  exerciseName = 'Military press', 
  default_view = true, 
  setConfigs = [], 
  onSetComplete, 
  exerciseId, 
  setData = [], 
  onSetDataChange 
}) => {
  const [focused_view, setFocusedView] = useState(!default_view);
  const [editMetric, setEditMetric] = useState(null); // { metric: 'sets'|'reps'|'weight', setIdx: number|null }
  const [weightUnit, setWeightUnit] = useState(setConfigs[0]?.unit || 'lbs');
  const [editValue, setEditValue] = useState('');
  const setsRef = useRef(null);

  // Create sets array from setConfigs and setData
  const sets = setConfigs.map((config, i) => {
    // Use either the database ID (config.id) or create a fallback ID
    const configId = config.id || `fallback-${i}`;
    const fromParent = setData.find(d => 
      d.program_set_id === configId || 
      (d.program_set_id === config.id && config.id) ||
      (!d.program_set_id && d.id === configId)
    ) || {};
    
    return {
      id: fromParent.id || configId,
      program_set_id: configId,
      name: config.set_variant || `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? config.reps,
      weight: fromParent.weight ?? config.weight,
      unit: config.unit || 'lbs',
      status: fromParent.status ?? (i === 0 ? 'active' : 'locked'),
    };
  });

  setsRef.current = sets;

  // Update sets array if setConfigs changes
  React.useEffect(() => {
    if (onSetDataChange) {
      for (let i = 0; i < setConfigs.length; i++) {
        const config = setConfigs[i];
        const configId = config.id || `fallback-${i}`;
        const existingData = setData.find(d => 
          d.program_set_id === configId || 
          (d.program_set_id === config.id && config.id) ||
          (!d.program_set_id && d.id === configId)
        );
        if (!existingData) {
          onSetDataChange(configId, 'reps', config.reps);
          onSetDataChange(configId, 'weight', config.weight);
        }
      }
    }
  }, [setConfigs, setData]);

  const toggleFocusedView = () => {
    setFocusedView(!focused_view);
  };

  const handleSetComplete = (setId) => {
    if (onSetComplete) {
      const set = sets.find(s => s.id === setId);
      if (set) {
        onSetComplete({
          setId: set.program_set_id, // Use program_set_id for consistency
          exerciseId,
          reps: set.reps,
          weight: set.weight,
          unit: set.unit,
          set_variant: set.name,
          status: 'complete',
          program_set_id: set.program_set_id,
        });
      }
    }
    if (onSetDataChange) {
      const set = sets.find(s => s.id === setId);
      if (set) {
        // Update current set to complete
        const updates = [{
          id: setId,
          changes: { 
            status: 'complete',
            program_set_id: set.program_set_id
          }
        }];
        
        // Check if there's a next set to unlock
        const currentSetIndex = sets.findIndex(s => s.id === setId);
        const nextSet = sets[currentSetIndex + 1];
        if (nextSet && nextSet.status === 'locked') {
          updates.push({
            id: nextSet.id,
            changes: { 
              status: 'active',
              program_set_id: nextSet.program_set_id
            }
          });
        }
        
        onSetDataChange(exerciseId, updates);
      } else {
        // Fallback to legacy format
        onSetDataChange(setId, 'status', 'complete');
        const currentSetIndex = sets.findIndex(s => s.id === setId);
        const nextSet = sets[currentSetIndex + 1];
        if (nextSet && nextSet.status === 'locked') {
          onSetDataChange(nextSet.id, 'status', 'active');
        }
      }
    }
  };

  const updateSetValue = (setId, field, value) => {
    if (onSetDataChange) {
      // Find the set to get its program_set_id
      const set = sets.find(s => s.id === setId);
      if (set) {
        // Use the new array format that includes program_set_id
        const updates = [{
          id: setId,
          changes: { 
            [field]: value,
            program_set_id: set.program_set_id
          }
        }];
        onSetDataChange(exerciseId, updates);
      } else {
        // Fallback to legacy format
        onSetDataChange(setId, field, value);
      }
    }
  };
  
  const activeSet = sets.find(set => set.status === 'active') || sets[0];

  // Calculate overall status for compact view
  const allSetsComplete = sets.every(set => set.status === 'complete');
  const hasActiveSets = sets.some(set => set.status === 'active');
  const overallStatus = allSetsComplete ? 'complete' : (hasActiveSets ? 'active' : 'locked');

  // Overlay/modal logic
  const handleMetricPillClick = (metric, setIdx = null) => {
    let value = '';
    if (metric === 'sets') value = setConfigs.length;
    else if (metric === 'reps' && setIdx !== null) value = sets[setIdx].reps;
    else if (metric === 'weight' && setIdx !== null) value = sets[setIdx].weight;
    setEditMetric({ metric, setIdx });
    setEditValue(value);
  };
  const handleOverlayClose = () => setEditMetric(null);
  const handleMetricChange = (value) => {
    setEditValue(value);
  };
  const handleMetricSubmit = () => {
    if (!editMetric) return;
    if (editMetric.metric === 'sets') {
      // We can't modify the number of sets directly since it's controlled by setConfigs
      // Instead, we should notify the parent component to update setConfigs
      if (onSetDataChange) {
        const newCount = Number(editValue) || 1;
        // Notify parent to update setConfigs length
        onSetDataChange('sets', newCount);
      }
    } else if (editMetric.metric === 'reps' && editMetric.setIdx !== null) {
      updateSetValue(editMetric.setIdx + 1, 'reps', editValue);
    } else if (editMetric.metric === 'weight' && editMetric.setIdx !== null) {
      updateSetValue(editMetric.setIdx + 1, 'weight', editValue);
    }
    setEditMetric(null);
  };

  // For focusing input in SlideUpForm
  const inputRef = useRef(null);
  useEffect(() => {
    if (editMetric && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select && inputRef.current.select();
    }
  }, [editMetric]);

  // Keyboard submit
  useEffect(() => {
    if (!editMetric) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleMetricSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editMetric, editValue]);

  // Add this new function for default view swipe
  const handleCompleteAllSets = () => {
    const currentSets = setsRef.current;
    if (!currentSets) return;
    
    // Find all incomplete sets and complete them all
    const incompleteSets = currentSets.filter(set => set.status !== 'complete');
    
    // Call onSetComplete for each incomplete set
    incompleteSets.forEach(set => {
      if (onSetComplete) {
        onSetComplete({
          setId: set.program_set_id, // Use program_set_id for consistency
          exerciseId,
          reps: set.reps,
          weight: set.weight,
          unit: set.unit,
          set_variant: set.name,
          status: 'complete',
          program_set_id: set.program_set_id,
        });
      }
    });
    
    // Batch all status updates together
    if (onSetDataChange && incompleteSets.length > 0) {
      const updates = incompleteSets.map(set => ({
        id: set.id,
        changes: { 
          status: 'complete',
          program_set_id: set.program_set_id
        }
      }));
      onSetDataChange(exerciseId, updates);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-h1 font-h1 leading-h1 font-space text-[#353942] m-0">{exerciseName}</h1>
        <button className="text-xl" onClick={toggleFocusedView}>
          <span className="material-symbols-outlined text-2xl">
            {focused_view ? 'close_fullscreen' : 'open_in_full'}
          </span>
        </button>
      </div>
      <div className="mb-4 flex gap-4 items-center">
        <MetricPill value={setConfigs.length} unit="SETS" onClick={() => handleMetricPillClick('sets')} />
        {/* For REPS and LBS, pass array of values if multiple sets and not all values are the same */}
        {!focused_view && (
          (() => {
            const repsArr = sets.filter(Boolean).map(s => s?.reps ?? 0);
            const uniqueReps = Array.from(new Set(repsArr));
            return uniqueReps.length > 1 && repsArr.length <= 3 ? (
              <MetricPill values={repsArr} unit="REPS" onClick={() => handleMetricPillClick('reps', sets.indexOf(activeSet))} />
            ) : (
              <MetricPill value={activeSet?.reps ?? 0} unit="REPS" onClick={() => handleMetricPillClick('reps', sets.indexOf(activeSet))} />
            );
          })()
        )}
        {!focused_view && (
          (() => {
            const weightsArr = sets.filter(Boolean).map(s => s?.weight ?? 0);
            const uniqueWeights = Array.from(new Set(weightsArr));
            const unit = sets[0]?.unit?.toUpperCase() || 'LBS';
            return uniqueWeights.length > 1 && weightsArr.length <= 3 ? (
              <MetricPill values={weightsArr} unit={unit} onClick={() => handleMetricPillClick('weight', sets.indexOf(activeSet))} />
            ) : (
              <MetricPill value={activeSet?.weight ?? 0} unit={unit} onClick={() => handleMetricPillClick('weight', sets.indexOf(activeSet))} />
            );
          })()
        )}
      </div>
      {focused_view ? (
        <div className="space-y-4">
          {sets.filter(Boolean).map((set, idx) => (
            <div key={set?.id ?? idx} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg">{set?.name}</span>
                <div className="flex gap-4">
                  <MetricPill value={set?.reps ?? 0} unit="REPS" onClick={() => handleMetricPillClick('reps', idx)} />
                  <MetricPill value={set?.weight ?? 0} unit={set?.unit?.toUpperCase() || 'LBS'} onClick={() => handleMetricPillClick('weight', idx)} />
                </div>
              </div>
              <SwipeSwitch 
                status={set?.status ?? 'locked'} 
                onComplete={() => handleSetComplete(set?.id)} 
              />
            </div>
          ))}
        </div>
      ) : (
        <SwipeSwitch 
          status={overallStatus} 
          onComplete={handleCompleteAllSets} 
        />
      )}
      {/* SlideUpForm overlay for editing metric */}
      {editMetric && (
        <SlideUpForm
          formPrompt={`Edit ${editMetric.metric}`.replace('sets', 'sets').replace('reps', 'reps').replace('weight', 'weight')}
          onOverlayClick={handleOverlayClose}
          className="z-[100]"
          actionIcon={
            <button onClick={handleMetricSubmit} style={{ background: 'none', border: 'none', padding: 0 }}>
              <Icon name="arrow_forward" size={32} />
            </button>
          }
        >
          {editMetric.metric === 'sets' && (
            <NumericInput
              label="Sets"
              value={editValue}
              onChange={handleMetricChange}
              incrementing={true}
              min={1}
              max={99}
              ref={inputRef}
            />
          )}
          {editMetric.metric === 'reps' && editMetric.setIdx !== null && (
            <NumericInput
              label="Reps"
              value={editValue}
              onChange={handleMetricChange}
              incrementing={true}
              min={1}
              max={99}
              ref={inputRef}
            />
          )}
          {editMetric.metric === 'weight' && editMetric.setIdx !== null && (
            <WeightCompoundField
              weight={editValue}
              onWeightChange={setEditValue}
              unit={weightUnit}
              onUnitChange={setWeightUnit}
            />
          )}
        </SlideUpForm>
      )}
    </div>
  );
};

ActiveSetCard.propTypes = {
  exerciseName: PropTypes.string,
  default_view: PropTypes.bool,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string,
    set_variant: PropTypes.string
  })),
  onSetComplete: PropTypes.func,
  exerciseId: PropTypes.string.isRequired,
  setData: PropTypes.array,
  onSetDataChange: PropTypes.func
};

export default ActiveSetCard; 