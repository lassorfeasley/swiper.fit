import React, { useState } from 'react';
import SwipeSwitch from './SwipeSwitch';
import NumericInputWithUnit from './NumericInputWithUnit';

const SetCard = ({ exerciseName = 'Military press', default_view = true, defaultSets = 3, defaultReps = 12, defaultWeight = 45, onSetComplete, exerciseId, setData = [], onSetDataChange }) => {
  const [focused_view, setFocusedView] = useState(!default_view);
  const [setCount, setSetCount] = useState(defaultSets);
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

  const ActionButtons = () => (
    <div className="flex w-full mt-4 gap-4">
      <button className="flex-1 py-4 bg-white rounded-lg text-black font-bold">
        Skip
      </button>
      <button className="flex-1 py-4 bg-white rounded-lg text-black font-bold">
        Log
      </button>
    </div>
  );

  // Add this new function for default view swipe
  const handleCompleteAllSets = () => {
    // Implementation of handleCompleteAllSets
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{exerciseName}</h2>
        <button className="text-xl" onClick={toggleFocusedView}>
          <i className="material-icons">
            {focused_view ? 'close_fullscreen' : 'open_in_full'}
          </i>
        </button>
      </div>
      <div className="mb-4 flex gap-4 items-center">
        <NumericInputWithUnit
          initialNumber={setCount}
          unit="Sets"
          onChange={val => setSetCount(Number(val) || 1)}
        />
        {!focused_view && (
          <>
            <NumericInputWithUnit initialNumber={activeSet.reps} unit="Reps" />
            <NumericInputWithUnit initialNumber={activeSet.weight} unit="Lbs" />
          </>
        )}
      </div>
      {focused_view ? (
        <div className="space-y-4">
          {sets.map(set => (
            <div key={set.id} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg">{set.name}</span>
                <div className="flex gap-4">
                  <NumericInputWithUnit 
                    initialNumber={set.reps} 
                    unit="Reps"
                    onChange={(value) => updateSetValue(set.id, 'reps', value)} 
                  />
                  <NumericInputWithUnit 
                    initialNumber={set.weight} 
                    unit="Lbs"
                    onChange={(value) => updateSetValue(set.id, 'weight', value)}
                  />
                </div>
              </div>
              <SwipeSwitch 
                status={set.status} 
                onComplete={() => handleSetComplete(set.id)} 
              />
            </div>
          ))}
          <ActionButtons />
        </div>
      ) : (
        <SwipeSwitch 
          status={activeSet.status} 
          onComplete={handleCompleteAllSets} 
        />
      )}
    </div>
  );
};

export default SetCard; 