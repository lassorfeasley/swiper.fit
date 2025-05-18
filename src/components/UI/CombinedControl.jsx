import React, { useState } from 'react';
import SwipeSwitch from './SwipeSwitch';
import NumericInputWithUnit from './NumericInputWithUnit';

const CombinedControl = () => {
  const [switchStatus, setSwitchStatus] = useState('active');

  const handleComplete = () => {
    setSwitchStatus('complete');
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Military press</h2>
        <button className="text-xl">↗</button>
      </div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-lg">Three sets</span>
        <div className="flex gap-4">
          <NumericInputWithUnit initialNumber={12} unit="Reps" />
          <NumericInputWithUnit initialNumber={45} unit="Lbs" />
        </div>
      </div>
      <SwipeSwitch status={switchStatus} onComplete={handleComplete} />
    </div>
  );
};

export default CombinedControl; 