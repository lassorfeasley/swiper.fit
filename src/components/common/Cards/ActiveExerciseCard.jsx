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
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/atoms/sheet";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import SetEditForm from "@/components/common/forms/SetEditForm";
import WeightCompoundField from "@/components/common/forms/WeightCompoundField";
import NumericInput from "@/components/molecules/numeric-input";
import PropTypes from "prop-types";
import { Maximize2, Minimize2 } from "lucide-react";
import CardWrapper from "@/components/common/Cards/Wrappers/CardWrapper";
import SetBadge from "@/components/molecules/SetBadge";

const ActiveExerciseCard = ({
  exerciseId,
  exerciseName,
  initialSetConfigs = [],
  onSetComplete,
  onSetDataChange,
  isUnscheduled,
  default_view = true,
  setData = [],
  onSetProgrammaticUpdate,
}) => {
  const [isExpanded, setIsExpanded] = useState(
    !default_view && initialSetConfigs.length > 1
  );
  const [openSetIndex, setOpenSetIndex] = useState(null);
  const [editForm, setEditForm] = useState({ reps: 0, weight: 0, unit: "lbs" });
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Derive sets from setData and initialSetConfigs
  const sets = useMemo(() => {
    const combined = initialSetConfigs.map((config, i) => {
      const fromParent = setData.find(
        (d) =>
          (d.id && d.id === config.id) ||
          (d.program_set_id && d.program_set_id === config.id) ||
          d.set_order === config.set_order
      ) || {};
      
      const id = fromParent.id || config.id;
      const tempId = `temp-${i}`;

      return {
        ...config,
        ...fromParent,
        id: id || tempId,
        tempId: id ? null : tempId,
        reps: fromParent.reps ?? config.reps,
        weight: fromParent.weight ?? config.weight,
        unit: fromParent.unit ?? config.weight_unit ?? "lbs",
        status: fromParent.status || "pending",
        set_variant: fromParent.set_variant || config.set_variant || `Set ${i + 1}`,
        program_set_id: fromParent.program_set_id || config.id
      };
    });

    if (combined.length > 0 && !combined.some(s => s.status === 'active')) {
      const firstPending = combined.find(s => s.status === 'pending');
      if (firstPending) {
        firstPending.status = 'active';
      }
    }
    return combined;
  }, [initialSetConfigs, setData]);

  const allComplete = useMemo(
    () => sets.every((set) => set.status === "complete"),
    [sets]
  );
  const anyActive = useMemo(
    () =>
      sets.some(
        (set) => set.status === "active" || set.status === "ready-timed-set"
      ),
    [sets]
  );
  const activeSet = useMemo(
    () =>
      sets.find(
        (set) => set.status === "active" || set.status === "ready-timed-set"
      ) || (sets.length > 0 ? sets[0] : undefined),
    [sets]
  );
  const swipeStatus = useMemo(
    () => (allComplete ? "complete" : anyActive ? "active" : "locked"),
    [allComplete, anyActive]
  );

  const handleSetComplete = useCallback(
    async (setIdx) => {
      if (!mountedRef.current) return;

      const setToComplete = { ...sets[setIdx] };
      const nextSet = sets[setIdx + 1];

      // First, call onSetComplete for analytics if it exists.
      if (onSetComplete) {
        // For a timed set starting, we don't mark it complete yet.
        // For all others, we do.
        if (
          setToComplete.set_type !== "timed" ||
          setToComplete.status !== "ready-timed-set"
        ) {
          Promise.resolve(
            onSetComplete(exerciseId, { ...setToComplete, status: "complete" })
          ).catch(console.error);
        }
      }

      if (!onSetDataChange) return;

      const updates = [];
      if (setToComplete.set_type === "timed") {
        if (setToComplete.status === "ready-timed-set") {
          // Transition to counting down
          updates.push({
            id: setToComplete.id,
            changes: { status: "counting-down-timed" },
          });
        } else if (setToComplete.status === "counting-down-timed") {
          // Timer finished, mark as complete and persist set_type and timed_set_duration
          updates.push({
            id: setToComplete.id,
            changes: {
              status: "complete",
              set_type: setToComplete.set_type,
              timed_set_duration: setToComplete.timed_set_duration,
            },
          });
          if (nextSet && nextSet.status === "locked") {
            updates.push({ id: nextSet.id, changes: { status: "active" } });
          }
        }
      } else {
        // For regular sets, just mark as complete
        updates.push({ id: setToComplete.id, changes: { status: "complete" } });
        if (nextSet && nextSet.status === "locked") {
          updates.push({ id: nextSet.id, changes: { status: "active" } });
        }
      }

      if (updates.length > 0) {
        Promise.resolve(onSetDataChange(exerciseId, updates)).catch(
          console.error
        );
      }
    },
    [exerciseId, onSetComplete, onSetDataChange, sets]
  );

  const handleActiveSetComplete = useCallback(async () => {
    if (!mountedRef.current) return;

    if (onSetComplete) {
      sets.forEach((set) => {
        if (set.status !== "complete") {
          Promise.resolve(
            onSetComplete(exerciseId, { ...set, status: "complete" })
          ).catch(console.error);
        }
      });
    }

    if (onSetDataChange) {
      const updates = sets
        .filter((set) => set.status !== "complete")
        .map((set) => ({ id: set.id, changes: { status: "complete" } }));

      if (updates.length > 0) {
        Promise.resolve(onSetDataChange(exerciseId, updates)).catch(
          console.error
        );
      }
    }
  }, [exerciseId, onSetComplete, onSetDataChange, sets]);

  const handlePillClick = useCallback(
    (idx) => {
      if (!mountedRef.current) return;
      const set = sets[idx];
      setEditForm({
        reps: set.reps,
        weight: set.weight,
        unit: set.unit,
        set_type: set.set_type || initialSetConfigs[idx]?.set_type || "reps",
        timed_set_duration:
          set.timed_set_duration ||
          initialSetConfigs[idx]?.timed_set_duration ||
          30,
        set_variant: set.set_variant || set.name,
      });
      setOpenSetIndex(idx);
      setIsEditSheetOpen(true);
    },
    [sets, initialSetConfigs]
  );

  const handleEditFormSave = useCallback(
    async (formValues) => {
      if (!mountedRef.current || openSetIndex === null) return;

      const set_to_update = sets[openSetIndex];
      const set_id_to_update = set_to_update.id;
      const newStatus = formValues.completed ? "complete" : set_to_update.status;

      if (!set_id_to_update.toString().startsWith("temp-")) {
        const updates = [
          {
            id: set_id_to_update,
            changes: {
              reps: formValues.reps,
              weight: formValues.weight,
              weight_unit: formValues.unit,
              set_variant: formValues.set_variant,
              set_type: formValues.set_type,
              timed_set_duration:
                formValues.set_type === "timed"
                  ? formValues.timed_set_duration
                  : undefined,
              ...(newStatus !== set_to_update.status ? { status: newStatus } : {}),
            },
          },
        ];

        if (onSetDataChange) {
          Promise.resolve(onSetDataChange(exerciseId, updates)).catch(
            console.error
          );
        }
      }

      setOpenSetIndex(null);
      setIsEditSheetOpen(false);
    },
    [exerciseId, onSetDataChange, openSetIndex, sets]
  );

  const handleEditFormSaveForFuture = useCallback(
    async (formValues) => {
      if (!mountedRef.current || openSetIndex === null) return;

      // First, save the changes for today
      handleEditFormSave(formValues);

      // Then, call the programmatic update function if it exists
      if (onSetProgrammaticUpdate) {
        const set_to_update = sets[openSetIndex];
        onSetProgrammaticUpdate(exerciseId, set_to_update.program_set_id, formValues);
      }
    },
    [
      exerciseId,
      openSetIndex,
      sets,
      handleEditFormSave,
      onSetProgrammaticUpdate,
    ]
  );

  // If expanded view is true, render the detailed view
  if (isExpanded && initialSetConfigs.length > 1) {
    return (
      <CardWrapper
        className="Property1Expanded self-stretch bg-white rounded-xl flex flex-col justify-start items-stretch gap-0"
        style={{ maxWidth: 500 }}
      >
        <div className="Labelandexpand self-stretch p-3 inline-flex justify-start items-start overflow-hidden">
          <div className="Label flex-1 inline-flex flex-col justify-start items-start">
            <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">
              {exerciseName}
            </div>
            <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
              {sets.length === 1
                ? "One set"
                : sets.length === 2
                ? "Two sets"
                : sets.length === 3
                ? "Three sets"
                : `${sets.length} sets`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="SortDescending size-7 relative overflow-hidden"
          >
            <Minimize2 className="w-6 h-5 left-[3px] top-[4.50px] absolute text-neutral-400" />
          </button>
        </div>
        <div className="self-stretch h-0 border-b border-stone-200" />
        {sets.map((set, idx) => {
          const setType = set.set_type || "reps";
          const timedDuration = set.timed_set_duration;
          let swipeStatus = set.status;
          if (setType === "timed") {
            // No need to modify swipeStatus here as it's already set correctly in the sets useMemo
          }
          const isLastSet = idx === sets.length - 1;
          return (
            <div
              key={`${set.id ?? `temp-${idx}`}-${idx}`}
              className={`SetsLog self-stretch p-3 bg-white flex flex-col justify-start items-start gap-2 ${
                !isLastSet ? "border-b border-stone-200" : ""
              }`}
            >
              <div className="Setrepsweightwrapper self-stretch inline-flex justify-between items-center">
                <div className="SetOne justify-center text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
                  {set.set_variant || set.name}
                </div>
                <SetBadge
                  reps={set.reps}
                  weight={set.weight}
                  unit={set.unit}
                  complete={set.status === "complete"}
                  editable={true}
                  onEdit={() => handlePillClick(idx)}
                  set_type={setType}
                  timed_set_duration={timedDuration}
                  className="px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
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
          );
        })}
        {isUnscheduled && (
          <div className="text-center text-sm text-gray-500 mt-2 p-3 bg-white w-full">
            Unscheduled Exercise
          </div>
        )}
        <SwiperSheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
          <SetEditForm
            formPrompt={
              openSetIndex !== null
                ? `Edit ${sets[openSetIndex].name}`
                : "Edit set"
            }
            onSave={handleEditFormSave}
            onSaveForFuture={
              isUnscheduled ? undefined : handleEditFormSaveForFuture
            }
            initialValues={editForm}
          />
        </SwiperSheet>
      </CardWrapper>
    );
  }

  // Compact view
  return (
    <CardWrapper
      className="Property1Compact self-stretch p-3 bg-white rounded-xl inline-flex flex-col justify-start items-start gap-4"
      style={{ maxWidth: 500 }}
    >
      <div className="Labelandexpand self-stretch inline-flex justify-start items-start overflow-hidden">
        <div className="Label flex-1 inline-flex flex-col justify-start items-start">
          <div className="Workoutname self-stretch justify-start text-slate-600 text-xl font-medium font-['Space_Grotesk'] leading-normal">
            {exerciseName}
          </div>
          <div className="Setnumber self-stretch justify-start text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-tight">
            {sets.length === 1
              ? "One set"
              : sets.length === 2
              ? "Two sets"
              : sets.length === 3
              ? "Three sets"
              : `${sets.length} sets`}
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
          status={
            anyActive && activeSet?.set_type === "timed"
              ? "ready-timed-set"
              : swipeStatus
          }
          onComplete={handleActiveSetComplete}
          duration={
            activeSet?.set_type === "timed"
              ? activeSet.timed_set_duration
              : undefined
          }
        />
      </div>
      <div className="Setpillwrapper self-stretch inline-flex justify-start items-center gap-3 flex-wrap content-center overflow-hidden">
        {sets.map((set, idx) => {
          const setType = set.set_type || "reps";
          const timedDuration = set.timed_set_duration;
          return (
            <SetBadge
              key={`${set.id ?? `temp-${idx}`}-${idx}`}
              set={set}
              onClick={() => handlePillClick(idx)}
              onEdit={() => handlePillClick(idx)}
              reps={set.reps}
              weight={set.weight}
              unit={set.unit}
              complete={set.status === "complete"}
              editable={true}
              set_type={setType}
              timed_set_duration={timedDuration}
              className="px-2 py-0.5 bg-grey-200 rounded-[20px] flex justify-start items-center"
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
        <SetEditForm
          formPrompt={
            openSetIndex !== null
              ? `Edit ${sets[openSetIndex].name}`
              : "Edit set"
          }
          onSave={handleEditFormSave}
          onSaveForFuture={
            isUnscheduled ? undefined : handleEditFormSaveForFuture
          }
          initialValues={editForm}
        />
      </SwiperSheet>
    </CardWrapper>
  );
};

ActiveExerciseCard.propTypes = {
  exerciseId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
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
      status: PropTypes.oneOf([
        "active",
        "locked",
        "complete",
        "counting-down",
        "ready-timed-set",
        "counting-down-timed",
      ]),
    })
  ),
  onSetProgrammaticUpdate: PropTypes.func,
};

export default React.memo(ActiveExerciseCard);
