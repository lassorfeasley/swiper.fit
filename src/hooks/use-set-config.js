import { useState } from 'react';

const defaultValues = {
  setType: 'reps',
  reps: 12,
  timedDuration: 30,
  weight: 25,
  unit: 'lbs',
};

export default function useSetConfig(initialCount = 3, initialDefaults = defaultValues) {
  const [defaults, setDefaults] = useState(initialDefaults);
  // each set stores only overridden fields { name?, setType?, reps?, timedDuration?, weight?, unit? }
  const [sets, setSets] = useState(Array.from({ length: initialCount }, () => ({ name: '' })));

  const updateDefault = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const updateSetField = (index, field, value) => {
    setSets((prev) => {
      const arr = [...prev];
      arr[index] = { ...arr[index], [field]: value };
      return arr;
    });
  };

  const getSetMerged = (index) => {
    const overrides = sets[index] || {};
    return { ...defaults, ...overrides };
  };

  const setName = (index, name) => updateSetField(index, 'name', name);

  const addSet = () => setSets((prev) => [...prev, {}]);
  const removeLastSet = () => setSets((prev) => prev.slice(0, -1));

  return {
    defaults,
    sets,
    updateDefault,
    updateSetField,
    setName,
    getSetMerged,
    addSet,
    removeLastSet,
  };
} 