import React, { useState, useRef, useEffect, useMemo } from 'react';
import SwipeSwitch from 'components/workout/SwipeSwitch';
import MetricPill from 'components/common/CardsAndTiles/MetricPill';
import SetPill from 'components/common/CardsAndTiles/SetPill';
import SlideUpForm from 'components/common/forms/SlideUpForm';
import WeightCompoundField from 'components/common/forms/compound-fields/WeightCompoundField';
import NumericInput from 'components/common/forms/NumericInput';
import Icon from 'components/common/Icon';
import PropTypes from 'prop-types';
import { ArrowsPointingOutIcon } from '@heroicons/react/24/solid';
import ToggleGroup from 'components/common/forms/ToggleGroup';

const SetCard = ({ 
  exerciseName = 'Military press', 
  default_view = true, 
  setConfigs = [], 
  onSetComplete, 
  exerciseId, 
  setData = [], 
  onSetDataChange 
}) => {
  const [isExpanded, setIsExpanded] = useState(!default_view);
  const [editMetric, setEditMetric] = useState(null); // { metric: 'sets'|'reps'|'weight', setIdx: number|null }
  const [weightUnit, setWeightUnit] = useState(setConfigs[0]?.unit || 'lbs');
  const [editValue, setEditValue] = useState('');
  const [editingSetIdx, setEditingSetIdx] = useState(null);
  const [editForm, setEditForm] = useState({ reps: 0, weight: 0, unit: 'lbs' });

  // Create sets array from setConfigs and setData
  const sets = setConfigs.map((config, i) => {
    const fromParent = setData[i] || {};
    return {
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? config.reps,
      weight: fromParent.weight ?? config.weight,
      unit: fromParent.unit ?? (config.unit || 'lbs'),
      status: fromParent.status ?? (i === 0 ? 'active' : 'locked'), // Default first set to active, others locked
    };
  });

  // Update sets array if setConfigs changes (ensure parent knows about defaults if not set)
  React.useEffect(() => {
    if (onSetDataChange) {
      sets.forEach(set => {
        const parentSetData = setData.find(d => d.id === set.id);
        if (!parentSetData || parentSetData.reps === undefined || parentSetData.weight === undefined || parentSetData.status === undefined) {
          onSetDataChange(exerciseId, set.id, 'reps', set.reps);
          onSetDataChange(exerciseId, set.id, 'weight', set.weight);
          onSetDataChange(exerciseId, set.id, 'status', set.status);
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
    if (isExpanded) {
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
        onSetDataChange(exerciseId, activeSet.id, 'status', 'complete');
        const nextSet = sets.find(s => s.id === activeSet.id + 1);
        if (nextSet && nextSet.status === 'locked') {
          onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
        }
      }
    } else {
      // Compact view: complete ALL sets
      if (onSetDataChange) {
        sets.forEach(set => {
          if (set.status !== 'complete') {
            onSetDataChange(exerciseId, set.id, 'status', 'complete');
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
        onSetDataChange(exerciseId, 'sets', null, newCount);
      }
    } else if (editMetric.metric === 'reps' && editMetric.setIdx !== null) {
      onSetDataChange(exerciseId, sets[editMetric.setIdx].id, 'reps', editValue);
    } else if (editMetric.metric === 'weight' && editMetric.setIdx !== null) {
      onSetDataChange(exerciseId, sets[editMetric.setIdx].id, 'weight', editValue);
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

  const handlePillClick = (idx) => {
    const set = sets[idx];
    setEditForm({ reps: set.reps, weight: set.weight, unit: set.unit });
    setEditingSetIdx(idx);
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(f => ({ ...f, [field]: value }));
  };

  const handleEditFormSave = () => {
    if (editingSetIdx !== null && onSetDataChange) {
      const setId = sets[editingSetIdx].id;
      onSetDataChange(exerciseId, setId, 'reps', editForm.reps);
      onSetDataChange(exerciseId, setId, 'weight', editForm.weight);
      onSetDataChange(exerciseId, setId, 'unit', editForm.unit);
    }
    setEditingSetIdx(null);
  };

  // If expanded view is true, render the detailed view
  if (isExpanded) {
    return (
      <>
        <div data-layer="Property 1=Expanded" className="Property1Expanded self-stretch w-full rounded-xl inline-flex flex-col justify-start items-start gap-[1px] overflow-hidden">
          <div data-layer="LabelAndExpand" className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
            <div data-layer="Label" className="Label flex-1 inline-flex flex-col justify-start items-start">
              <div data-layer="WorkoutName" className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
              <div data-layer="SetNumber" className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
                {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)} 
              data-svg-wrapper data-layer="sort-ascending" className="SortAscending relative"
            >
              <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.5 4.5C4.10218 4.5 3.72064 4.65804 3.43934 4.93934C3.15804 5.22064 3 5.60218 3 6C3 6.39782 3.15804 6.77936 3.43934 7.06066C3.72064 7.34196 4.10218 7.5 4.5 7.5H21C21.3978 7.5 21.7794 7.34196 22.0607 7.06066C22.342 6.77936 22.5 6.39782 22.5 6C22.5 5.60218 22.342 5.22064 22.0607 4.93934C21.7794 4.65804 21.3978 4.5 21 4.5H4.5ZM4.5 10.5C4.10218 10.5 3.72064 10.658 3.43934 10.9393C3.15804 11.2206 3 11.6022 3 12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H15C15.3978 13.5 15.7794 13.342 16.0607 13.0607C16.342 12.7794 16.5 12.3978 16.5 12C16.5 11.6022 16.342 11.2206 16.0607 10.9393C15.7794 10.658 15.3978 10.5 15 10.5H4.5ZM4.5 16.5C4.10218 16.5 3.72064 16.658 3.43934 16.9393C3.15804 17.2206 3 17.6022 3 18C3 18.3978 3.15804 18.7794 3.43934 19.0607C3.72064 19.342 4.10218 19.5 4.5 19.5H10.5C10.8978 19.5 11.2794 19.342 11.5607 19.0607C11.842 18.7794 12 18.3978 12 18C12 17.6022 11.842 17.2206 11.5607 16.9393C11.2794 16.658 10.8978 16.5 10.5 16.5H4.5ZM22.5 12C22.5 11.6022 22.342 11.2206 22.0607 10.9393C21.7794 10.658 21.3978 10.5 21 10.5C20.6022 10.5 20.2206 10.658 19.9393 10.9393C19.658 11.2206 19.5 11.6022 19.5 12V20.379L17.5605 18.4395C17.2776 18.1663 16.8987 18.0151 16.5054 18.0185C16.1121 18.0219 15.7359 18.1797 15.4578 18.4578C15.1797 18.7359 15.0219 19.1121 15.0185 19.5054C15.0151 19.8987 15.1663 20.2776 15.4395 20.5605L19.9395 25.0605C20.2208 25.3417 20.6023 25.4997 21 25.4997C21.3977 25.4997 21.7792 25.3417 22.0605 25.0605L26.5605 20.5605C26.8337 20.2776 26.9849 19.8987 26.9815 19.5054C26.9781 19.1121 26.8203 18.7359 26.5422 18.4578C26.2641 18.1797 25.8879 18.0219 25.4946 18.0185C25.1013 18.0151 24.7224 18.1663 24.4395 18.4395L22.5 20.379V12Z" fill="var(--neutral-400, #A3A3A3)"/>
              </svg>
            </button>
          </div>
          <div data-layer="Frame 6" className="Frame6 self-stretch flex flex-col justify-start items-start gap-[1px]">
            {sets.map((set, idx) => (
              <div key={set.id} data-layer="sets log" data-property-1="Default" className="SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start gap-2">
                <div data-layer="SetRepsWeightWrapper" className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center">
                  <div data-layer="Set one" className="SetOne justify-center text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
                    {set.name}
                  </div>
                  <SetPill
                    reps={set.reps}
                    weight={set.weight}
                    unit={set.unit}
                    onClick={() => handlePillClick(idx)}
                    style={{ cursor: 'pointer' }}
                    complete={set.status === 'complete'}
                  />
                </div>
                <div data-layer="SwipeSwitch" data-property-1="Default" className="Swipeswitch self-stretch bg-neutral-300 rounded-sm flex flex-col justify-start items-start gap-1">
                  <SwipeSwitch 
                    status={set.status} 
                    onComplete={() => {
                      if (onSetComplete) {
                        onSetComplete({ setId: set.id, exerciseId, reps: set.reps, weight: set.weight, status: 'complete' });
                      }
                      if (onSetDataChange) {
                        onSetDataChange(exerciseId, set.id, 'status', 'complete');
                        const nextSet = sets.find(s => s.id === set.id + 1);
                        if (nextSet && nextSet.status === 'locked') {
                          onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <SlideUpForm
          isOpen={editingSetIdx !== null}
          formPrompt="Edit set"
          onOverlayClick={() => setEditingSetIdx(null)}
          onActionIconClick={handleEditFormSave}
          isReady={true}
        >
          <div className="Exampleform self-stretch rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start overflow-hidden">
            <NumericInput
              label="Reps"
              value={editForm.reps}
              onChange={v => handleEditFormChange('reps', v)}
              min={0}
              max={999}
              className="self-stretch"
            />
            <NumericInput
              label="Weight"
              value={editForm.weight !== undefined && editForm.unit !== 'body' ? editForm.weight : (editForm.unit === 'body' ? 'body' : 0) }
              onChange={v => handleEditFormChange('weight', v)}
              min={0}
              max={999}
              className="self-stretch"
              incrementing={editForm.unit !== 'body'}
            />
            <ToggleGroup
              options={[
                { label: 'lbs', value: 'lbs' },
                { label: 'kg', value: 'kg' },
                { label: 'body', value: 'body' },
              ]}
              value={editForm.unit}
              onChange={unit => handleEditFormChange('unit', unit)}
              className="self-stretch bg-white pt-0 pb-3 px-3 gap-3"
            />
          </div>
        </SlideUpForm>
      </>
    );
  }

  // Compact view
  return (
    <>
      <div className="Property1Compactactivesetcard self-stretch w-full p-3 bg-white rounded-xl inline-flex flex-col justify-start items-start gap-[16px]">
        <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
          <div className="Label flex-1 inline-flex flex-col justify-start items-start">
            <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
            <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
              {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsExpanded(true)} 
            data-svg-wrapper data-layer="sort-descending" className="SortDescending relative"
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 4.5C4.10218 4.5 3.72064 4.65804 3.43934 4.93934C3.15804 5.22064 3 5.60218 3 6C3 6.39782 3.15804 6.77936 3.43934 7.06066C3.72064 7.34196 4.10218 7.5 4.5 7.5H21C21.3978 7.5 21.7794 7.34196 22.0607 7.06066C22.342 6.77936 22.5 6.39782 22.5 6C22.5 5.60218 22.342 5.22064 22.0607 4.93934C21.7794 4.65804 21.3978 4.5 21 4.5H4.5ZM4.5 10.5C4.10218 10.5 3.72064 10.658 3.43934 10.9393C3.15804 11.2206 3 11.6022 3 12C3 12.3978 3.15804 12.7794 3.43934 13.0607C3.72064 13.342 4.10218 13.5 4.5 13.5H15C15.3978 13.5 15.7794 13.342 16.0607 13.0607C16.342 12.7794 16.5 12.3978 16.5 12C16.5 11.6022 16.342 11.2206 16.0607 10.9393C15.7794 10.658 15.3978 10.5 15 10.5H4.5ZM4.5 16.5C4.10218 16.5 3.72064 16.658 3.43934 16.9393C3.15804 17.2206 3 17.6022 3 18C3 18.3978 3.15804 18.7794 3.43934 19.0607C3.72064 19.342 4.10218 19.5 4.5 19.5H10.5C10.8978 19.5 11.2794 19.342 11.5607 19.0607C11.842 18.7794 12 18.3978 12 18C12 17.6022 11.842 17.2206 11.5607 16.9393C11.2794 16.658 10.8978 16.5 10.5 16.5H4.5ZM22.5 12C22.5 11.6022 22.342 11.2206 22.0607 10.9393C21.7794 10.658 21.3978 10.5 21 10.5C20.6022 10.5 20.2206 10.658 19.9393 10.9393C19.658 11.2206 19.5 11.6022 19.5 12V20.379L17.5605 18.4395C17.2776 18.1663 16.8987 18.0151 16.5054 18.0185C16.1121 18.0219 15.7359 18.1797 15.4578 18.4578C15.1797 18.7359 15.0219 19.1121 15.0185 19.5054C15.0151 19.8987 15.1663 20.2776 15.4395 20.5605L19.9395 25.0605C20.2208 25.3417 20.6023 25.4997 21 25.4997C21.3977 25.4997 21.7792 25.3417 22.0605 25.0605L26.5605 20.5605C26.8337 20.2776 26.9849 19.8987 26.9815 19.5054C26.9781 19.1121 26.8203 18.7359 26.5422 18.4578C26.2641 18.1797 25.8879 18.0219 25.4946 18.0185C25.1013 18.0151 24.7224 18.1663 24.4395 18.4395L22.5 20.379V12Z" fill="var(--neutral-400, #A3A3A3)"/>
            </svg>
          </button>
        </div>
        <div className="SwipeStates self-stretch">
          <SwipeSwitch status={swipeStatus} onComplete={handleActiveSetComplete} />
        </div>
        <div className="Setpillwrapper self-stretch flex flex-wrap items-start gap-3 content-start">
          {sets.map((set, idx) => (
            <SetPill
              key={set.id}
              reps={set.reps}
              weight={set.weight}
              unit={set.unit}
              onClick={() => handlePillClick(idx)}
              style={{ cursor: 'pointer' }}
              complete={allComplete || set.status === 'complete'}
            />
          ))}
        </div>
      </div>
      <SlideUpForm
        isOpen={editingSetIdx !== null}
        formPrompt="Edit set"
        onOverlayClick={() => setEditingSetIdx(null)}
        onActionIconClick={handleEditFormSave}
        isReady={true}
      >
        <div className="Exampleform self-stretch rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 flex flex-col justify-start items-start overflow-hidden">
          <NumericInput
            label="Reps"
            value={editForm.reps}
            onChange={v => handleEditFormChange('reps', v)}
            min={0}
            max={999}
            className="self-stretch"
          />
          <NumericInput
            label="Weight"
            value={editForm.weight !== undefined && editForm.unit !== 'body' ? editForm.weight : (editForm.unit === 'body' ? 'body' : 0) }
            onChange={v => handleEditFormChange('weight', v)}
            min={0}
            max={999}
            className="self-stretch"
            incrementing={editForm.unit !== 'body'}
          />
          <ToggleGroup
            options={[
              { label: 'lbs', value: 'lbs' },
              { label: 'kg', value: 'kg' },
              { label: 'body', value: 'body' },
            ]}
            value={editForm.unit}
            onChange={unit => handleEditFormChange('unit', unit)}
            className="self-stretch bg-white pt-0 pb-3 px-3 gap-3"
          />
        </div>
      </SlideUpForm>
    </>
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
  exerciseId: PropTypes.string.isRequired, // Now required
  setData: PropTypes.array,
  onSetDataChange: PropTypes.func
};

export default SetCard; 