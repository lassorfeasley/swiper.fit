import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { MAX_EXERCISE_NAME_LEN } from "@/lib/constants";
import ToggleInput from "@/components/shared/inputs/ToggleInput";
import NumericInput from "@/components/shared/inputs/NumericInput";
import DurationInput from "@/components/shared/inputs/DurationInput";
import { SwiperButton } from "@/components/shared/SwiperButton";
import useSetConfig from "@/hooks/use-set-config";
import SetBuilderForm from "./SetBuilderForm";
import FormSectionWrapper from "@/components/shared/forms/wrappers/FormSectionWrapper";
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
      showSectionToggle = true,
      showUpdateTypeToggle = false,
      updateType = "today",
      onUpdateTypeChange,
      onEditSet,
      onSetsConfigChange,
      disabled = false,
      hideSetDefaults = false,
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
    // When editing, use the length of initialSetConfigs, otherwise use initialSets
    const effectiveInitialSets = initialSetConfigs.length > 0 ? initialSetConfigs.length : initialSets;
    const {
      defaults,
      sets,
      updateDefault: _updateDefault,
      updateSetField,
      getSetMerged,
      addSet,
      removeLastSet,
    } = useSetConfig(effectiveInitialSets, initialDefaults);

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
      <div className="w-full bg-stone-50 inline-flex flex-col justify-start items-center overflow-hidden">
        {/* Exercise name & section & sets */}
        <FormSectionWrapper className="p-5" bordered={!(hideSetDefaults && !showAddToProgramToggle)}>
          <div className="w-full flex flex-col">
            <div className="w-full flex justify-between items-center mb-2">
              <div className="text-slate-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">Exercise name</div>
              <div
                className={`${(exerciseName || '').length >= MAX_EXERCISE_NAME_LEN ? 'text-red-400' : 'text-neutral-400'} text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight`}
                aria-live="polite"
              >
                {(exerciseName || '').length} of {MAX_EXERCISE_NAME_LEN} characters
              </div>
            </div>
            <TextInput
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              customPlaceholder=""
              disabled={disabled}
              maxLength={MAX_EXERCISE_NAME_LEN}
              error={(exerciseName || '').length >= MAX_EXERCISE_NAME_LEN}
            />
          </div>
          
          {showSectionToggle && (
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
          )}
          
          <NumericInput
            label="Sets"
            value={setsCount}
            onChange={(value) => {
              // Prevent setting to 0 sets - minimum is 1
              if (value < 1) {
                return;
              }
              
              const currentCount = sets.length;
              if (value > currentCount) {
                // Add sets
                for (let i = currentCount; i < value; i++) {
                  addSet();
                }
              } else if (value < currentCount) {
                // Remove sets
                for (let i = currentCount; i > value; i--) {
                  removeLastSet();
                }
              }
            }}
            min={1}
            max={10}
            unitLabel="Sets"
            disabled={disabled}
          />
        </FormSectionWrapper>

        {/* Set defaults section - only show when not editing */}
        {!hideSetDefaults && (
          <FormSectionWrapper className="p-5">
            <div className="self-stretch justify-start">
              <span className="text-slate-600 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Set defaults </span>
              <span className="text-slate-300 text-base font-medium font-['Be_Vietnam_Pro'] leading-tight">Initialize sets then configure them individually in the exercise card.</span>
            </div>
            
            <div className="self-stretch flex flex-col justify-start items-start gap-6">
              {/* Default set type */}
              <div className="self-stretch flex flex-col justify-start items-start gap-4">
                <ToggleInput
                  label="Default set type"
                  value={defaults.set_type}
                  onValueChange={(value) => value && updateDefault("set_type", value)}
                  options={[
                    { label: "Reps", value: "reps" },
                    { label: "Timed", value: "timed" },
                  ]}
                  disabled={disabled}
                />

                {defaults.set_type === "timed" ? (
                  <DurationInput
                    value={defaults.timed_set_duration}
                    onChange={(value) => updateDefault("timed_set_duration", value)}
                    className="self-stretch h-12"
                  />
                ) : (
                  <NumericInput
                    label="Reps"
                    value={defaults.reps}
                    onChange={(value) => updateDefault("reps", value)}
                    min={1}
                    max={999}
                    unitLabel="Reps"
                    disabled={disabled}
                  />
                )}
              </div>

              {/* Default weight */}
              <div className="self-stretch flex flex-col justify-start items-start gap-4">
                <ToggleInput
                  label="Default weight"
                  value={defaults.unit}
                  onValueChange={(value) => value && updateDefault("unit", value)}
                  options={[
                    { label: "lbs", value: "lbs" },
                    { label: "kg", value: "kg" },
                    { label: "body", value: "body" },
                  ]}
                  disabled={disabled}
                />

                <NumericInput
                  label="Weight"
                  value={
                    defaults.weight !== undefined && defaults.unit !== "body"
                      ? defaults.weight
                      : defaults.unit === "body"
                      ? "body"
                      : 0
                  }
                  onChange={(value) => updateDefault("weight", value)}
                  min={0}
                  max={999}
                  step={5}
                  unitLabel={defaults.unit === "body" ? "Body" : defaults.unit === "kg" ? "Kg" : "Lbs"}
                  disabled={disabled}
                />
              </div>
            </div>
          </FormSectionWrapper>
        )}

        {/* Keep new exercise toggle (only for active workouts) */}
        {showAddToProgramToggle && (
          <FormSectionWrapper className="p-4" bordered={false}>
            <ToggleInput
              label="Keep new exercise?"
              value={addType}
              onValueChange={(value) => value && setAddType(value)}
              options={[
                { label: "Just for today", value: "today" },
                { label: "Permanently", value: "future" },
              ]}
              disabled={disabled}
            />
          </FormSectionWrapper>
        )}

        {/* Keep new settings toggle (only for active workouts when editing) */}
        {showUpdateTypeToggle && (
          <FormSectionWrapper className="p-4 border-t border-neutral-300" bordered={false}>
            <ToggleInput
              label="Keep new settings?"
              value={updateType}
              onValueChange={(value) => value && onUpdateTypeChange(value)}
              options={[
                { label: "Just for today", value: "today" },
                { label: "Permanently", value: "future" },
              ]}
              disabled={disabled}
            />
          </FormSectionWrapper>
        )}

        {/* Hidden form for submission */}
        <form ref={ref} onSubmit={handleSave} className="hidden">
          <button type="submit" />
        </form>
      </div>
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
  showSectionToggle: PropTypes.bool,
  showUpdateTypeToggle: PropTypes.bool,
  updateType: PropTypes.string,
  onUpdateTypeChange: PropTypes.func,
  onEditSet: PropTypes.func,
  onSetsConfigChange: PropTypes.func,
  disabled: PropTypes.bool,
  hideSetDefaults: PropTypes.bool,
};

AddNewExerciseForm.displayName = "AddNewExerciseForm";

export default AddNewExerciseForm;