import React, { useState, useRef, useEffect, useMemo } from 'react';
import SwipeSwitch from 'components/workout/SwipeSwitch';
import MetricPill from 'components/common/CardsAndTiles/MetricPill';
import SlideUpForm from 'components/common/forms/SlideUpForm';
import WeightCompoundField from 'components/common/forms/compound-fields/WeightCompoundField';
import NumericInput from 'components/common/forms/NumericInput';
import Icon from 'components/common/Icon';
import PropTypes from 'prop-types';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';

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
    return {
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? config.reps,
      weight: fromParent.weight ?? config.weight,
      unit: config.unit || 'lbs',
      status: fromParent.status ?? (i === 0 ? 'active' : 'locked'), // Default first set to active, others locked
    };
  });

  // Update sets array if setConfigs changes (ensure parent knows about defaults if not set)
  React.useEffect(() => {
    if (onSetDataChange) {
      sets.forEach(set => {
        const parentSetData = setData.find(d => d.id === set.id);
        if (!parentSetData || parentSetData.reps === undefined || parentSetData.weight === undefined || parentSetData.status === undefined) {
          onSetDataChange(set.id, 'reps', set.reps);
          onSetDataChange(set.id, 'weight', set.weight);
          onSetDataChange(set.id, 'status', set.status);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(setConfigs)]); // Deep compare setConfigs to re-run if its content changes

  // New logic for swipeStatus in compact view
  const allComplete = sets.every(set => set.status === 'complete');
  const anyActive = sets.some(set => set.status === 'active');
  const activeSet = useMemo(
    () => sets.find(set => set.status === 'active') || (sets.length > 0 ? sets[0] : undefined),
    [JSON.stringify(sets)]
  );
  const swipeStatus = allComplete
    ? 'complete'
    : anyActive
      ? 'active'
      : 'locked';

  // Handler for completing the CURRENTLY ACTIVE set
  const handleActiveSetComplete = () => {
    if (focused_view) {
      // Expanded view: complete only the active set and unlock the next
      if (!activeSet) return;
      if (onSetComplete) {
        onSetComplete({
          setId: activeSet.id,
          exerciseId,
          reps: activeSet.reps,
          weight: activeSet.weight,
          status: 'complete',
        });
      }
      if (onSetDataChange) {
        onSetDataChange(activeSet.id, 'status', 'complete');
        const nextSet = sets.find(s => s.id === activeSet.id + 1);
        if (nextSet && nextSet.status === 'locked') {
          onSetDataChange(nextSet.id, 'status', 'active');
        }
      }
    } else {
      // Compact view: complete ALL sets
      if (onSetDataChange) {
        sets.forEach(set => {
          if (set.status !== 'complete') {
            onSetDataChange(set.id, 'status', 'complete');
          }
        });
      }
      if (onSetComplete) {
        sets.forEach(set => {
          if (set.status !== 'complete') {
            onSetComplete({
              setId: set.id,
              exerciseId,
              reps: set.reps,
              weight: set.weight,
              status: 'complete',
            });
          }
        });
      }
    }
  };

  // Overlay/modal logic (remains the same)
  const handleMetricPillClick = (metric, setIdx = null) => {
    let value = '';
    if (metric === 'sets') value = setConfigs.length;
    else if (metric === 'reps' && setIdx !== null && sets[setIdx]) value = sets[setIdx].reps;
    else if (metric === 'weight' && setIdx !== null && sets[setIdx]) value = sets[setIdx].weight;
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
      if (onSetDataChange) {
        const newCount = Number(editValue) || 1;
        onSetDataChange('sets', newCount);
      }
    } else if (editMetric.metric === 'reps' && editMetric.setIdx !== null) {
      onSetDataChange(editMetric.setIdx + 1, 'reps', editValue);
    } else if (editMetric.metric === 'weight' && editMetric.setIdx !== null) {
      onSetDataChange(editMetric.setIdx + 1, 'weight', editValue);
    }
    setEditMetric(null);
  };

  const inputRef = useRef(null);
  useEffect(() => {
    if (editMetric && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select && inputRef.current.select();
    }
  }, [editMetric]);

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

  // If focused_view is true, render the detailed view with individual swipes for each set
  if (focused_view) {
    return (
      <div className="p-4 bg-white rounded-lg relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-h1 font-h1 leading-h1 font-space text-[#353942] m-0">{exerciseName}</h1>
          <button type="button" onClick={() => setFocusedView(false)} className="text-xl">
            <Icon name="close_fullscreen" size={24} /> {/* Using Icon component for Material Symbols */}
          </button>
        </div>
        <div className="space-y-4">
          {sets.map((set, idx) => (
            <div key={set.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg">{set.name}</span>
                <div className="flex gap-4">
                  <MetricPill value={set.reps} unit="REPS" onClick={() => handleMetricPillClick('reps', idx)} />
                  <MetricPill value={set.weight} unit={set.unit.toUpperCase()} onClick={() => handleMetricPillClick('weight', idx)} />
                </div>
              </div>
              <SwipeSwitch 
                status={set.status} 
                onComplete={() => {
                  if (onSetComplete) {
                    onSetComplete({ setId: set.id, exerciseId, reps: set.reps, weight: set.weight, status: 'complete' });
                  }
                  if (onSetDataChange) {
                    onSetDataChange(set.id, 'status', 'complete');
                    const nextSet = sets.find(s => s.id === set.id + 1);
                    if (nextSet && nextSet.status === 'locked') {
                      onSetDataChange(nextSet.id, 'status', 'active');
                    }
                  }
                }} 
              />
            </div>
          ))}
        </div>
        {/* SlideUpForm for editing remains the same */}
      </div>
    );
  }

  // Default compact view (what was previously the main return)
  return (
    <div className="Property1Compactactivesetcard self-stretch w-full p-3 bg-white rounded-xl inline-flex flex-col justify-start items-start gap-4">
      <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">{setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}</div>
        </div>
        <button type="button" onClick={() => setFocusedView(true)} className="ArrowsExpand size-8 relative overflow-hidden flex items-center justify-center">
          <ArrowsPointingOutIcon className="size-6 absolute left-[4.8px] top-[4.8px] text-slate-500" />
        </button>
      </div>
      <div className="SwipeStates self-stretch">
        {/* Pass the determined swipeStatus of the current active set */}
        <SwipeSwitch status={swipeStatus} onComplete={handleActiveSetComplete} />
      </div>
      <div className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-3 flex-wrap content-center overflow-hidden">
        {setConfigs.map((pill, idx) => (
          <div key={idx} className="Setpill w-16 px-1 py-0.5 bg-grey-200 rounded-sm flex justify-start items-center">
            <div className="Repsxweight text-center justify-center text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
              {pill.reps}&times;{pill.weight} {pill.unit}
            </div>
          </div>
        ))}
      </div>
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
  exerciseId: PropTypes.string, // Made optional as it might not always be needed for compact view logic if not completing
  setData: PropTypes.array,
  onSetDataChange: PropTypes.func
};

export default SetCard; 