import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import { SwiperAccordion, SwiperAccordionItem, SwiperAccordionTrigger, SwiperAccordionContent } from "@/components/molecules/swiper-accordion";
import ToggleInput from '@/components/molecules/toggle-input';
import { SwiperButton } from '@/components/molecules/swiper-button';

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
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
      <div className="CreateExercise self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-7">Create exercise</div>
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
        <div className="Setconfigurationform self-stretch flex flex-col justify-start items-start gap-6">
          <div className="Frame5 self-stretch flex flex-col justify-start items-start gap-3">
            <div className="NumericField self-stretch flex flex-col justify-start items-start gap-1">
              <div className="FieldLabel justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Reps</div>
              <NumericInput
                value={setDefaults.reps}
                onChange={v => handleSetDefaultsChange('reps', v)}
                min={0}
                max={999}
                className="Incrimentermetricwrapper self-stretch h-12 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1"
              />
            </div>
            <div className="NumericField self-stretch flex flex-col justify-start items-start gap-1">
              <div className="FieldLabel justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight</div>
              <NumericInput
                value={setDefaults.weight !== undefined && setDefaults.unit !== 'body' ? setDefaults.weight : (setDefaults.unit === 'body' ? 'body' : 0)}
                onChange={v => handleSetDefaultsChange('weight', v)}
                min={0}
                max={999}
                className="Incrimentermetricwrapper self-stretch h-12 bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1"
                incrementing={setDefaults.unit !== 'body'}
              />
            </div>
            <div className="Togglegroup self-stretch flex flex-col justify-start items-center gap-1">
              <div className="FieldLabel self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight unit</div>
              <ToggleInput
                options={unitOptions}
                value={setDefaults.unit}
                onChange={unit => unit && handleSetDefaultsChange('unit', unit)}
                className="Frame4 self-stretch rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center overflow-hidden"
              />
            </div>
          </div>
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
                  <div className="NumericField flex flex-col gap-1">
                    <div className="FieldLabel justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Reps</div>
                    <NumericInput
                      value={getSetValue(idx, 'reps')}
                      onChange={v => handleSetFieldChange(idx, 'reps', v)}
                      min={0}
                      max={999}
                      className="w-full"
                    />
                  </div>
                  <div className="NumericField flex flex-col gap-1">
                    <div className="FieldLabel justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight</div>
                    <NumericInput
                      value={getSetValue(idx, 'weight') !== undefined && getSetValue(idx, 'unit') !== 'body' ? getSetValue(idx, 'weight') : (getSetValue(idx, 'unit') === 'body' ? 'body' : 0)}
                      onChange={v => handleSetFieldChange(idx, 'weight', v)}
                      min={0}
                      max={999}
                      className="w-full"
                      incrementing={getSetValue(idx, 'unit') !== 'body'}
                    />
                  </div>
                  <div className="Togglegroup flex flex-col gap-1">
                    <div className="FieldLabel self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Weight unit</div>
                    <ToggleInput
                      options={unitOptions}
                      value={getSetValue(idx, 'unit')}
                      onChange={unit => unit && handleSetFieldChange(idx, 'unit', unit)}
                      className="w-full"
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
          Add to program
        </SwiperButton>
        <SwiperButton type="button" variant="destructive" onClick={onDelete} className="Swiperbuttonutilitywrapper self-stretch h-10 px-4 py-2 bg-red-400 rounded-sm inline-flex justify-center items-center gap-2.5">
          Cancel
        </SwiperButton>
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