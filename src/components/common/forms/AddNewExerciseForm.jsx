import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import ToggleInput from "@/components/molecules/toggle-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import useSetConfig from "@/hooks/use-set-config";
import SetBuilderForm from "./SetBuilderForm";
import FormSectionWrapper from "./wrappers/FormSectionWrapper";
import { Minus, Plus } from "lucide-react";

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
      disabled = false,
    },
    ref
  ) => {
    /* ------------------------------------------------------------------ */
    //  Local state – name & set config hook
    /* ------------------------------------------------------------------ */
    // Store the last used key to detect when to re-initialize
    const lastKeyRef = React.useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [exerciseName, setExerciseName] = useState(initialName);
    const [section, setSection] = useState(initialSection);
    const initialNameRef = React.useRef(initialName);
    const initialSectionRef = React.useRef(initialSection);
    const initialUpdateTypeRef = React.useRef(updateType);
    const lastInitialSetConfigsRef = React.useRef(initialSetConfigs);

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

    // Initialize useSetConfig with the correct number of sets
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

    // Set isInitialized to true on first mount
    useEffect(() => {
      setIsInitialized(true);
    }, []);

    // Merge incoming per-set configs into hook state on mount
    useEffect(() => {
      // Only run this effect if initialSetConfigs has actually changed
      const currentConfigsString = JSON.stringify(initialSetConfigs);
      const lastConfigsString = JSON.stringify(lastInitialSetConfigsRef.current);
      
      if (currentConfigsString === lastConfigsString) {
        return; // No change, don't run the effect
      }
      
      lastInitialSetConfigsRef.current = initialSetConfigs;
      
      if (initialSetConfigs.length > 0) {
        initialSetConfigs.forEach((cfg, idx) => {
          Object.entries(cfg).forEach(([k, v]) => updateSetField(idx, k, v));
          
          // Ensure each set has a proper set_variant name
          if (!cfg.set_variant) {
            updateSetField(idx, 'set_variant', `Set ${idx + 1}`);
          }
        });
      }
      
      onDirtyChange?.(false);
    }, [initialSetConfigs]);

    useEffect(() => {
      if (!isInitialized) return;

      const nameFilled = exerciseName.trim() !== "";
      const nameDirty = exerciseName.trim() !== initialNameRef.current.trim();
      const sectionDirty = section !== initialSectionRef.current;
      const updateTypeDirty = updateType !== initialUpdateTypeRef.current;
      // Detect if number of sets changed
      const setsCountDirty = sets.length !== initialSetConfigs.length;
      // Detect if any set's config changed
      const setDirty = sets.some((set, idx) => {
        return (
          JSON.stringify(set) !==
          JSON.stringify(initialSetConfigs[idx] || {})
        );
      });
      // Ready to save/add only when a name is present AND either the name changed, section changed, or sets changed
      onDirtyChange?.(nameFilled && (nameDirty || sectionDirty || setDirty || setsCountDirty || updateTypeDirty));
    }, [exerciseName, section, sets, onDirtyChange, isInitialized, updateType, initialSetConfigs]);

    /* ------------------------------------------------------------------ */
    //  Derived values & helpers
    /* ------------------------------------------------------------------ */

    const setsCount = sets.length;

    const [addType, setAddType] = useState("today");



    /* ------------------------------------------------------------------ */
    //  Save / cancel
    /* ------------------------------------------------------------------ */

    const handleSave = (e) => {
      e.preventDefault();

      if (!exerciseName.trim()) {
        alert("Exercise name is required.");
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
      console.log('[DEBUG] Final setConfigs with set_variant names:', setConfigs.map((set, idx) => ({ 
        index: idx, 
        set_variant: set.set_variant, 
        id: set.id,
        routine_set_id: set.routine_set_id 
      })));

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
            disabled={disabled}
          />
          <ToggleInput
            value={section}
            onValueChange={(value) => value && setSection(value)}
            options={[
              { label: "Warmup", value: "warmup" },
              { label: "Training", value: "training" },
              { label: "Cooldown", value: "cooldown" },
            ]}
            disabled={disabled}
          />
          
          {/* Sets control */}
          <div className="flex flex-col gap-2">
            <div className="self-stretch h-12 bg-white rounded outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex justify-start items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  console.log('[DEBUG] Remove button clicked, current setsCount:', setsCount);
                  if (setsCount > 1) {
                    console.log('[DEBUG] Calling removeLastSet');
                    removeLastSet();
                  } else {
                    console.log('[DEBUG] Remove button disabled, setsCount <= 1');
                  }
                }}
                disabled={setsCount <= 1}
                className="flex-1 self-stretch border-r border-neutral-300 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex-1 inline-flex flex-col justify-center items-start gap-1">
                <div className="self-stretch text-center justify-start text-slate-600 text-base font-medium leading-tight">
                  {setsCount.toString().padStart(2, '0')}
                </div>
                <div className="self-stretch text-center justify-start text-slate-500 text-sm font-medium leading-tight">
                  Sets
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  console.log('[DEBUG] Add button clicked, current setsCount:', setsCount);
                  console.log('[DEBUG] Calling addSet');
                  addSet();
                }}
                className="flex-1 self-stretch border-l border-neutral-300 flex justify-center items-center"
              >
                <Plus className="w-5 h-5 text-slate-600" />
              </button>
            </div>
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
              disabled={disabled || setsCount === 1}
            />
          </FormSectionWrapper>
        )}

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