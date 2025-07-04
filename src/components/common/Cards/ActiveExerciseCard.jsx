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
import SwipeSwitch from "@/components/molecules/swipe-switch";
import SetEditForm from "@/components/common/forms/SetEditForm";
import PropTypes from "prop-types";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import { FormHeader } from "@/components/atoms/sheet";
import SwiperForm from "@/components/molecules/swiper-form";
import FormSectionWrapper from "../forms/wrappers/FormSectionWrapper";
import ToggleInput from "@/components/molecules/toggle-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { TextInput } from "@/components/molecules/text-input";
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
  setData = [],
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
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: 0, weight: 0, unit: "lbs" });
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [addType, setAddType] = useState("today");
  const mountedRef = useRef(true);
  const setsRef = useRef([]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Derive sets from setData and initialSetConfigs
  const sets = useMemo(() => {
    const combined = initialSetConfigs.map((config, i) => {
      // Match persisted set rows by routine_set_id from config.routine_set_id
      const fromParent = setData.find((d) => d.routine_set_id === config.routine_set_id) || {};
      // Use the database row id if present, otherwise no id (new set)
      const id = fromParent.id || null;
      // Local temporary id for unsaved sets
      const tempId = id ? null : `temp-${i}`;

      return {
        // retain template configuration
        ...config,
        // overlay persisted data
        ...fromParent,
        // id is the sets table id, tempId is for new sets
        id,
        tempId,
        // values: use persisted values or config defaults
        reps: fromParent.reps ?? config.reps,
        weight: fromParent.weight ?? config.weight,
        weight_unit:
          fromParent.weight_unit ?? fromParent.unit ?? config.weight_unit ?? "lbs",
        // status from persisted or default
        status: fromParent.status || "default",
        // set name
        set_variant: fromParent.set_variant || config.set_variant || `Set ${i + 1}`,
        // routine_set_id remains template id
        routine_set_id: config.routine_set_id,
      };
    });

    // Ensure the correct active/locked statuses after merging
    const adjusted = combined.map((set) => {
      if (set.status === "complete") return set;
      // All other sets are simply default now.
      return { ...set, status: "default" };
    });
    return adjusted;
  }, [initialSetConfigs, setData]);

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
      const nextSet = sets[setIdx + 1];

      // First, call onSetComplete for analytics if it exists.
      if (onSetComplete) {
        Promise.resolve(
          onSetComplete(exerciseId, { ...setToComplete, status: "complete" })
        ).catch(console.error);
      }

      if (!onSetDataChange) return;

      // Single-step: mark the set as complete regardless of type.
      const updates = [
        {
          id: setToComplete.id,
          changes: {
            status: "complete",
            set_variant: setToComplete.set_variant,
            routine_set_id: setToComplete.routine_set_id,
            set_type: setToComplete.set_type,
            timed_set_duration: setToComplete.timed_set_duration,
          },
        },
      ];

      // Log local set completion for clarity
      if (setToComplete.status !== "counting-down-timed") {
        console.log(
          `${setToComplete.set_variant} of ${exerciseName} logged to local.`
        );
      }

      if (updates.length > 0) {
        Promise.resolve(onSetDataChange(exerciseId, updates)).catch(
          console.error
        );
      }

      // If this was the last set in the exercise, notify completion
      if (setIdx === sets.length - 1) {
        console.log(
          `[ActiveExerciseCard] all sets complete for exercise ${exerciseName}, calling onExerciseComplete`
        );
        onExerciseComplete?.(exerciseId);
      }
    },
    [exerciseId, onSetComplete, onSetDataChange, sets, onExerciseComplete]
  );

  const openEditSheet = (index) => {
    const setToEdit = sets[index];
    setOpenSetIndex(index);
    setEditForm({
      reps: setToEdit.reps,
      weight: setToEdit.weight,
      unit: setToEdit.weight_unit,
      set_variant: setToEdit.set_variant,
      set_type: setToEdit.set_type,
      timed_set_duration: setToEdit.timed_set_duration,
      routine_set_id: setToEdit.routine_set_id, // Store routine_set_id for future use
    });
    setIsEditSheetOpen(true);
    setFormDirty(false); // Reset dirty state on open
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setFormDirty(true); // Mark form as dirty on change
  };

  const handleToggleChange = (field) => (value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    setFormDirty(true);
  };

  const handleSaveSet = async () => {
    if (!formDirty) {
      setIsEditSheetOpen(false);
      return;
    }

    const setBeingEdited = sets[openSetIndex];
    if (!setBeingEdited || !setBeingEdited.id) {
      console.error("No valid set to update.", { openSetIndex, sets });
      setIsEditSheetOpen(false);
      return;
    }

    const isProgramUpdate = addType === "future";

    if (isProgramUpdate) {
      // Logic for updating the program template
      if (onSetProgrammaticUpdate) {
        onSetProgrammaticUpdate(
          exerciseId,
          setBeingEdited.routine_set_id,
          editForm
        );
      }
    } else {
      // Existing logic for updating the current workout's set
      const updates = [
        {
          id: setBeingEdited.id,
          changes: {
            reps: editForm.reps,
            weight: editForm.weight,
            weight_unit: editForm.unit,
          },
        },
      ];
      if (onSetDataChange) {
        onSetDataChange(exerciseId, updates);
      }
    }

    setIsEditSheetOpen(false);
    setOpenSetIndex(null);
    setFormDirty(false); // Reset dirty state
  };

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
                    key={set.id || `set-${index}`}
                    set={set}
                    onComplete={() => handleSetComplete(index)}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSetPress) {
                        onSetPress(exerciseId, set, index);
                      }
                    }}
                    className="w-full"
                    reps={set.reps}
                    weight={set.weight}
                    unit={set.weight_unit}
                    status={set.status}
                    onSwipe={() => handleSetComplete(index)}
                    disabled={!isFocused}
                    countdownDuration={set.timed_set_duration}
                  />
                ))}
                <div className="self-stretch text-left text-neutral-400 text-sm font-medium leading-none py-2">
                  Tap to edit set. Swipe to complete.
                </div>
              </div>
            </div>
          </div>
        </div>

        {openSetIndex !== null && (
          <SwiperForm
            isOpen={isEditSheetOpen}
            onClose={() => setIsEditSheetOpen(false)}
          >
            <FormHeader
              title="Edit Set"
              subtitle={sets[openSetIndex]?.set_variant}
            />
              <SetEditForm
              formValues={editForm}
              onFormChange={handleEditFormChange}
              onToggleChange={handleToggleChange}
            >
              {isUnscheduled && (
                <FormSectionWrapper>
                  <p className="text-sm text-gray-500 mb-2">
                    Apply changes to this workout or update the program for future
                    workouts.
                  </p>
                <ToggleInput
                    value={addType}
                    onValueChange={setAddType}
                  options={[
                      { label: "This Workout", value: "today" },
                      { label: "This & Future", value: "future" },
                    ]}
                  />
                </FormSectionWrapper>
              )}
            </SetEditForm>
            <div className="flex space-x-2 p-4">
              <SwiperButton
                onClick={() => setIsEditSheetOpen(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </SwiperButton>
              <SwiperButton
                onClick={handleSaveSet}
                className="flex-1"
                disabled={!formDirty}
              >
                Save
              </SwiperButton>
            </div>
          </SwiperForm>
        )}
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
  setData: PropTypes.array,
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
