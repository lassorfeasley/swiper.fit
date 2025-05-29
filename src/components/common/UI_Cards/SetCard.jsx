import React, { useState, useRef, useEffect } from 'react';
import SwipeSwitch from '../../workout/SwipeSwitch';
import MetricPill from './MetricPill';
import FocusForm from '../forms/FocusForm';
import WeightCompoundField from '../forms/compound-fields/WeightCompoundField';
import NumericInput from '../forms/NumericInput';
import Icon from '../Icon';

const SetCard = ({ exerciseName = 'Military press', default_view = true, defaultSets = 3, defaultReps = 12, defaultWeight = 45, onSetComplete, exerciseId, setData = [], onSetDataChange }) => {
  const [focused_view, setFocusedView] = useState(!default_view);
  const [setCount, setSetCount] = useState(defaultSets);
  const [editMetric, setEditMetric] = useState(null); // { metric: 'sets'|'reps'|'weight', setIdx: number|null }
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [editValue, setEditValue] = useState('');
  const sets = Array.from({ length: setCount }, (_, i) => {
    const fromParent = setData[i] || {};
    return {
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? defaultReps,
      weight: fromParent.weight ?? defaultWeight,
      status: fromParent.status ?? (i === 0 ? 'active' : 'locked'),
    };
  });

  // Update sets array if setCount changes
  React.useEffect(() => {
    if (onSetDataChange) {
      for (let i = 0; i < setCount; i++) {
        if (!setData[i]) {
          onSetDataChange(i + 1, 'reps', defaultReps);
          onSetDataChange(i + 1, 'weight', defaultWeight);
        }
      }
    }
  }, [setCount]);

  const toggleFocusedView = () => {
    setFocusedView(!focused_view);
  };

  const handleSetComplete = (setId) => {
    if (onSetComplete) {
      const set = sets.find(s => s.id === setId);
      if (set) {
        onSetComplete({
          setId,
          exerciseId,
          reps: set.reps,
          weight: set.weight,
          status: 'complete',
        });
      }
    }
    if (onSetDataChange) {
      onSetDataChange(setId, 'status', 'complete');
      const nextSet = sets.find(s => s.id === setId + 1);
      if (nextSet && nextSet.status === 'locked') {
        onSetDataChange(setId + 1, 'status', 'active');
      }
    }
  };

  const updateSetValue = (setId, field, value) => {
    if (onSetDataChange) {
      onSetDataChange(setId, field, value);
    }
  };
  
  const activeSet = sets.find(set => set.status === 'active') || sets[0];

  // Overlay/modal logic
  const handleMetricPillClick = (metric, setIdx = null) => {
    let value = '';
    if (metric === 'sets') value = setCount;
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
      setSetCount(Number(editValue) || 1);
    } else if (editMetric.metric === 'reps' && editMetric.setIdx !== null) {
      updateSetValue(editMetric.setIdx + 1, 'reps', editValue);
    } else if (editMetric.metric === 'weight' && editMetric.setIdx !== null) {
      updateSetValue(editMetric.setIdx + 1, 'weight', editValue);
    }
    setEditMetric(null);
  };

  // For focusing input in FocusForm
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
    sets.forEach(set => {
      // Call onSetComplete for each set, as if it were individually completed
      if (onSetComplete) {
        onSetComplete({
          setId: set.id,
          exerciseId,
          reps: set.reps,
          weight: set.weight,
          status: 'complete',
        });
      }
      // Update the status of each set to 'complete' via onSetDataChange
      if (onSetDataChange) {
        onSetDataChange(set.id, 'status', 'complete');
      }
    });
    // Optionally, if you have a visual cue for the main switch itself beyond its own state,
    // you might set forceComplete for it here, though status prop should handle it.
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
        <MetricPill value={setCount} unit="SETS" onClick={() => handleMetricPillClick('sets')} />
        {!focused_view && <MetricPill value={activeSet.reps} unit="REPS" onClick={() => handleMetricPillClick('reps', sets.indexOf(activeSet))} />}
        {!focused_view && <MetricPill value={activeSet.weight} unit="LBS" onClick={() => handleMetricPillClick('weight', sets.indexOf(activeSet))} />}
      </div>
      {focused_view ? (
        <div className="space-y-4">
          {sets.map((set, idx) => (
            <div key={set.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg">{set.name}</span>
                <div className="flex gap-4">
                  <MetricPill value={set.reps} unit="REPS" onClick={() => handleMetricPillClick('reps', idx)} />
                  <MetricPill value={set.weight} unit="LBS" onClick={() => handleMetricPillClick('weight', idx)} />
                </div>
              </div>
              <SwipeSwitch 
                status={set.status} 
                onComplete={() => handleSetComplete(set.id)} 
              />
            </div>
          ))}
        </div>
      ) : (
        <SwipeSwitch 
          status={activeSet.status} 
          onComplete={handleCompleteAllSets} 
        />
      )}
      {/* FocusForm overlay for editing metric */}
      {editMetric && (
        <FocusForm
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
        </FocusForm>
      )}
    </div>
  );
};

export default SetCard; 