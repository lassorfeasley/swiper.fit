import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import SwipeSwitch from '@/components/molecules/swipe-switch';
import SetPill from '@/components/molecules/SetPill';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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
  const [isExpanded, setIsExpanded] = useState(!default_view);
  const [setConfigs, setSetConfigs] = useState(initialSetConfigs);
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: 0, weight: 0, unit: 'lbs' });
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Create sets array from setConfigs and setData
  const sets = useMemo(() => setConfigs.map((config, i) => {
    const fromParent = setData[i] || {};
    return {
      id: i + 1,
      name: `Set ${['one','two','three','four','five','six','seven','eight','nine','ten'][i] || i+1}`,
      reps: fromParent.reps ?? config.reps,
      weight: fromParent.weight ?? config.weight,
      unit: fromParent.unit ?? (config.unit || 'lbs'),
      status: fromParent.status ?? (i === 0 ? 'active' : 'locked'),
    };
  }), [setConfigs, setData]);

  // Update sets array if setConfigs changes
  useEffect(() => {
    if (!mountedRef.current) return;

    const updateSets = async () => {
      if (onSetDataChange) {
        for (const set of sets) {
          const parentSetData = setData.find(d => d.id === set.id);
          if (!parentSetData || parentSetData.reps === undefined || parentSetData.weight === undefined || parentSetData.status === undefined) {
            await Promise.all([
              onSetDataChange(exerciseId, set.id, 'reps', set.reps),
              onSetDataChange(exerciseId, set.id, 'weight', set.weight),
              onSetDataChange(exerciseId, set.id, 'status', set.status),
              onSetDataChange(exerciseId, set.id, 'unit', set.unit)
            ]);
          }
        }
      }
    };

    updateSets().catch(console.error);
  }, [JSON.stringify(setConfigs), exerciseId, onSetDataChange, setData, sets]);

  // New logic for swipeStatus in compact view
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

  // Handler for completing the CURRENTLY ACTIVE set
  const handleActiveSetComplete = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      if (isExpanded) {
        // Expanded view: complete only the active set and unlock the next
        if (!activeSet) return;
        
        if (onSetComplete) {
          await onSetComplete({
            setId: activeSet.id,
            exerciseId,
            reps: activeSet.reps,
            weight: activeSet.weight,
            status: 'complete',
          });
        }
        
        if (onSetDataChange) {
          await onSetDataChange(exerciseId, activeSet.id, 'status', 'complete');
          const nextSet = sets.find(s => s.id === activeSet.id + 1);
          if (nextSet && nextSet.status === 'locked') {
            await onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
          }
        }
      } else {
        // Compact view: complete ALL sets
        if (onSetDataChange) {
          await Promise.all(sets.map(set => {
            if (set.status !== 'complete') {
              return onSetDataChange(exerciseId, set.id, 'status', 'complete');
            }
            return Promise.resolve();
          }));
        }
        
        if (onSetComplete) {
          await Promise.all(sets.map(set => {
            if (set.status !== 'complete') {
              return onSetComplete({
                setId: set.id,
                exerciseId,
                reps: set.reps,
                weight: set.weight,
                status: 'complete',
              });
            }
            return Promise.resolve();
          }));
        }
      }
    } catch (error) {
      console.error('Error completing set:', error);
    }
  }, [isExpanded, activeSet, exerciseId, onSetComplete, onSetDataChange, sets]);

  const handlePillClick = useCallback((idx) => {
    if (!mountedRef.current) return;
    const set = sets[idx];
    setEditForm({ reps: set.reps, weight: set.weight, unit: set.unit });
    setOpenSetIndex(idx);
    setIsEditSheetOpen(true);
  }, [sets]);

  const handleEditFormSave = useCallback(async (formValues) => {
    if (!mountedRef.current || openSetIndex === null) return;

    try {
      if (onSetDataChange) {
        await Promise.all([
          onSetDataChange(exerciseId, sets[openSetIndex].id, 'reps', formValues.reps),
          onSetDataChange(exerciseId, sets[openSetIndex].id, 'weight', formValues.weight),
          onSetDataChange(exerciseId, sets[openSetIndex].id, 'unit', formValues.unit)
        ]);
      }
      setOpenSetIndex(null);
      setIsEditSheetOpen(false);
    } catch (error) {
      console.error('Error saving set edit:', error);
    }
  }, [exerciseId, onSetDataChange, openSetIndex, sets]);

  // If expanded view is true, render the detailed view
  if (isExpanded) {
    return (
      <CardWrapper className="w-full Property1Expanded self-stretch rounded-xl inline-flex flex-col justify-start items-start gap-[1px] overflow-hidden">
        <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden">
          <div className="Label flex-1 inline-flex flex-col justify-start items-start">
            <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
            <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
              {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => setIsExpanded(false)} 
            className="SortAscending relative"
          >
            <Minimize2 width={30} height={30} />
          </button>
        </div>
        <div className="Frame6 self-stretch flex flex-col justify-start items-start gap-[1px]">
          {sets.map((set, idx) => (
            <div key={set.id} className="SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start gap-2">
              <div className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center">
                <div className="SetOne justify-center text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
                  {set.name}
                </div>
                <SetPill
                  reps={set.reps}
                  weight={set.weight}
                  unit={set.unit}
                  editable={true}
                  onEdit={() => handlePillClick(idx)}
                  complete={set.status === 'complete'}
                />
              </div>
              <div className="Swipeswitch self-stretch bg-neutral-300 rounded-sm flex flex-col justify-start items-start gap-1">
                <SwipeSwitch 
                  status={set.status} 
                  onComplete={() => {
                    if (onSetComplete) {
                      onSetComplete({ setId: set.id, exerciseId, reps: set.reps, weight: set.weight, status: 'complete' });
                    }
                    if (onSetDataChange) {
                      onSetDataChange(exerciseId, set.id, 'status', 'complete');
                      const nextSet = sets.find(s => s.id === set.id + 1);
                      if (nextSet && nextSet.status === 'locked') {
                        onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
                      }
                    }
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
        {isUnscheduled && (
          <div className="text-center text-sm text-gray-500 mt-2 p-3 bg-white w-full">
            Unscheduled Exercise
          </div>
        )}
        <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader className="mb-4">
              <SheetTitle>Edit set</SheetTitle>
            </SheetHeader>
            <SetEditForm
              onSave={handleEditFormSave}
              initialValues={editForm}
            />
          </SheetContent>
        </Sheet>
      </CardWrapper>
    );
  }

  // Compact view
  return (
    <CardWrapper className="w-full Property1Compactactivesetcard self-stretch p-3 bg-white rounded-xl inline-flex flex-col justify-start items-start gap-[16px]">
      <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-normal font-['Space_Grotesk'] leading-loose">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-xs font-normal font-['Space_Grotesk'] leading-none">
            {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
          </div>
        </div>
        <button 
          type="button" 
          onClick={() => setIsExpanded(true)} 
          className="SortDescending relative"
        >
          <Maximize2 width={30} height={30} />
        </button>
      </div>
      <div className="SwipeStates self-stretch">
        <SwipeSwitch status={swipeStatus} onComplete={handleActiveSetComplete} />
      </div>
      <div className="Setpillwrapper self-stretch flex flex-wrap items-start gap-3 content-start">
        {sets.map((set, idx) => (
          <SetPill
            key={set.id}
            reps={set.reps}
            weight={set.weight}
            unit={set.unit}
            editable={true}
            onEdit={() => handlePillClick(idx)}
            complete={allComplete || set.status === 'complete'}
          />
        ))}
      </div>
      {isUnscheduled && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Unscheduled Exercise
        </div>
      )}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit set</SheetTitle>
          </SheetHeader>
          <SetEditForm
            onSave={handleEditFormSave}
            initialValues={editForm}
          />
        </SheetContent>
      </Sheet>
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
      id: PropTypes.number,
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      status: PropTypes.oneOf(['active', 'locked', 'complete']),
    })
  ),
};

export default React.memo(ActiveExerciseCard); 