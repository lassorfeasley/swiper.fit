import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import NumericInput from "@/components/molecules/numeric-input";
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
              <div className="flex flex-col gap-4 py-2">
                <NumericInput
                  label="Reps"
                  value={cfg.reps}
                  onChange={v => handleSetConfigChange(idx, 'reps', v)}
                  min={0}
                  max={999}
                  className="w-full"
                />
                <NumericInput
                  label="Weight"
                  value={cfg.weight !== undefined && cfg.unit !== 'body' ? cfg.weight : (cfg.unit === 'body' ? 'body' : 0)}
                  onChange={v => handleSetConfigChange(idx, 'weight', v)}
                  min={0}
                  max={999}
                  className="w-full"
                  incrementing={cfg.unit !== 'body'}
                />
                <ToggleGroup
                  type="single"
                  value={cfg.unit}
                  onValueChange={unit => unit && handleSetConfigChange(idx, 'unit', unit)}
                  className="w-full bg-white pt-0 pb-3 px-3 gap-3"
                >
                  <ToggleGroupItem value="lbs">lbs</ToggleGroupItem>
                  <ToggleGroupItem value="kg">kg</ToggleGroupItem>
                  <ToggleGroupItem value="body">body</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {formPrompt}
        </Button>
        {onDelete && (
          <Button type="button" variant="destructive" onClick={onDelete}>
            Delete
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
  initialSetConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
    })
  ),
};

export default AddNewExerciseForm; 