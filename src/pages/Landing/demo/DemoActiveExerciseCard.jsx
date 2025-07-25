import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import DemoSwipeSwitch from "./DemoSwipeSwitch";
import PropTypes from "prop-types";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
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
  index,
  focusedIndex,
  totalCards,
  isCompleted = false,
  demo = true,
}, ref) => {
  const setsRef = useRef([]);
  const [reorderedSets, setReorderedSets] = useState(null);

  // Use initialSetConfigs directly as sets, or reordered sets if available
  const sets = useMemo(() => {
    const sourceSets = reorderedSets || initialSetConfigs;
    return sourceSets.map((config, i) => ({
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
  }, [initialSetConfigs, reorderedSets]);

  useEffect(() => {
    setsRef.current = sets;
  }, [sets]);

  useEffect(() => {
    setReorderedSets(null);
  }, [initialSetConfigs]);

  const allComplete = useMemo(
    () => isCompleted || sets.every((set) => set.status === "complete"),
    [sets, isCompleted]
  );

  const handleSetComplete = useCallback(
    (setIdx) => {
      // In demo, just update local state
      setReorderedSets((prev) => {
        const currentSets = prev || initialSetConfigs;
        return currentSets.map((set, i) =>
          i === setIdx ? { ...set, status: "complete" } : set
        );
      });
    },
    [initialSetConfigs]
  );

  const cardStatus = allComplete ? "complete" : "default";
  const cardWrapperClass = cn({});

  return (
    <CardWrapper
      ref={ref}
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
    >
      <div className={cn("w-full bg-white flex flex-col justify-start items-start")}> 
        {/* Label Section */}
        <div className="self-stretch h-16 px-3 inline-flex justify-start items-center gap-2">
          <div className="flex-1 flex flex-col">
            <div className="text-neutral-600 text-lg font-medium leading-tight">
              {exerciseName}
            </div>
            <div className="text-neutral-400 text-sm font-medium leading-none">
              {sets.length} {sets.length === 1 ? "set" : "sets"}
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
            <div className={`w-full px-3 flex flex-col justify-start gap-3 ${isFocused ? 'pb-3' : ''}`}>
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
              <div className="self-stretch text-left text-neutral-400 text-sm font-medium leading-none py-2">
                Tap to edit set. Swipe to complete.
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
  index: PropTypes.number,
  focusedIndex: PropTypes.number,
  totalCards: PropTypes.number,
  isCompleted: PropTypes.bool,
  demo: PropTypes.bool,
};

export default DemoActiveExerciseCard; 