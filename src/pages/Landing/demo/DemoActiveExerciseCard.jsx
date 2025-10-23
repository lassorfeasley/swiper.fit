import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DemoSwipeSwitch from "./DemoSwipeSwitch";
import PropTypes from "prop-types";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const CARD_ANIMATION_DURATION_MS = 500;

const DemoActiveExerciseCard = React.forwardRef(({
  exerciseId,
  exerciseName,
  initialSetConfigs = [],
  isFocused,
  isExpanded,
  onFocus,
  onSetPress,
  onEditExercise,
  onSetComplete,
  index,
  focusedIndex,
  totalCards,
  isCompleted = false,
  demo = true,
}, ref) => {
  const setsRef = useRef([]);

  // Use initialSetConfigs directly as sets - context is the single source of truth
  const sets = useMemo(() => {
    return initialSetConfigs.map((config, i) => ({
      ...config,
      id: config.id || null,
      tempId: config.id ? null : `temp-${i}`,
      reps: config.reps || 0,
      weight: config.weight || 0,
      weight_unit: config.weight_unit || config.unit || "lbs",
      status: config.status || "default",
      set_variant: config.set_variant || `Set ${i + 1}`,
      routine_set_id: config.routine_set_id,
    }));
  }, [initialSetConfigs]);

  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  const allComplete = useMemo(
    () => isCompleted || sets.every((set) => set.status === "complete"),
    [sets, isCompleted]
  );

  const handleSetComplete = useCallback(
    (setIdx) => {
      // Notify parent context about the set completion
      if (onSetComplete) {
        const setToComplete = sets[setIdx];
        onSetComplete(exerciseId, setToComplete);
      }
    },
    [sets, exerciseId, onSetComplete]
  );

  const cardStatus = allComplete ? "complete" : "default";
  const cardWrapperClass = cn({});

  const cardRef = useRef(null);
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const handleTouchMove = (e) => {
      if (isFocused) e.preventDefault();
    };
    node.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => node.removeEventListener('touchmove', handleTouchMove);
  }, [isFocused]);

  return (
    <CardWrapper
      ref={(node) => { cardRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node; }}
      reorderable={false}
      className={cardWrapperClass}
      id={`exercise-${exerciseId}`}
      data-exercise-card="true" data-exercise-id={exerciseId}
      status={cardStatus}
      onClick={() => {
        if (isFocused) {
          onEditExercise?.();
        } else {
          onFocus?.();
        }
      }}
      index={index}
      focusedIndex={focusedIndex}
      totalCards={totalCards}
      style={{ touchAction: isFocused ? 'pan-x' : 'auto', overscrollBehaviorY: isFocused ? 'contain' : 'auto' }}
    >
      <div className={cn("w-full bg-white rounded-[12px] border border-neutral-300 inline-flex flex-col justify-center items-center overflow-hidden", (isFocused || isExpanded) && "gap-4")}> 
        <div className={cn("self-stretch p-3 flex flex-col justify-start items-start", (isFocused || isExpanded) && "gap-5")}> 
          {/* Label Section */}
          <div className="self-stretch inline-flex justify-start items-center gap-5">
            <div className="flex-1 inline-flex flex-col justify-start items-start gap-0.5">
              <div className="self-stretch justify-start text-neutral-neutral-700 text-lg font-medium leading-tight">
                {exerciseName}
              </div>
            </div>
            <div className="size-8 flex items-center justify-center">
              {allComplete
                ? <Check className="w-6 h-6 text-green-500" />
                : <Check className="w-6 h-6 text-neutral-300" />}
            </div>
          </div>
          {/* Swiper Section (collapsible) */}
          <div
            className={`grid w-full transition-[grid-template-rows] ease-in-out ${
              isFocused || isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
            style={{ transitionDuration: `${CARD_ANIMATION_DURATION_MS}ms` }}
          >
            <div className="overflow-hidden w-full">
              <div className={`w-full flex flex-col justify-start gap-5`}>
                {sets.map((set, index) => (
                  <DemoSwipeSwitch
                    key={set.routine_set_id || set.tempId || set.id || `exercise-${exerciseId}-set-${index}`}
                    set={set}
                    onComplete={() => handleSetComplete(index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetPress?.(set, index);
                    }}
                    className="w-full"
                    demo={true}
                  />
                ))}
                {/* hint removed per new design */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardWrapper>
  );
});

DemoActiveExerciseCard.propTypes = {
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  exerciseName: PropTypes.string.isRequired,
  initialSetConfigs: PropTypes.array,
  isFocused: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onFocus: PropTypes.func,
  onSetPress: PropTypes.func,
  onEditExercise: PropTypes.func,
  onSetComplete: PropTypes.func,
  index: PropTypes.number,
  focusedIndex: PropTypes.number,
  totalCards: PropTypes.number,
  isCompleted: PropTypes.bool,
  demo: PropTypes.bool,
};

export default DemoActiveExerciseCard; 