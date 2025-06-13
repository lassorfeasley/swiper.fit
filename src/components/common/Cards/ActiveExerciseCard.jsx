import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import SwipeSwitch from '@/components/molecules/swipe-switch';
import CardPill from '@/components/molecules/CardPill';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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

    console.log(`ActiveExerciseCard: handleActiveSetComplete called. View: ${isExpanded ? 'Expanded' : 'Compact'}`);

    try {
      if (isExpanded && activeSet) {
        // Expanded view: complete only the active set and unlock the next
        console.log('ActiveExerciseCard: Expanded view completion. Active set:', activeSet);
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
          console.log('ActiveExerciseCard: Expanded view sending data:', { exerciseId, setId: activeSet.id, status: 'complete' });
          await onSetDataChange(exerciseId, activeSet.id, 'status', 'complete');
          const nextSet = sets.find(s => s.id === activeSet.id + 1);
          if (nextSet && nextSet.status === 'locked') {
            await onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
          }
        }
      } else if (!isExpanded) {
        // Compact view: complete ALL sets
        if (onSetDataChange) {
          console.log('ActiveExerciseCard: Compact view completion. All sets:', sets);
          await Promise.all(sets.map(set => {
            if (set.status !== 'complete') {
              console.log('ActiveExerciseCard: Compact view sending data for set:', set);
              onSetDataChange(exerciseId, set.id, 'status', 'complete');
              onSetDataChange(exerciseId, set.id, 'reps', set.reps);
              onSetDataChange(exerciseId, set.id, 'weight', set.weight);
              onSetDataChange(exerciseId, set.id, 'unit', set.unit);
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
  if (isExpanded && initialSetConfigs.length > 1) {
    return (
      <CardWrapper className="Property1Expanded self-stretch rounded-xl inline-flex flex-col justify-start items-start overflow-hidden gap-0" style={{ maxWidth: 500 }}>
        <div className="Labelandexpand self-stretch p-3 bg-white inline-flex justify-start items-start overflow-hidden" style={{ marginBottom: 0 }}>
          <div className="Label flex-1 inline-flex flex-col justify-start items-start">
            <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">{exerciseName}</div>
            <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
              {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
            </div>
          </div>
          {initialSetConfigs.length > 1 && (
            <button 
              type="button" 
              onClick={() => setIsExpanded(false)} 
              className="SortAscending size-7 relative overflow-hidden"
            >
              <Minimize2 className="w-6 h-5 left-[3px] top-[4.50px] absolute text-neutral-400" />
            </button>
          )}
        </div>
        <div className="w-full">
          {sets.map((set, idx) => (
            <React.Fragment key={set.id}>
              <div className={`SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start${idx === 0 ? ' pt-0' : ''}`}>
                <div className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center mb-1">
                  <div className="SetOne justify-center text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
                    {set.name}
                  </div>
                  <CardPill
                    reps={set.reps}
                    weight={set.weight}
                    unit={set.unit}
                    editable={true}
                    onEdit={() => handlePillClick(idx)}
                    complete={set.status === 'complete'}
                    className="Setpill px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
                  />
                </div>
                <div className="Swipeswitch self-stretch bg-neutral-300 rounded-sm flex flex-col justify-start items-start">
                  <SwipeSwitch 
                    status={set.status} 
                    onComplete={() => {
                      if (onSetComplete) {
                        onSetComplete({ setId: set.id, exerciseId, reps: set.reps, weight: set.weight, status: 'complete' });
                      }
                      if (onSetDataChange) {
                        console.log('ActiveExerciseCard: Expanded view - swipe sending data for set:', set);
                        onSetDataChange(exerciseId, set.id, 'status', 'complete');
                        onSetDataChange(exerciseId, set.id, 'reps', set.reps);
                        onSetDataChange(exerciseId, set.id, 'weight', set.weight);
                        onSetDataChange(exerciseId, set.id, 'unit', set.unit);
                        const nextSet = sets.find(s => s.id === set.id + 1);
                        if (nextSet && nextSet.status === 'locked') {
                          onSetDataChange(exerciseId, nextSet.id, 'status', 'active');
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              {idx < sets.length - 1 && (
                <div className="Divider self-stretch h-0 outline outline-1 outline-offset-[-0.5px] outline-stone-200" />
              )}
            </React.Fragment>
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
              <SheetDescription>
                Update the reps, weight, and unit for this set.
              </SheetDescription>
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
    <CardWrapper className="Property1Compact self-stretch p-3 bg-stone-50 rounded-lg inline-flex flex-col justify-start items-start gap-4" style={{ maxWidth: 500 }}>
      <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">{exerciseName}</div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
            {setConfigs.length === 1 ? 'One set' : setConfigs.length === 2 ? 'Two sets' : setConfigs.length === 3 ? 'Three sets' : `${setConfigs.length} sets`}
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
        <SwipeSwitch status={swipeStatus} onComplete={handleActiveSetComplete} />
      </div>
      <div className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-3 flex-wrap content-center overflow-hidden">
        {sets.map((set, idx) => (
          <CardPill
            key={set.id}
            reps={set.reps}
            weight={set.weight}
            unit={set.unit}
            editable={true}
            onEdit={() => handlePillClick(idx)}
            complete={allComplete || set.status === 'complete'}
            className="Setpill px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
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
            <SheetDescription>
              Update the reps, weight, and unit for this set.
            </SheetDescription>
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