import { useState } from 'react';

const defaultValues = {
  set_type: 'reps',
  reps: 10,
  timed_set_duration: 30,
  weight: 25,
  unit: 'lbs',
};

// Hook to manage a collection of sets with global defaults and per-set overrides.
// All property keys use snake_case so that objects can be persisted directly to Supabase rows.
export default function useSetConfig(initialCount = 3, initialDefaults = defaultValues) {
  /*
   defaults – global defaults that newly created sets inherit.  Shape:
     {
       set_type: 'reps' | 'timed',
       reps: number,
       timed_set_duration: number,
       weight: number,
       unit: 'lbs' | 'kg' | 'body'
     }

   sets – array where each element stores ONLY fields that deviate from `defaults`.  Example:
     { set_variant: 'Warm-up', reps: 8 } // unit & weight come from defaults
   */
  const [defaults, setDefaults] = useState(initialDefaults || defaultValues);
  const [sets, setSets] = useState(Array.from({ length: initialCount }, () => ({})));

  // --- updater helpers ----------------------------------------------------
  const updateDefault = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const updateSetField = (index, field, value) => {
    setSets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // merge helpers ----------------------------------------------------------
  const getSetMerged = (index) => {
    const overrides = sets[index] || {};
    return { ...defaults, ...overrides };
  };

  const setName = (index, name) => updateSetField(index, 'set_variant', name);

  // array helpers ----------------------------------------------------------
  const addSet = () => setSets((prev) => [...prev, {}]);
  const removeLastSet = () =>
    setSets((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev));

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