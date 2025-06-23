import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import ToggleInput from "@/components/molecules/toggle-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import useSetConfig from "@/hooks/use-set-config";
import SetBuilderForm from "./SetBuilderForm";
import SetEditForm from "./SetEditForm";
import { FormHeader } from "@/components/atoms/sheet";
import { Repeat2, Timer, Weight as WeightIcon } from "lucide-react";
import DrawerManager from "@/components/organisms/drawer-manager";

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
    },
    ref
  ) => {
    /* ------------------------------------------------------------------ */
    //  Local state – name & set config hook
    /* ------------------------------------------------------------------ */

    const [exerciseName, setExerciseName] = useState(initialName);
    const [section, setSection] = useState(initialSection);
    const initialNameRef = React.useRef(initialName);

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
      updateDefault,
      updateSetField,
      getSetMerged,
      addSet,
      removeLastSet,
    } = useSetConfig(initialSets, initialDefaults);

    // Merge incoming per-set configs into hook state on mount
    useEffect(() => {
      if (initialSetConfigs.length > 0) {
        initialSetConfigs.forEach((cfg, idx) => {
          Object.entries(cfg).forEach(([k, v]) => updateSetField(idx, k, v));
        });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      const nameFilled = exerciseName.trim() !== "";
      const nameDirty = exerciseName.trim() !== initialNameRef.current.trim();
      const setDirty = sets.some((_, idx) => {
        const merged = getSetMerged(idx);
        return (
          JSON.stringify(merged) !==
          JSON.stringify(initialSetConfigs[idx] || {})
        );
      });
      // Ready to save/add only when a name is present AND either the name changed or sets changed
      onDirtyChange?.(nameFilled && (nameDirty || setDirty));
    }, [exerciseName, sets, onDirtyChange]);

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

    const [editSheetOpen, setEditSheetOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingFields, setEditingFields] = useState({});
    const [editingDirty, setEditingDirty] = useState(false);

    const openEditSheet = (idx) => {
      setEditingIndex(idx);
      const merged = getSetMerged(idx);
      const initialFields = { ...merged };
      if (
        !initialFields.set_variant ||
        initialFields.set_variant.trim() === ""
      ) {
        initialFields.set_variant = `Set ${idx + 1}`;
      }
      setEditingFields(initialFields);
      setEditingDirty(false);
      setEditSheetOpen(true);
    };

    const saveEditSheet = () => {
      const idx = editingIndex;
      Object.entries(editingFields).forEach(([k, v]) =>
        updateSetField(idx, k, v)
      );
      setEditSheetOpen(false);
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

      const setConfigs = sets.map((_, idx) => getSetMerged(idx));

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
                {merged.unit === "body" ? "body" : merged.weight}
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
        <div className="flex flex-col gap-3 border-b border-neutral-300 py-4">
          <TextInput
            label="Exercise name"
            value={exerciseName}
            onChange={(e) => setExerciseName(e.target.value)}
            customPlaceholder=""
          />
          <ToggleInput
            value={section}
            onChange={(value) => value && setSection(value)}
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
                onChange={(val) => val && setAddType(val)}
              />
            </div>
          )}
        </div>

        {/* Set defaults */}
        <div className="flex flex-col gap-3 border-b border-neutral-300 py-4">
          <div className="text-body leading-tight">
            <span className="text-slate-600 font-medium">Set defaults </span>
            <span className="text-neutral-300">
              Initialize sets then configure and name individual sets below.
            </span>
          </div>
          <SetBuilderForm
            initialDefaults={defaults}
            onDefaultsChange={updateDefault}
          />
        </div>

        {/* Customize sets */}
        <div className="flex flex-col gap-3 py-4 px-[1px]">
          <div className="text-body leading-tight">
            <span className="text-slate-600 font-medium">Customize sets </span>
            <span className="text-neutral-300">
              Tap a set to name and configure weight, reps, and more.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {Array.from({ length: setsCount }).map((_, idx) => (
              <SetCard key={idx} idx={idx} />
            ))}
          </div>
        </div>

        {/* Per-set edit sheet */}
        {editSheetOpen && (
          <DrawerManager
            open={editSheetOpen}
            onOpenChange={setEditSheetOpen}
            title="Edit set"
            leftAction={() => setEditSheetOpen(false)}
            rightAction={saveEditSheet}
            rightEnabled={editingDirty}
            rightText="Save"
            leftText="Cancel"
          >
            <div className="flex-1 overflow-y-auto flex flex-col gap-6">
              <SetEditForm
                isChildForm
                hideDivider
                initialValues={editingFields}
                onValuesChange={(vals) => setEditingFields(vals)}
                onDirtyChange={setEditingDirty}
              />
            </div>
          </DrawerManager>
        )}

        {/* Footer actions */}
        {!hideActionButtons && (
          <div className="mt-6 flex flex-col gap-3">
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
            {onDelete && (
              <SwiperButton
                variant="destructive"
                onClick={onDelete}
                className="w-full"
              >
                Delete exercise
              </SwiperButton>
            )}
          </div>
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
  initialSection: PropTypes.oneOf(["training", "warmup", "cooldown"]),
  initialSetConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.oneOf(["kg", "lbs", "body"]),
      set_type: PropTypes.string,
      timed_set_duration: PropTypes.number,
      set_variant: PropTypes.string,
    })
  ),
  onDirtyChange: PropTypes.func,
  hideActionButtons: PropTypes.bool,
};

export default AddNewExerciseForm;
