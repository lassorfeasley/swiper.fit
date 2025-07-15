import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import ToggleInput from "@/components/molecules/toggle-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import useSetConfig from "@/hooks/use-set-config";
import SetBuilderForm from "./SetBuilderForm";
import { FormHeader } from "@/components/atoms/sheet";
import { Repeat2, Timer, Weight as WeightIcon } from "lucide-react";
import FormSectionWrapper from "./wrappers/FormSectionWrapper";

const AddNewExerciseForm = React.forwardRef(
  (
    {
      onActionIconClick,
      onDelete,
      formPrompt = "Add to program",
      initialName = "",
      initialSets = 3,
      initialSection = "training",
      initialSetConfigs = [],
      onDirtyChange,
      hideActionButtons = false,
      showAddToProgramToggle = true,
      showUpdateTypeToggle = false,
      updateType = "today",
      onUpdateTypeChange,
      onEditSet,
      onSetsConfigChange,
    },
    ref
  ) => {
    /* ------------------------------------------------------------------ */
    //  Local state – name & set config hook
    /* ------------------------------------------------------------------ */
    const [isInitialized, setIsInitialized] = useState(false);
    const [exerciseName, setExerciseName] = useState(initialName);
    const [section, setSection] = useState(initialSection);
    const initialNameRef = React.useRef(initialName);
    const initialUpdateTypeRef = React.useRef(updateType);

    // Build initial defaults from the first supplied set config (if any)
    const initialDefaults = initialSetConfigs[0]
      ? {
          set_type: initialSetConfigs[0].set_type ?? "reps",
          reps: initialSetConfigs[0].reps ?? 12,
          timed_set_duration: initialSetConfigs[0].timed_set_duration ?? 30,
          weight: initialSetConfigs[0].weight ?? 25,
          unit: initialSetConfigs[0].unit ?? "lbs",
        }
      : undefined;

    const {
      defaults,
      sets,
      updateDefault: _updateDefault,
      updateSetField,
      getSetMerged,
      addSet,
      removeLastSet,
    } = useSetConfig(initialSets, initialDefaults);

    // Wrapper to keep single-set exercises in sync with defaults
    const updateDefault = (field, value) => {
      _updateDefault(field, value);
      if (sets.length === 1) {
        updateSetField(0, field, value);
      }
    };

    // Merge incoming per-set configs into hook state on mount
    useEffect(() => {
      if (initialSetConfigs.length > 0) {
        initialSetConfigs.forEach((cfg, idx) => {
          Object.entries(cfg).forEach(([k, v]) => updateSetField(idx, k, v));
        });
      }
      onDirtyChange?.(false);
      setIsInitialized(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialSetConfigs]);

    useEffect(() => {
      if (!isInitialized) return;

      const nameFilled = exerciseName.trim() !== "";
      const nameDirty = exerciseName.trim() !== initialNameRef.current.trim();
      const updateTypeDirty = updateType !== initialUpdateTypeRef.current;
      // Detect if number of sets changed
      const setsCountDirty = sets.length !== initialSetConfigs.length;
      // Detect if any set's config changed
      const setDirty =
        setsCountDirty ||
        sets.some((set, idx) => {
          return (
            JSON.stringify(set) !==
            JSON.stringify(initialSetConfigs[idx] || {})
          );
        });
      // Ready to save/add only when a name is present AND either the name changed or sets changed
      onDirtyChange?.(nameFilled && (nameDirty || setDirty || updateTypeDirty));
    }, [exerciseName, sets, onDirtyChange, isInitialized, updateType, initialSetConfigs]);

    /* ------------------------------------------------------------------ */
    //  Derived values & helpers
    /* ------------------------------------------------------------------ */

    const setsCount = sets.length;

    const handleSetsChange = (val) => {
      if (val > setsCount) {
        Array.from({ length: val - setsCount }).forEach(() => addSet());
      } else if (val < setsCount) {
        Array.from({ length: setsCount - val }).forEach(() => removeLastSet());
      }
    };

    const [addType, setAddType] = useState("today");

    /* ------------------------------------------------------------------ */
    //  Per-set editor sheet
    /* ------------------------------------------------------------------ */

    const openEditSheet = (idx) => {
      onEditSet?.(idx, getSetMerged(idx));
    };

    /* ------------------------------------------------------------------ */
    //  Save / cancel
    /* ------------------------------------------------------------------ */

    const handleSave = (e) => {
      e.preventDefault();

      if (!exerciseName.trim()) {
        alert("Exercise name is required.");
        return;
      }

      if (setsCount < 1) {
        alert("At least one set is required.");
        return;
      }

      // When editing an existing exercise, preserve database identifiers
      const setConfigs = sets.map((_, idx) => {
        const merged = getSetMerged(idx);
        const originalConfig = initialSetConfigs[idx];
        
        // If editing an existing exercise, preserve important database fields
        if (originalConfig) {
          const result = {
            ...merged,
            // Preserve database identifiers when they exist
            ...(originalConfig.id && { id: originalConfig.id }),
            ...(originalConfig.routine_set_id && { routine_set_id: originalConfig.routine_set_id }),
          };
          console.log(`[DEBUG] Preserved set ${idx}:`, { original: originalConfig, result });
          return result;
        }
        
        console.log(`[DEBUG] New set ${idx}:`, merged);
        return merged;
      });

      console.log('[DEBUG] Final setConfigs for save:', setConfigs);

      if (onActionIconClick) {
        onActionIconClick(
          {
            name: exerciseName.trim(),
            section,
            sets: setsCount,
            setConfigs,
          },
          addType
        );
      }
    };

    /* ------------------------------------------------------------------ */
    //  Render helpers
    /* ------------------------------------------------------------------ */

    const SetCard = ({ idx }) => {
      const merged = getSetMerged(idx);
      const isTimed = merged.set_type === "timed";

      return (
        <div
          key={idx}
          className="w-full rounded-sm flex justify-between items-center bg-white cursor-pointer p-4 border border-neutral-300 hover:border-neutral-400"
          onClick={() => openEditSheet(idx)}
        >
          <span className="text-slate-600 text-label font-normal leading-none">
            {sets[idx].set_variant || `Set ${idx + 1}`}
          </span>
          <div className="bg-neutral-300 flex rounded-sm outline outline-1 outline-neutral-300 ">
            <div className=" bg-neutral-100 flex items-center gap-0.5 p-2">
              {isTimed ? (
                <Timer className="size-4 text-neutral-500" strokeWidth={1.5} />
              ) : (
                <Repeat2
                  className="size-4 text-neutral-500"
                  strokeWidth={1.5}
                />
              )}
              <span className="text-neutral-500 text-heading-sm font-medium leading-tight">
                {isTimed ? merged.timed_set_duration : merged.reps}
              </span>
            </div>
            <div className=" bg-neutral-100 flex items-center gap-0.5 border-l border-neutral-300 p-2">
              <WeightIcon
                className="size-4 text-neutral-500"
                strokeWidth={1.5}
              />
              <span className="text-neutral-500 text-heading-sm font-medium leading-tight">
                {merged.unit === "body" ? "BW" : merged.weight}
              </span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <form
        ref={ref}
        className="w-full box-border inline-flex flex-col gap-0"
        onSubmit={handleSave}
      >
        {/* Exercise name & sets */}
        <FormSectionWrapper className="border-b border-neutral-300 py-4 px-4">
          <TextInput
            label="Exercise name"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            customPlaceholder=""
          />
          <ToggleInput
            value={section}
            onValueChange={(value) => value && setSection(value)}
            options={[
              { label: "Warmup", value: "warmup" },
              { label: "Training", value: "training" },
              { label: "Cooldown", value: "cooldown" },
            ]}
          />
          <div className="flex flex-col gap-1">
            <NumericInput
              value={setsCount}
              onChange={handleSetsChange}
              min={1}
              max={10}
              className="w-full"
              unitLabel="Sets"
            />
          </div>

          {/* Add to program toggle */}
          {showAddToProgramToggle && (
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-slate-600 text-label">Add to program?</span>
              <ToggleInput
                options={[
                  { label: "Just for today", value: "today" },
                  { label: "Permanently", value: "future" },
                ]}
                value={addType}
                onValueChange={(val) => val && setAddType(val)}
              />
            </div>
          )}
        </FormSectionWrapper>

        {/* Set config defaults (only when adding new exercise) */}
        {showAddToProgramToggle && (
          <FormSectionWrapper className="border-b border-neutral-300 py-4 px-4">
            <SetBuilderForm
              initialDefaults={defaults}
              onDefaultsChange={updateDefault}
              disabled={setsCount === 1}
            />
          </FormSectionWrapper>
        )}

        {/* Set list */}
        <FormSectionWrapper className="border-b border-neutral-300 py-4 px-4">
          <div className="text-sm font-medium text-neutral-600">Sets</div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: setsCount }).map((_, idx) => (
              <SetCard key={idx} idx={idx} />
            ))}
          </div>
        </FormSectionWrapper>

        {/* Keep new settings toggle (Edit Exercise only) */}
        {showUpdateTypeToggle && (
          <FormSectionWrapper className="border-b border-neutral-300 py-4 px-4">
            <ToggleInput
              key="updateTypeToggle"
              label="Keep new settings?"
              value={updateType}
              onValueChange={onUpdateTypeChange}
              options={[
                { label: "Just for today", value: "today" },
                { label: "Permanently", value: "future" },
              ]}
            />
          </FormSectionWrapper>
        )}

        {onDelete && !hideActionButtons && (
          <FormSectionWrapper className="px-4 pb-4">
            <SwiperButton
              variant="destructive"
              onClick={onDelete}
              className="w-full"
            >
              Delete exercise
            </SwiperButton>
          </FormSectionWrapper>
        )}

        {!hideActionButtons && (
          <FormSectionWrapper className="px-4 pb-4">
            <SwiperButton
              type="submit"
              variant="default"
              disabled={!exerciseName.trim()}
              className={`w-full ${
                exerciseName.trim()
                  ? "!bg-green-600 hover:!bg-green-500"
                  : "!bg-neutral-300"
              }`}
            >
              {onDelete ? "Save changes" : "Add exercise"}
            </SwiperButton>
          </FormSectionWrapper>
        )}
      </form>
    );
  }
);

AddNewExerciseForm.propTypes = {
  onActionIconClick: PropTypes.func,
  onDelete: PropTypes.func,
  formPrompt: PropTypes.string,
  initialName: PropTypes.string,
  initialSets: PropTypes.number,
  initialSection: PropTypes.string,
  initialSetConfigs: PropTypes.array,
  onDirtyChange: PropTypes.func,
  hideActionButtons: PropTypes.bool,
  showAddToProgramToggle: PropTypes.bool,
  showUpdateTypeToggle: PropTypes.bool,
  updateType: PropTypes.string,
  onUpdateTypeChange: PropTypes.func,
  onEditSet: PropTypes.func,
  onSetsConfigChange: PropTypes.func,
};

AddNewExerciseForm.displayName = "AddNewExerciseForm";

export default AddNewExerciseForm;
