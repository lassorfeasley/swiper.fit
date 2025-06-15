import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import { SwiperAccordion, SwiperAccordionItem, SwiperAccordionTrigger, SwiperAccordionContent } from "@/components/molecules/swiper-accordion";
import ToggleInput from '@/components/molecules/toggle-input';
import { SwiperButton } from '@/components/molecules/swiper-button';
import SetBuilderForm from './SetBuilderForm';

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

const setTypeOptions = [
  { label: 'Reps', value: 'reps' },
  { label: 'Timed', value: 'timed' },
];

const AddNewExerciseForm = ({
  onActionIconClick,
  onDelete,
  formPrompt = "Add to program",
  initialName = '',
  initialSets = 3,
  initialSetConfigs = [],
}) => {
  const [exerciseName, setExerciseName] = useState(initialName || '');
  const [sets, setSets] = useState(initialSets || 3);
  const [setConfigs, setSetConfigs] = useState(
    Array.from({ length: initialSets || 3 }, (_, i) =>
      initialSetConfigs[i] || { reps: 3, weight: 25, unit: 'lbs' }
    )
  );
  const [openSet, setOpenSet] = useState(undefined);
  const [overrides, setOverrides] = useState(() => Array.from({ length: initialSets || 3 }, () => ({ reps: false, weight: false, unit: false })));
  const [setDefaults, setSetDefaults] = useState({
    reps: initialSetConfigs[0]?.reps ?? 3,
    weight: initialSetConfigs[0]?.weight ?? 25,
    unit: initialSetConfigs[0]?.unit ?? 'lbs',
  });
  const [setTypeDefault, setSetTypeDefault] = useState('reps');
  const [setTypeOverrides, setSetTypeOverrides] = useState(() => Array.from({ length: sets || 3 }, () => 'reps'));

  useEffect(() => {
    setSetConfigs(prev => {
      const arr = Array.from({ length: sets }, (_, i) => prev[i] || { ...setDefaults });
      return arr;
    });
  }, [sets, setDefaults]);

  useEffect(() => {
    setOverrides(prev => {
      const arr = Array.from({ length: sets }, (_, i) => prev[i] || { reps: false, weight: false, unit: false });
      return arr;
    });
  }, [sets]);

  const getSetValue = (idx, field) => {
    if (overrides[idx]?.[field]) return setConfigs[idx]?.[field];
    return setDefaults[field];
  };

  const handleSetFieldChange = (idx, field, value) => {
    setSetConfigs(prev => prev.map((cfg, i) => i === idx ? { ...cfg, [field]: value } : cfg));
    setOverrides(prev => prev.map((ov, i) => i === idx ? { ...ov, [field]: true } : ov));
  };

  const handleSetDefaultsChange = (field, value) => {
    setSetDefaults(prev => ({ ...prev, [field]: value }));
  };

  const handleSetTypeDefaultChange = (val) => {
    setSetTypeDefault(val);
    setSetDefaults(prev => {
      const next = { ...prev, set_type: val };
      if (val === 'timed' && (!prev.timed_set_duration || prev.timed_set_duration <= 0)) {
        next.timed_set_duration = 30;
      }
      if (val === 'reps') {
        next.timed_set_duration = undefined;
      }
      return next;
    });
  };

  const handleSetTypeOverrideChange = (idx, val) => {
    setSetTypeOverrides(prev => prev.map((t, i) => i === idx ? val : t));
    setSetConfigs(prev => prev.map((cfg, i) => {
      if (i !== idx) return cfg;
      const next = { ...cfg, set_type: val };
      if (val === 'timed' && (!cfg.timed_set_duration || cfg.timed_set_duration <= 0)) {
        next.timed_set_duration = 30;
      }
      if (val === 'reps') {
        next.timed_set_duration = undefined;
      }
      return next;
    }));
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
    <form className="Editexerciseform w-full max-w-sm box-border inline-flex flex-col justify-start items-start gap-6" onSubmit={handleSave}>
      <div className="CreateExercise self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-7">{formPrompt}</div>
      <div className="Divider self-stretch flex flex-col justify-start items-start">
        <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-stone-200"></div>
      </div>
      <div className="Frame13 self-stretch flex flex-col justify-start items-start gap-3">
        <TextInput
          value={exerciseName}
          onChange={e => setExerciseName(e.target.value)}
          customPlaceholder="Exercise name"
          className="Textinput self-stretch rounded-sm flex flex-col justify-center items-start gap-1"
        />
        <div className="NumericField self-stretch h-20 flex flex-col justify-start items-start gap-1">
          <div className="FieldLabel justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Sets</div>
          <NumericInput
            value={sets}
            onChange={setSets}
            min={1}
            max={10}
            className="Incrimentermetricwrapper self-stretch h-12 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1"
          />
        </div>
      </div>
      <div className="Divider self-stretch flex flex-col justify-start items-start">
        <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-stone-200"></div>
      </div>
      <div className="Frame10 self-stretch flex flex-col justify-start items-start gap-3">
        <div className="SetDefaults self-stretch h-6 justify-start text-slate-600 text-lg font-medium font-['Space_Grotesk'] leading-7">Set defaults</div>
        <div className="TheseSettingsWillApplyToAllSetsUnlessYouEditThemIndividuallyBelow self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">These settings will apply to all sets unless you edit them individually below. </div>
        <div className="Atomicsetbuilderform w-full flex flex-col justify-start items-start gap-6">
          <SetBuilderForm
            setType={setTypeDefault}
            onSetTypeChange={val => val && handleSetTypeDefaultChange(val)}
            reps={setDefaults.reps}
            timed_set_duration={setDefaults.timed_set_duration}
            onRepsChange={v => handleSetDefaultsChange('reps', v)}
            onTimedDurationChange={v => handleSetDefaultsChange('timed_set_duration', v)}
            weight={setDefaults.weight}
            unit={setDefaults.unit}
            onWeightChange={v => handleSetDefaultsChange('weight', v)}
            onUnitChange={unit => unit && handleSetDefaultsChange('unit', unit)}
          />
        </div>
      </div>
      <div className="Divider self-stretch flex flex-col justify-start items-start">
        <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-stone-200"></div>
      </div>
      <div className="Frame9 self-stretch flex flex-col justify-start items-start">
        <SwiperAccordion type="single" collapsible value={openSet} onValueChange={setOpenSet} className="w-full">
          {setConfigs.map((cfg, idx) => (
            <SwiperAccordionItem key={idx} value={String(idx)}>
              <SwiperAccordionTrigger>{`Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][idx] || idx+1}`}</SwiperAccordionTrigger>
              <SwiperAccordionContent>
                <div className="flex flex-col gap-4 py-2">
                  <div className="Atomicsetbuilderform w-full flex flex-col justify-start items-start gap-6">
                    <SetBuilderForm
                      setType={setTypeOverrides[idx]}
                      onSetTypeChange={val => val && handleSetTypeOverrideChange(idx, val)}
                      reps={getSetValue(idx, 'reps')}
                      timed_set_duration={setTypeOverrides[idx] === 'timed' ? (getSetValue(idx, 'timed_set_duration') || 30) : getSetValue(idx, 'timed_set_duration')}
                      onRepsChange={v => handleSetFieldChange(idx, 'reps', v)}
                      onTimedDurationChange={v => handleSetFieldChange(idx, 'timed_set_duration', v)}
                      weight={getSetValue(idx, 'weight')}
                      unit={getSetValue(idx, 'unit')}
                      onWeightChange={v => handleSetFieldChange(idx, 'weight', v)}
                      onUnitChange={unit => unit && handleSetFieldChange(idx, 'unit', unit)}
                    />
                  </div>
                </div>
              </SwiperAccordionContent>
            </SwiperAccordionItem>
          ))}
        </SwiperAccordion>
      </div>
      <div className="Frame7 self-stretch flex flex-col justify-start items-start gap-3">
        <SwiperButton type="submit" className="Swiperbuttonutilitywrapper self-stretch h-10 px-4 py-2 bg-slate-600 rounded-sm inline-flex justify-center items-center gap-2.5">
          {formPrompt === 'Edit exercise' ? 'Save exercise' : 'Add to program'}
        </SwiperButton>
        {formPrompt === 'Edit exercise' && (
          <SwiperButton type="button" variant="destructive" onClick={onDelete} className="Swiperbuttonutilitywrapper self-stretch h-10 px-4 py-2 bg-red-400 rounded-sm inline-flex justify-center items-center gap-2.5">
            Delete exercise
          </SwiperButton>
        )}
        {formPrompt !== 'Edit exercise' && (
          <SwiperButton type="button" variant="destructive" onClick={onDelete} className="Swiperbuttonutilitywrapper self-stretch h-10 px-4 py-2 bg-red-400 rounded-sm inline-flex justify-center items-center gap-2.5">
            Cancel
          </SwiperButton>
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