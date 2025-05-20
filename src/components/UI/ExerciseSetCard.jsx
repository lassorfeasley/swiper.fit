import React, { useState } from 'react';
import SwipeSwitch from './SwipeSwitch';
import NumericInputWithUnit from './NumericInputWithUnit';

const ExerciseSetCard = ({ exerciseName = 'Military press', collapsed = false, defaultSets = 3, defaultReps = 12, defaultWeight = 45 }) => {
  const [expanded, setExpanded] = useState(!collapsed);
  const [setCount, setSetCount] = useState(defaultSets);
  const [sets, setSets] = useState(
    Array.from({ length: defaultSets }, (_, i) => ({
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: defaultReps,
      weight: defaultWeight,
      status: i === 0 ? 'active' : 'locked'
    }))
  );

  // Update sets array if setCount changes
  React.useEffect(() => {
    setSets(currentSets => {
      let newSets = [...currentSets];
      if (setCount > currentSets.length) {
        // Add new sets
        for (let i = currentSets.length + 1; i <= setCount; i++) {
          newSets.push({
            id: i,
            name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i-1] || i}`,
            reps: 12,
            weight: 45,
            status: 'locked'
          });
        }
      } else if (setCount < currentSets.length) {
        // Remove sets
        newSets = newSets.slice(0, setCount);
      }
      // Always keep at least one active set
      if (!newSets.some(s => s.status === 'active')) {
        const firstLocked = newSets.find(s => s.status === 'locked');
        if (firstLocked) firstLocked.status = 'active';
      }
      return newSets;
    });
  }, [setCount]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const handleSetComplete = (setId) => {
    setSets(currentSets => {
      return currentSets.map(set => {
        if (set.id === setId) {
          return { ...set, status: 'complete' };
        }
        if (set.status === 'locked') {
          const completedSetIndex = currentSets.findIndex(s => s.id === setId);
          const currentSetIndex = currentSets.findIndex(s => s.id === set.id);
          if (currentSetIndex > completedSetIndex && 
              currentSets.filter(s => s.status === 'locked' && currentSets.indexOf(s) < currentSetIndex).length === 0) {
            return { ...set, status: 'active' };
          }
        }
        return set;
      });
    });
  };

  const updateSetValue = (setId, field, value) => {
    setSets(currentSets => 
      currentSets.map(set => 
        set.id === setId ? { ...set, [field]: value } : set
      )
    );
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

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{exerciseName}</h2>
        <button className="text-xl" onClick={toggleExpanded}>
          <i className="material-icons">
            {expanded ? 'close_fullscreen' : 'open_in_full'}
          </i>
        </button>
      </div>
      <div className="mb-4 flex gap-4 items-center">
        <NumericInputWithUnit
          initialNumber={setCount}
          unit="Sets"
          onChange={val => setSetCount(Number(val) || 1)}
        />
        {!expanded && (
          <>
            <NumericInputWithUnit initialNumber={activeSet.reps} unit="Reps" />
            <NumericInputWithUnit initialNumber={activeSet.weight} unit="Lbs" />
          </>
        )}
      </div>
      {expanded ? (
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
          onComplete={() => handleSetComplete(activeSet.id)} 
        />
      )}
    </div>
  );
};

export default ExerciseSetCard; 