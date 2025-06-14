import React from 'react';
import PropTypes from 'prop-types';
import NumericInput from '@/components/molecules/numeric-input';
import { SwiperButton } from '@/components/molecules/swiper-button';
import ToggleInput from '@/components/molecules/toggle-input';

const setTypeOptions = [
  { label: 'Reps', value: 'reps' },
  { label: 'Timed', value: 'timed' },
];

const unitOptions = [
  { label: 'lbs', value: 'lbs' },
  { label: 'kg', value: 'kg' },
  { label: 'body', value: 'body' },
];

const SetEditForm = ({
  formPrompt = "Edit set",
  onSave,
  onSaveForFuture,
  initialValues = { reps: 0, weight: 0, unit: 'lbs', set_type: 'reps' },
  className = '',
}) => {
  const [formValues, setFormValues] = React.useState(initialValues);

  React.useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleValueChange = (field, value) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSetTypeChange = (val) => {
    if (!val) return;
    setFormValues(prev => {
      const next = { ...prev, set_type: val };
      if (val === 'timed' && (!prev.timed_set_duration || prev.timed_set_duration === 0)) {
        next.timed_set_duration = 30;
      }
      return next;
    });
  };

  const handleUnitChange = (val) => {
    if (val) {
      handleValueChange('unit', val);
    }
  };

  const handleSaveToday = () => {
    onSave(formValues);
  };

  const handleSaveFuture = () => {
    if (onSaveForFuture) {
      onSaveForFuture(formValues);
    } else {
      // Fallback to onSave if the new prop isn't provided yet
      onSave(formValues);
    }
  };

  const { set_type = 'reps', reps = 0, weight = 0, unit = 'lbs', timed_set_duration = 30 } = formValues;

  return (
    <div className={`Setconfigurationform w-full inline-flex flex-col justify-start items-start gap-6 ${className}`}>
      <div className="EditSetOne self-stretch h-6 justify-start text-slate-600 text-lg font-medium font-['Space_Grotesk'] leading-7">{formPrompt}</div>
      <div className="Atomicsetbuilderform w-full flex flex-col justify-start items-start gap-6">
        <div className="Frame7 self-stretch flex flex-col justify-start items-start gap-3">
          <div className="Frame14 self-stretch flex flex-col justify-start items-start gap-4">
            
            <ToggleInput
                label="Set type"
                options={setTypeOptions}
                value={set_type}
                onChange={handleSetTypeChange}
            />

            {set_type === 'reps' ? (
              <NumericInput
                label="Reps"
                value={reps}
                onChange={(val) => handleValueChange('reps', val)}
                unit="Reps"
              />
            ) : (
              <NumericInput
                label="Duration"
                value={timed_set_duration}
                onChange={(val) => handleValueChange('timed_set_duration', val)}
                unit="Seconds"
                step={5}
              />
            )}

            <ToggleInput
                label="Weight unit"
                options={unitOptions}
                value={unit}
                onChange={handleUnitChange}
            />

            <NumericInput
              label="Weight"
              value={weight}
              onChange={(val) => handleValueChange('weight', val)}
              unit={unit === 'body' ? '' : unit.toUpperCase()}
              step={0.1}
              allowTwoDecimals={true}
              disabled={unit === 'body'}
            />

          </div>
        </div>
      </div>
      <div className="Frame6 self-stretch flex flex-col justify-start items-start gap-3">
        {onSaveForFuture && <div className="UpdateProgram self-stretch justify-start text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal">Update program?</div>}
        <SwiperButton onClick={handleSaveToday} variant="default" className="w-full">
          Just for today
        </SwiperButton>
        {onSaveForFuture && (
          <SwiperButton onClick={handleSaveFuture} variant="destructive" className="w-full">
            For future workouts
          </SwiperButton>
        )}
      </div>
    </div>
  );
};

SetEditForm.propTypes = {
  formPrompt: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onSaveForFuture: PropTypes.func,
  initialValues: PropTypes.shape({
    reps: PropTypes.number,
    weight: PropTypes.number,
    unit: PropTypes.oneOf(['kg', 'lbs', 'body']),
    set_type: PropTypes.string,
    timed_set_duration: PropTypes.number,
  }),
  className: PropTypes.string,
};

export default SetEditForm; 