import React, { useState } from 'react';

const NumericInputWithUnit = ({ initialNumber = 0, unit = 'Reps' }) => {
  const [number, setNumber] = useState(initialNumber);

  const handleChange = (e) => {
    const value = e.target.value;
    if (!isNaN(value)) {
      setNumber(value);
    }
  };

  return (
    <div className="flex items-center justify-center p-1 bg-white rounded" style={{ width: 'fit-content', backgroundColor: 'white', padding: '4px', borderRadius: '4px' }}>
      <input
        type="text"
        value={number}
        onChange={handleChange}
        className="text-metric font-metric leading-metric text-center text-heading-black"
        style={{ backgroundColor: 'transparent', border: 'none', width: '50px' }}
        maxLength={3}
      />
      <span className="ml-2" style={{ fontSize: '8px', width: '50px', lineHeight: '16px' }}>{unit}</span>
    </div>
  );
};

export default NumericInputWithUnit; 