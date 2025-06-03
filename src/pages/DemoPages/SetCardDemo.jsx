import React, { useState } from 'react';
import SetCard from 'components/common/CardsAndTiles/Cards/Library/SetCard';
import SetPill from 'components/common/CardsAndTiles/SetPill';

const initialSetConfigs = [
  { reps: 10, weight: 25, unit: 'lbs' },
  { reps: 8, weight: 30, unit: 'lbs' },
  { reps: 6, weight: 35, unit: 'lbs' },
];

const initialSetData = [
  { id: 1, reps: 10, weight: 25, status: 'active' },
  { id: 2, reps: 8, weight: 30, status: 'locked' },
  { id: 3, reps: 6, weight: 35, status: 'locked' },
];

export default function SetCardDemo() {
  const [setData, setSetData] = useState(initialSetData);
  const [log, setLog] = useState([]);
  const [compact, setCompact] = useState(true);

  const handleSetDataChange = (id, field, value) => {
    setSetData(prev =>
      prev.map(set =>
        set.id === id ? { ...set, [field]: value } : set
      )
    );
  };

  const handleSetComplete = (info) => {
    setLog(l => [...l, `Set ${info.setId} completed at ${new Date().toLocaleTimeString()}`]);
  };

  const handleReset = () => {
    setSetData(initialSetData);
    setLog([]);
  };

  return (
    <div className="bg-slate-200" style={{ maxWidth: 500, margin: '2rem auto', padding: 24, borderRadius: 12 }}>
      <h2>SetCard Demo</h2>
      <div style={{ marginBottom: 16 }}>
        <label>
          <input type="checkbox" checked={compact} onChange={e => setCompact(e.target.checked)} />
          Compact view
        </label>
        <button style={{ marginLeft: 8 }} onClick={handleReset}>Reset</button>
      </div>

      {/* Original SetCard */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4">SetCard Component</h3>
        <SetCard
          exerciseName="Demo Exercise"
          default_view={!compact}
          setConfigs={initialSetConfigs}
          setData={setData}
          onSetDataChange={handleSetDataChange}
          onSetComplete={handleSetComplete}
        />
      </div>

      {/* New SetPill Examples */}
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">SetPill Examples</h3>
        <div className="flex flex-wrap gap-2">
          {/* Regular weight examples */}
          <SetPill reps={12} weight={45} unit="lbs" />
          <SetPill reps={10} weight={20} unit="kg" />
          {/* Bodyweight example */}
          <SetPill reps={15} unit="body" />
          {/* Examples from initialSetConfigs */}
          {initialSetConfigs.map((config, i) => (
            <SetPill
              key={i}
              reps={config.reps}
              weight={config.weight}
              unit={config.unit}
            />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4>Completion Log:</h4>
        <ul style={{ fontSize: 12, color: '#555' }}>
          {log.map((entry, i) => <li key={i}>{entry}</li>)}
        </ul>
      </div>
    </div>
  );
} 