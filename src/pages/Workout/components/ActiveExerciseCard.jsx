// AI-ASSISTANT-POLICY: STYLING LOCKED
// ==========================================
// ATTENTION AI ASSISTANT:
// Do not modify the styling of this component without explicit user instruction.
// This component's visual appearance has been finalized and approved.
// Any general refactoring or styling updates, especially those based on
// external tools like Figma, should NOT alter the CSS classes, inline styles,
// or other style-related code in this file.
//
// Before making any style changes, confirm directly with the user.
// ==========================================
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import SwipeSwitch from "./swipe-switch";
import PropTypes from "prop-types";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const CARD_ANIMATION_DURATION_MS = 500;

const ActiveExerciseCard = React.forwardRef(({
  exerciseId,
  exerciseName,
  initialSetConfigs = [],
  onSetComplete,
  onSetDataChange,
  onExerciseComplete,
  isUnscheduled,
  onSetProgrammaticUpdate,
  isFocused,
  isExpanded,
  onFocus,
  onSetPress,
  onEditExercise,
  index,
  focusedIndex,
  totalCards,
  topOffset,
}, ref) => {

  const mountedRef = useRef(true);
  const setsRef = useRef([]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Use initialSetConfigs directly as sets
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
    () => sets.every((set) => set.status === "complete"),
    [sets]
  );

  const handleSetComplete = useCallback(
    async (setIdx) => {
      if (!mountedRef.current) return;

      const setToComplete = { ...sets[setIdx] };

      // Call onSetComplete for the parent to handle
      if (onSetComplete) {
        Promise.resolve(
          onSetComplete(exerciseId, { ...setToComplete, status: "complete" })
        ).catch(console.error);
      }

      // After updating the set's status, check if all sets for this exercise are now complete.
      // We need to account for the update that's in-flight.
      const allSetsNowComplete = setsRef.current.every((s, i) => {
        if (i === setIdx) return true; // The current set is now complete
        return s.status === "complete";
      });

      if (allSetsNowComplete) {
        onExerciseComplete?.(exerciseId);
      }
    },
    [exerciseId, onSetComplete, sets, onExerciseComplete]
  );

  const cardStatus = allComplete ? "complete" : "default";

  const cardWrapperClass = cn({
    // Ensure drop shadow is never clipped
  });

  return (
    <CardWrapper
      ref={ref}
      reorderable={false}
      className={cardWrapperClass}
      id={`exercise-${exerciseId}`}
      data-exercise-card="true"
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
      <div
        className={cn(
          "w-full bg-white",
          index !== 0 && index !== totalCards - 1 && "border-l border-r border-neutral-300"
        )}
      >
        <div
          className={cn(
            "w-full bg-white flex flex-col justify-start items-start rounded-t-lg",
            index === totalCards - 1 && "rounded-b-lg",
            "shadow-[0px_0px_4px_0px_rgba(212,212,212,1)]",
            index === totalCards - 1
              ? "border border-neutral-300"
              : "border-t border-l border-r border-neutral-300"
          )}
          style={index !== 0 ? { width: 'calc(100% + 2px)', marginLeft: '-1px' } : {}}
        >
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
                  <SwipeSwitch
                    key={`${set.id || set.tempId || set.routine_set_id || "set"}-${index}`}
                    set={set}
                    onComplete={() => handleSetComplete(index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSetPress) {
                        onSetPress(set, index);
                      }
                    }}
                    className="w-full"
                  />
                ))}
                <div className="self-stretch text-left text-neutral-400 text-sm font-medium leading-none py-2">
                  Tap to edit set. Swipe to complete.
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </CardWrapper>
  );
});

ActiveExerciseCard.propTypes = {
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  exerciseName: PropTypes.string.isRequired,
  initialSetConfigs: PropTypes.array,
  onSetComplete: PropTypes.func,
  onSetDataChange: PropTypes.func,
  onExerciseComplete: PropTypes.func,
  isUnscheduled: PropTypes.bool,
  onSetProgrammaticUpdate: PropTypes.func,
  isFocused: PropTypes.bool,
  isExpanded: PropTypes.bool,
  onFocus: PropTypes.func,
  onSetPress: PropTypes.func,
  onEditExercise: PropTypes.func,
  index: PropTypes.number,
  focusedIndex: PropTypes.number,
  totalCards: PropTypes.number,
  topOffset: PropTypes.number,
};

export default ActiveExerciseCard; 