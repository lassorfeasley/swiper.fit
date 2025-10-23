import { useState, useEffect } from 'react';

interface SetDefaults {
  set_type: 'reps' | 'timed';
  reps: number;
  timed_set_duration: number;
  weight: number;
  unit: 'lbs' | 'kg' | 'body';
}

interface SetOverrides {
  set_variant?: string;
  set_type?: 'reps' | 'timed';
  reps?: number;
  timed_set_duration?: number;
  weight?: number;
  unit?: 'lbs' | 'kg' | 'body';
  weight_unit?: string;
}

interface SetConfigReturn {
  defaults: SetDefaults;
  sets: SetOverrides[];
  updateDefault: (field: keyof SetDefaults, value: any) => void;
  updateSetField: (index: number, field: keyof SetOverrides, value: any) => void;
  setName: (index: number, name: string) => void;
  getSetMerged: (index: number) => SetDefaults & SetOverrides;
  addSet: () => void;
  removeLastSet: () => void;
}

const defaultValues: SetDefaults = {
  set_type: 'reps',
  reps: 10,
  timed_set_duration: 30,
  weight: 25,
  unit: 'lbs',
};

// Hook to manage a collection of sets with global defaults and per-set overrides.
// All property keys use snake_case so that objects can be persisted directly to Supabase rows.
export default function useSetConfig(
  initialCount: number = 3, 
  initialDefaults: SetDefaults = defaultValues
): SetConfigReturn {
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
  const [defaults, setDefaults] = useState<SetDefaults>(initialDefaults || defaultValues);
  const [sets, setSets] = useState<SetOverrides[]>(Array.from({ length: initialCount }, (_, index) => ({
    set_variant: `Set ${index + 1}`
  })));

  // --- updater helpers ----------------------------------------------------
  const updateDefault = (field: keyof SetDefaults, value: any): void => {
    setDefaults((prev) => ({ ...prev, [field]: value }));
  };

  const updateSetField = (index: number, field: keyof SetOverrides, value: any): void => {
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
  const getSetMerged = (index: number): SetDefaults & SetOverrides => {
    const overrides = sets[index] || {};
    return { ...defaults, ...overrides };
  };

  const setName = (index: number, name: string): void => updateSetField(index, 'set_variant', name);

  // array helpers ----------------------------------------------------------
  const addSet = (): void => {
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
      const newSetConfig: SetOverrides = {
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
  
  const removeLastSet = (): void =>
    setSets((prev) => {
      // Keep at least one set in the collection
      if (prev.length <= 1) {
        return prev;
      }
      return prev.slice(0, -1);
    });

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
