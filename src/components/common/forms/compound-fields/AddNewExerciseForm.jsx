import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import NumericInput from "@/components/ui/numeric-input";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

const AddNewExerciseForm = ({
  onActionIconClick,
  onDelete,
  formPrompt = "Create a new exercise",
  initialName = '',
  initialSets = 3,
  initialSetConfigs = [],
}) => {
  // All state is local to this form
  const [exerciseName, setExerciseName] = useState(initialName || '');
  const [sets, setSets] = useState(initialSets || 3);
  const [setConfigs, setSetConfigs] = useState(
    Array.from({ length: initialSets || 3 }, (_, i) =>
      initialSetConfigs[i] || { reps: 10, weight: 0, unit: 'kg' }
    )
  );
  const [openSet, setOpenSet] = useState('0');

  // When sets changes, update setConfigs locally
  useEffect(() => {
    setSetConfigs(prev => {
      const arr = Array.from({ length: sets }, (_, i) => prev[i] || { reps: 10, weight: 0, unit: 'kg' });
      return arr;
    });
  }, [sets]);

  const handleSetConfigChange = (idx, field, value) => {
    setSetConfigs(prev => prev.map((cfg, i) => i === idx ? { ...cfg, [field]: value } : cfg));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) {
      alert('Exercise name is required.');
      return;
    }
    if (sets < 1) {
      alert('At least one set is required.');
      return;
    }
    if (typeof onActionIconClick === 'function') {
      onActionIconClick({
        name: exerciseName,
        setConfigs,
        sets,
      });
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSave}>
      <div className="flex flex-col gap-2">
        <label className="font-medium">Exercise name</label>
        <Input
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
          placeholder="Enter exercise name"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="font-medium">Sets</label>
        <NumericInput
          label="Number of sets"
          value={sets}
          onChange={setSets}
          min={1}
          max={10}
        />
      </div>
      <Accordion type="single" collapsible value={openSet} onValueChange={setOpenSet} className="w-full">
        {setConfigs.map((cfg, idx) => (
          <AccordionItem key={idx} value={String(idx)}>
            <AccordionTrigger>{`Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][idx] || idx+1}`}</AccordionTrigger>
            <AccordionContent>
              <div className="flex flex-col gap-4 p-2">
                <NumericInput
                  label="Reps"
                  value={cfg.reps}
                  onChange={val => handleSetConfigChange(idx, 'reps', val)}
                  min={1}
                  max={100}
                />
                <Separator className="my-2" />
                <NumericInput
                  label="Weight"
                  value={cfg.weight}
                  onChange={val => handleSetConfigChange(idx, 'weight', val)}
                  min={0}
                  max={1000}
                  allowTwoDecimals={true}
                />
                <ToggleGroup
                  type="single"
                  value={cfg.unit}
                  onValueChange={val => handleSetConfigChange(idx, 'unit', val)}
                  className="w-full flex rounded-lg overflow-hidden border border-gray-200"
                  variant="outline"
                >
                  {unitOptions.map(opt => (
                    <ToggleGroupItem key={opt.value} value={opt.value} className="flex-1 text-sm font-medium py-2 rounded-none border-0 focus:z-10 data-[state=on]:bg-gray-100 data-[state=on]:shadow-none data-[state=on]:text-black">
                      {opt.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex flex-col gap-2 mt-4">
        <Button type="submit" className="w-full">
          Save
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive" className="w-full" onClick={onDelete}>
            Delete Exercise
          </Button>
        )}
      </div>
    </form>
  );
};

AddNewExerciseForm.propTypes = {
  onActionIconClick: PropTypes.func,
  onDelete: PropTypes.func,
  formPrompt: PropTypes.string,
  initialName: PropTypes.string,
  initialSets: PropTypes.number,
  initialSetConfigs: PropTypes.array,
};

export default AddNewExerciseForm; 