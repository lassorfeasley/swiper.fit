import React, { useState, useRef, useEffect } from 'react';
import SwipeSwitch from '@/pages/Workout/components/swipe-switch';
import MetricPill from '@/components/common/CardsAndTiles/MetricPill';
import { SwiperSheet } from '@/components/molecules/swiper-sheet';
import WeightCompoundField from '@/components/common/forms/compound-fields/WeightCompoundField';
import NumericInput from '@/components/common/forms/NumericInput';
import Icon from '@/components/common/Icon';
import PropTypes from 'prop-types';
import SetBadge from '@/components/molecules/SetBadge';

const SetCard = ({ 
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

  // Create sets array from setConfigs and setData
  const sets = setConfigs.map((config, i) => {
    const fromParent = setData[i] || {};
    const setType = fromParent.set_type ?? config.set_type ?? 'reps';
    let status = fromParent.status ?? (i === 0 ? 'active' : 'locked');
    
    // Handle timed set status transitions
    if (setType === 'timed') {
      if (status === 'active') {
        status = 'ready-timed-set';
      } else if (status === 'counting-down') {
        status = 'counting-down-timed';
      }
    }
    
    return {
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? config.reps,
      weight: fromParent.weight ?? config.weight,
      unit: config.unit || 'lbs',
      status,
      set_type: setType,
      timed_set_duration: fromParent.timed_set_duration ?? config.timed_set_duration,
    };
  });

  // Update sets array if setConfigs changes
  React.useEffect(() => {
    if (onSetDataChange) {
      for (let i = 0; i < setConfigs.length; i++) {
        if (!setData[i]) {
          onSetDataChange(i + 1, 'reps', setConfigs[i].reps);
          onSetDataChange(i + 1, 'weight', setConfigs[i].weight);
        }
      }
    }
  }, [setConfigs]);

  const toggleFocusedView = () => {
    setFocusedView(!focused_view);
  };

  const handleSetComplete = (setId) => {
    if (onSetComplete) {
      const set = sets.find(s => s.id === setId);
      if (set) {
        const isTimedSet = set.set_type === 'timed';
        onSetComplete({
          setId,
          exerciseId,
          reps: set.reps,
          weight: set.weight,
          status: isTimedSet && set.status === 'ready-timed-set' ? 'counting-down' : 'complete',
        });
      }
    }
    if (onSetDataChange) {
      const set = sets.find(s => s.id === setId);
      if (set && set.set_type === 'timed' && set.status === 'ready-timed-set') {
        onSetDataChange(setId, 'status', 'counting-down');
      } else {
        onSetDataChange(setId, 'status', 'complete');
        const nextSet = sets.find(s => s.id === setId + 1);
        if (nextSet && nextSet.status === 'locked') {
          onSetDataChange(setId + 1, 'status', 'active');
        }
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
    <div className="p-4 bg-white relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-heading-md text-[#353942] m-0">{exerciseName}</h1>
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
          {sets.filter(Boolean).map((set, idx) => {
            const setConfig = setConfigs[idx] || {};
            const setType = setConfig.set_type || 'reps';
            const timedDuration = setConfig.timed_set_duration;
            return (
              <div key={set?.id ?? idx} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg">{set?.name}</span>
                  <div className="flex gap-4">
                    <SetBadge
                      reps={set?.reps}
                      weight={set?.weight}
                      unit={set?.unit}
                      complete={set?.status === 'complete'}
                      editable={true}
                      onEdit={() => handleMetricPillClick('reps', idx)}
                      set_type={setType}
                      timed_set_duration={timedDuration}
                    />
                  </div>
                </div>
                <SwipeSwitch
                  status={set?.status}
                  onComplete={() => handleSetComplete(set?.id)}
                  duration={setType === 'timed' ? timedDuration : undefined}
                />
              </div>
            );
          })}
        </div>
      ) : (
        <SwipeSwitch 
          status={activeSet?.status ?? 'locked'} 
          onComplete={handleCompleteAllSets} 
        />
      )}
      {/* SwiperSheet overlay for editing metric */}
      {editMetric && (
        <SwiperSheet
          open={!!editMetric}
          onOpenChange={(open) => !open && handleOverlayClose()}
          className="z-[100]"
          title={`Edit ${editMetric.metric}`.replace('sets', 'sets').replace('reps', 'reps').replace('weight', 'weight')}
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{`Edit ${editMetric.metric}`.replace('sets', 'sets').replace('reps', 'reps').replace('weight', 'weight')}</h3>
              <button onClick={handleMetricSubmit} style={{ background: 'none', border: 'none', padding: 0 }}>
                <Icon name="arrow_forward" size={32} />
              </button>
            </div>
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
          </div>
        </SwiperSheet>
      )}
    </div>
  );
};

SetCard.propTypes = {
  exerciseName: PropTypes.string,
  default_view: PropTypes.bool,
  setConfigs: PropTypes.arrayOf(PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.string
  })),
  onSetComplete: PropTypes.func,
  exerciseId: PropTypes.string.isRequired,
  setData: PropTypes.array,
  onSetDataChange: PropTypes.func
};

export default SetCard; 