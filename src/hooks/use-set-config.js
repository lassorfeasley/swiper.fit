import { useState, useEffect } from 'react';

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
  const [sets, setSets] = useState(Array.from({ length: initialCount }, (_, index) => ({
    set_variant: `Set ${index + 1}`
  })));

  // --- updater helpers ----------------------------------------------------
  const updateDefault = (field, value) => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const updateSetField = (index, field, value) => {
    setSets((prev) => {
      const next = [...prev];
      // Ensure the array is large enough
      while (next.length <= index) {
        next.push({});
      }
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
  const addSet = () => {
    setSets((prev) => {
      if (prev.length === 0) {
        // If no sets exist, use defaults
        return [{}];
      }
      
      // Get the last set's configuration (merged with defaults)
      const lastSetConfig = getSetMerged(prev.length - 1);
      
      // Find the next available set number by looking at existing set_variant names
      let nextSetNumber = 1;
      for (const set of prev) {
        if (set.set_variant && set.set_variant.startsWith('Set ')) {
          const setNumber = parseInt(set.set_variant.replace('Set ', ''), 10);
          if (!isNaN(setNumber) && setNumber >= nextSetNumber) {
            nextSetNumber = setNumber + 1;
          }
        }
      }
      
      // Create a new set with the same configuration as the last set
      // but remove any database-specific fields and use proper naming
      const newSetConfig = {
        set_type: lastSetConfig.set_type,
        reps: lastSetConfig.reps,
        timed_set_duration: lastSetConfig.timed_set_duration,
        weight: lastSetConfig.weight,
        unit: lastSetConfig.unit,
        weight_unit: lastSetConfig.weight_unit,
        set_variant: `Set ${nextSetNumber}`, // Use the next available set number
      };
      
      return [...prev, newSetConfig];
    });
  };
  
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