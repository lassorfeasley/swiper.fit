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
//
// SET REORDERING FUNCTIONALITY:
// This component now manages set reordering responsibilities:
// - Internal state for reordered sets (reorderedSets)
// - Optimistic UI updates for immediate feedback
// - Parent callback (onSetReorder) for local state updates only
// - Automatic reset when parent data changes
// - Error handling with rollback on failure
// - NOTE: Reordering only updates local state to prevent infinite loops
// ==========================================
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import SwipeSwitch from "./SwipeSwitch";
import { ANIMATION_DURATIONS } from "@/lib/scrollSnap";
import { toast } from "@/lib/toastReplacement";
import { useWorkoutNavigation } from "@/contexts/WorkoutNavigationContext";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CardWrapper from "@/components/shared/cards/wrappers/CardWrapper";

export const CARD_ANIMATION_DURATION_MS = 500;

interface ActiveExerciseCardProps {
  exerciseId: string | number;
  workoutExerciseId?: string | number;
  exerciseName: string;
  initialSetConfigs?: any[];
  onSetComplete?: (setId: string, data: any) => void;
  onSetDataChange?: (setId: string, data: any) => void;
  onExerciseComplete?: (exerciseId: string | number) => void;
  isUnscheduled?: boolean;
  onSetProgrammaticUpdate?: (setId: string, data: any) => void;
  isFocused?: boolean;
  isExpanded?: boolean;
  onFocus?: (exerciseId: string | number) => void;
  onSetPress?: (setConfig: any, index: number) => void;
  onEditExercise?: (exerciseId: string | number) => void;
  onSetReorder?: (exerciseId: string | number, reorderedSets: any[]) => void;
  index?: number;
  focusedIndex?: number;
  totalCards?: number;
  topOffset?: number;
  isFirstCard?: boolean;
  isCompleted?: boolean;
  demo?: boolean;
}

const ActiveExerciseCard = React.forwardRef<HTMLDivElement, ActiveExerciseCardProps>(({
  exerciseId,
  workoutExerciseId,
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
  onSetReorder,
  index,
  focusedIndex,
  totalCards,
  topOffset,
  isFirstCard,
  isCompleted = false,
  demo = false,
}, ref) => {
  const { setSwipeAnimationRunning } = useWorkoutNavigation();
  const focusId = workoutExerciseId ?? exerciseId;

  const mountedRef = useRef(true);
  const setsRef = useRef([]);

  // Internal state for managing reordered sets
  const [reorderedSets, setReorderedSets] = useState(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

  // Reset reordered sets when initialSetConfigs change (from parent)
  useEffect(() => {
    setReorderedSets(null);
  }, [initialSetConfigs]);

  const allComplete = useMemo(
    () => isCompleted || sets.every((set) => set.status === "complete"),
    [sets, isCompleted]
  );

  // Handle set reordering - this is the new responsibility delegated to the card
  const handleSetReorder = useCallback((fromIndex, toIndex) => {
    if (!mountedRef.current) return;

    const newOrder = [...sets];
    const [movedSet] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedSet);

    // Update internal state immediately for optimistic UI update
    setReorderedSets(newOrder);

    // Notify parent of the reorder for database persistence
    if (onSetReorder) {
      Promise.resolve(
        onSetReorder(workoutExerciseId ?? exerciseId, newOrder)
      ).catch((error) => {
        console.error('Failed to persist set reorder:', error);
        // Revert optimistic update on error
        setReorderedSets(null);
      });
    }
  }, [exerciseId, sets, onSetReorder]);

  const handleSetComplete = useCallback(
    async (setIdx) => {
      if (!mountedRef.current) return;

        const setToComplete = { ...sets[setIdx] };

      // Call onSetComplete for the parent to handle
      if (onSetComplete) {
        try {
          await onSetComplete(String(exerciseId), { ...setToComplete, status: "complete" });
        } catch (error) {
          console.error('Failed to save set:', error);
          toast.error('Failed to save set. Please check your connection and try again.');
          // Don't proceed with exercise completion if save failed
          return;
        }
      }

      // After updating the set's status, check if all sets for this exercise are now complete.
      // We need to account for the update that's in-flight.
      const allSetsNowComplete = setsRef.current.every((s, i) => {
        if (i === setIdx) return true; // The current set is now complete
        return s.status === "complete";
      });

      if (allSetsNowComplete) {
        // Tell navigation to block focus changes while swipe animation runs
        setSwipeAnimationRunning(true);
        // Defer card transition until after the swipe-switch visual completion finishes.
        // We rely on SwipeSwitch's onVisualComplete callback (wired below) to call this.
        // As a safety fallback in case the animation callback doesn't fire, also set a timeout.
        const fallback = setTimeout(() => {
          // Apply the extra post-complete delay even in fallback
          setTimeout(() => {
            onExerciseComplete?.(focusId);
            setSwipeAnimationRunning(false);
          }, ANIMATION_DURATIONS.EXTRA_POST_COMPLETE_DELAY_MS);
        }, ANIMATION_DURATIONS.SWIPE_COMPLETE_ANIMATION_MS);
        pendingOpenNextRef.current = () => {
          clearTimeout(fallback);
          setTimeout(() => {
            onExerciseComplete?.(focusId);
            setSwipeAnimationRunning(false);
          }, ANIMATION_DURATIONS.EXTRA_POST_COMPLETE_DELAY_MS);
        };
      }
    },
    [exerciseId, onSetComplete, sets, onExerciseComplete, setSwipeAnimationRunning]
  );

  // Ref that holds a pending opener to the next card, fired when the visual completes
  const pendingOpenNextRef = useRef(null);

  const cardStatus = allComplete ? "complete" : "default";

  const cardWrapperClass = cn({
    // Ensure drop shadow is never clipped
  });

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
      ref={(node) => {
        cardRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      reorderable={false}
      className={cardWrapperClass}
      id={`exercise-${exerciseId}`}
      data-exercise-card="true" data-exercise-id={exerciseId}
      status={cardStatus}
      onClick={() => {
        if (isFocused) {
          onEditExercise?.(exerciseId);
        } else {
          onFocus?.(focusId);
        }
      }}
      index={index}
      focusedIndex={focusedIndex}
      totalCards={totalCards}
      style={{ touchAction: isFocused ? 'pan-x' : 'auto', overscrollBehaviorY: isFocused ? 'contain' : 'auto' }}
    >
        <div
          className={cn(
            "w-full bg-white rounded-lg border border-neutral-300 inline-flex flex-col justify-center items-center overflow-hidden"
          )}
        >
          <div className={cn("self-stretch p-3 flex flex-col justify-start items-start")}>
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
                <div className={`w-full flex flex-col justify-start gap-5 pt-5`}>
                  {sets.map((set, index) => (
                    <SwipeSwitch
                      key={set.routine_set_id || set.tempId || set.id || `exercise-${exerciseId}-set-${index}`}
                      set={set}
                      onComplete={() => handleSetComplete(index)}
                      onVisualComplete={() => {
                        // If this was the last incomplete set, and we scheduled a transition, execute it now
                        if (pendingOpenNextRef.current) {
                          const fn = pendingOpenNextRef.current;
                          pendingOpenNextRef.current = null;
                          fn();
                        }
                      }}
                      onClick={() => {
                        if (onSetPress) {
                          onSetPress(set, index);
                        }
                      }}
                      className="w-full"
                      demo={demo}
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

export default ActiveExerciseCard; 