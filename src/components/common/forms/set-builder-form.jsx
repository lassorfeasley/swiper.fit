import React from 'react';
import ToggleInput from '@/components/molecules/toggle-input';
import NumericInput from '@/components/molecules/numeric-input';

const setTypeOptions = [
  { label: 'Reps', value: 'reps' },
  { label: 'Timed', value: 'timed' },
];
const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

export default function SetBuilderForm({
  setType,
  onSetTypeChange,
  reps,
  timed_set_duration,
  onRepsChange,
  onTimedDurationChange,
  weight,
  unit,
  onWeightChange,
  onUnitChange,
}) {
  return (
    <div className="Frame7 w-full self-stretch flex flex-col justify-start items-start gap-3">
      <div className="Frame14 w-full self-stretch flex flex-col justify-start items-start gap-4">
        <div className="Togglegroup w-full self-stretch flex flex-col justify-start items-center gap-1">
          <div className="FieldLabel w-full self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Set type</div>
          <ToggleInput
            options={setTypeOptions}
            value={setType}
            onChange={onSetTypeChange}
            className="Frame4 w-full self-stretch rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden"
          />
        </div>
        <div className="NumericField w-full self-stretch flex flex-col justify-start items-start gap-1">
          <NumericInput
            value={setType === 'reps' ? reps : timed_set_duration}
            onChange={setType === 'reps' ? onRepsChange : onTimedDurationChange}
            min={0}
            max={999}
            className="Incrimentermetricwrapper w-full self-stretch h-12 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1"
            unitLabel={setType === 'reps' ? 'reps' : 'seconds'}
          />
        </div>
        <div className="Divider w-full self-stretch flex flex-col justify-start items-start">
          <div className="Divider w-full self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-stone-200"></div>
        </div>
        <div className="Togglegroup w-full self-stretch flex flex-col justify-start items-center gap-1">
          <div className="FieldLabel w-full self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight unit</div>
          <ToggleInput
            options={unitOptions}
            value={unit}
            onChange={onUnitChange}
            className="Frame4 w-full self-stretch rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden"
          />
        </div>
        <div className="NumericField w-full self-stretch flex flex-col justify-start items-start gap-1">
          <NumericInput
            value={unit !== 'body' ? weight : 'body'}
            onChange={onWeightChange}
            min={0}
            max={999}
            className="Incrimentermetricwrapper w-full self-stretch h-12 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1"
            incrementing={unit !== 'body'}
            unitLabel={unit !== 'body' ? unit : undefined}
          />
        </div>
      </div>
    </div>
  );
} 