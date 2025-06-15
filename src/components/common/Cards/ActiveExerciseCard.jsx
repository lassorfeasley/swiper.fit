import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import SwipeSwitch from '@/components/molecules/swipe-switch';
import CardPill from '@/components/molecules/CardPill';
import { SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { SwiperSheet } from '@/components/ui/swiper-sheet';
import SetEditForm from '@/components/common/forms/SetEditForm';
import WeightCompoundField from '@/components/common/forms/WeightCompoundField';
import NumericInput from '@/components/molecules/numeric-input';
import PropTypes from 'prop-types';
import { Maximize2, Minimize2 } from 'lucide-react';
import CardWrapper from './Wrappers/CardWrapper';

const ActiveExerciseCard = ({
  exerciseId,
  exerciseName,
  initialSetConfigs = [],
  onSetComplete,
  onSetDataChange,
  isUnscheduled,
  default_view = true,
  setData = [],
}) => {
  const [isExpanded, setIsExpanded] = useState(!default_view && initialSetConfigs.length > 1);
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: 0, weight: 0, unit: 'lbs' });
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Derive sets from setData and initialSetConfigs
  const sets = useMemo(() => {
    return initialSetConfigs.map((config, i) => {
      const fromParent = setData.find(d => d.id === i + 1 || d.id === String(i + 1)) || setData[i] || {};
      return {
        id: i + 1,
        name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
        reps: fromParent.reps ?? config.reps,
        weight: fromParent.weight ?? config.weight,
        unit: fromParent.unit ?? (config.unit || 'lbs'),
        status: fromParent.status ?? (i === 0 ? 'active' : 'locked'),
        set_type: fromParent.set_type ?? config.set_type ?? 'reps',
        timed_set_duration: fromParent.timed_set_duration ?? config.timed_set_duration,
      };
    });
  }, [initialSetConfigs, setData]);

  const allComplete = useMemo(() => sets.every(set => set.status === 'complete'), [sets]);
  const anyActive = useMemo(() => sets.some(set => set.status === 'active'), [sets]);
  const activeSet = useMemo(
    () => sets.find(set => set.status === 'active') || (sets.length > 0 ? sets[0] : undefined),
    [sets]
  );
  const swipeStatus = useMemo(() => 
    allComplete ? 'complete' : anyActive ? 'active' : 'locked',
    [allComplete, anyActive]
  );

  const handleSetComplete = useCallback(async (setIdx) => {
    if (!mountedRef.current) return;
    const setToComplete = sets[setIdx];
    const nextSet = sets[setIdx + 1];
    if (onSetComplete) {
      Promise.resolve(onSetComplete(exerciseId, setToComplete)).catch(console.error);
    }
    if (onSetDataChange) {
      Promise.resolve(onSetDataChange(exerciseId, setToComplete.id, 'status', 'complete')).catch(console.error);
      if (nextSet && nextSet.status === 'locked') {
        Promise.resolve(onSetDataChange(exerciseId, nextSet.id, 'status', 'active')).catch(console.error);
      }
    }
  }, [exerciseId, onSetComplete, onSetDataChange, sets]);

  const handleActiveSetComplete = useCallback(async () => {
    if (!mountedRef.current) return;
    const activeSetIndex = sets.findIndex(s => s.status === 'active');
    if (activeSetIndex === -1) return;
    const activeSetToComplete = sets[activeSetIndex];
    const nextSet = sets[activeSetIndex + 1];
    if (onSetComplete) {
      Promise.resolve(onSetComplete(exerciseId, activeSetToComplete)).catch(console.error);
    }
    if (onSetDataChange) {
      Promise.resolve(onSetDataChange(exerciseId, activeSetToComplete.id, 'status', 'complete')).catch(console.error);
      if (nextSet && nextSet.status === 'locked') {
        Promise.resolve(onSetDataChange(exerciseId, nextSet.id, 'status', 'active')).catch(console.error);
      }
    }
  }, [exerciseId, onSetComplete, onSetDataChange, sets]);

  const handlePillClick = useCallback((idx) => {
    if (!mountedRef.current) return;
    const set = sets[idx];
    setEditForm({
      reps: set.reps,
      weight: set.weight,
      unit: set.unit,
      set_type: set.set_type || (initialSetConfigs[idx]?.set_type) || 'reps',
      timed_set_duration: set.timed_set_duration || (initialSetConfigs[idx]?.timed_set_duration) || 30
    });
    setOpenSetIndex(idx);
    setIsEditSheetOpen(true);
  }, [sets, initialSetConfigs]);

  const handleEditFormSave = useCallback(async (formValues) => {
    if (!mountedRef.current || openSetIndex === null) return;
    const set_id_to_update = sets[openSetIndex].id;
    if (onSetDataChange) {
      Promise.all([
        onSetDataChange(exerciseId, set_id_to_update, 'reps', formValues.reps),
        onSetDataChange(exerciseId, set_id_to_update, 'weight', formValues.weight),
        onSetDataChange(exerciseId, set_id_to_update, 'unit', formValues.unit),
        onSetDataChange(exerciseId, set_id_to_update, 'set_type', formValues.set_type),
        onSetDataChange(exerciseId, set_id_to_update, 'timed_set_duration', formValues.set_type === 'timed' ? formValues.timed_set_duration : undefined)
      ]).catch(console.error);
    }
    setOpenSetIndex(null);
    setIsEditSheetOpen(false);
  }, [exerciseId, onSetDataChange, openSetIndex, sets]);

  // If expanded view is true, render the detailed view
  if (isExpanded && initialSetConfigs.length > 1) {
    return (
      <CardWrapper className="Property1Expanded self-stretch rounded-xl flex flex-col justify-start items-start overflow-hidden gap-0">
        <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-center overflow-hidden">
          <div className="Label flex-1 inline-flex flex-col justify-start items-start">
            <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">{exerciseName}</div>
            <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
              {sets.length === 1 ? 'One set' : sets.length === 2 ? 'Two sets' : sets.length === 3 ? 'Three sets' : `${sets.length} sets`}
            </div>
          </div>
          <button type="button" onClick={() => setIsExpanded(false)} className="Lucide size-6 flex items-center justify-center relative overflow-hidden">
            <Minimize2 className="w-4 h-4 outline outline-2 outline-offset-[-1px] outline-neutral-300" />
          </button>
        </div>
        {sets.map((set, idx) => {
          const setType = set.set_type || 'reps';
          const timedDuration = set.timed_set_duration;
          let swipeStatus = set.status;
          if (setType === 'timed' && set.status !== 'complete') {
            swipeStatus = 'inactive-timed';
          }
          return (
            <React.Fragment key={set.id}>
              <div className="SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start gap-2">
                <div className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center">
                  <div className="SetOne justify-center text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">{set.name}</div>
                  <CardPill
                    reps={set.reps}
                    weight={set.weight}
                    unit={set.unit}
                    complete={set.status === 'complete'}
                    editable={true}
                    onEdit={() => handlePillClick(idx)}
                    set_type={setType}
                    timed_set_duration={timedDuration}
                    className="Cardpill px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
                  />
                </div>
                <div className="Swipeswitch self-stretch bg-neutral-300 rounded-sm flex flex-col justify-start items-start">
                  <SwipeSwitch
                    status={swipeStatus}
                    onComplete={() => handleSetComplete(idx)}
                    duration={timedDuration || 30}
                  />
                </div>
              </div>
              {idx < sets.length - 1 && (
                <div className="Divider self-stretch flex flex-col justify-start items-start">
                  <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.50px] outline-stone-200"></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {isUnscheduled && (
          <div className="text-center text-sm text-gray-500 mt-2 p-3 bg-white w-full">
            Unscheduled Exercise
          </div>
        )}
        <SwiperSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
            <SheetHeader className="mb-4">
              <SheetTitle>Edit set</SheetTitle>
              <SheetDescription>
                Update the reps, weight, and unit for this set.
              </SheetDescription>
            </SheetHeader>
            <SetEditForm
              onSave={handleEditFormSave}
              initialValues={editForm}
            />
        </SwiperSheet>
      </CardWrapper>
    );
  }

  // Compact view
  return (
    <CardWrapper className="Property1Compact self-stretch p-3 bg-stone-50 rounded-lg inline-flex flex-col justify-start items-start gap-4" style={{ maxWidth: 500 }}>
      <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
            {sets.length === 1 ? 'One set' : sets.length === 2 ? 'Two sets' : sets.length === 3 ? 'Three sets' : `${sets.length} sets`}
          </div>
        </div>
        {initialSetConfigs.length > 1 && (
          <button 
            type="button" 
            onClick={() => setIsExpanded(true)} 
            className="SortDescending size-7 relative overflow-hidden"
          >
            <Maximize2 className="w-6 h-5 left-[3px] top-[4.50px] absolute text-neutral-400" />
          </button>
        )}
      </div>
      <div className="Swipeswitch self-stretch bg-neutral-300 rounded-sm flex flex-col justify-start items-start gap-1">
        <SwipeSwitch 
          status={swipeStatus} 
          onComplete={handleActiveSetComplete}
          duration={activeSet?.set_type === 'timed' ? activeSet.timed_set_duration : undefined}
        />
      </div>
      <div className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-3 flex-wrap content-center overflow-hidden">
        {sets.map((set, idx) => {
          const setType = set.set_type || 'reps';
          const timedDuration = set.timed_set_duration;
          return (
            <CardPill
              key={set.id}
              reps={set.reps}
              weight={set.weight}
              unit={set.unit}
              complete={set.status === 'complete'}
              editable={true}
              onEdit={() => handlePillClick(idx)}
              set_type={setType}
              timed_set_duration={timedDuration}
              className="Setpill px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
            />
          );
        })}
      </div>
      {isUnscheduled && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Unscheduled Exercise
        </div>
      )}
      <SwiperSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetHeader className="mb-4">
            <SheetTitle>Edit set</SheetTitle>
            <SheetDescription>
              Update the reps, weight, and unit for this set.
            </SheetDescription>
          </SheetHeader>
          <SetEditForm
            onSave={handleEditFormSave}
            initialValues={editForm}
          />
      </SwiperSheet>
    </CardWrapper>
  );
};

ActiveExerciseCard.propTypes = {
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  exerciseName: PropTypes.string.isRequired,
  initialSetConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      isComplete: PropTypes.bool,
    })
  ),
  onSetComplete: PropTypes.func,
  onSetDataChange: PropTypes.func,
  isUnscheduled: PropTypes.bool,
  default_view: PropTypes.bool,
  setData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      status: PropTypes.oneOf(['active', 'locked', 'complete']),
    })
  ),
};

export default React.memo(ActiveExerciseCard); 
