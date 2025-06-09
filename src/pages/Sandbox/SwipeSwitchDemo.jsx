import React, { useState } from 'react';
import SwipeSwitch from '@/components/common/forms/SwipeSwitch';

export default function SwipeSwitchDemo() {
  const [status, setStatus] = useState('locked');
  const [log, setLog] = useState([]);

  const handleComplete = () => {
    setLog(l => [...l, `onComplete called at ${new Date().toLocaleTimeString()}`]);
    setStatus('complete');
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 24, background: '#f9fafb', borderRadius: 12 }}>
      <h2>SwipeSwitch Demo</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Status: </label>
        <select value={status} onChange={e => setStatus(e.target.value)}>
          <option value="locked">locked</option>
          <option value="active">active</option>
          <option value="complete">complete</option>
        </select>
        <button style={{ marginLeft: 8 }} onClick={() => setStatus('active')}>Reset to active</button>
      </div>
      <SwipeSwitch status={status} onComplete={handleComplete} />
      <div style={{ marginTop: 24 }}>
        <h4>onComplete Log:</h4>
        <ul style={{ fontSize: 12, color: '#555' }}>
          {log.map((entry, i) => <li key={i}>{entry}</li>)}
        </ul>
      </div>
    </div>
  );
} 