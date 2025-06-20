import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
import NumericInput from "@/components/molecules/numeric-input";
import { SwiperButton } from "@/components/molecules/swiper-button";
import { Separator } from "@/components/atoms/separator";
import useSetConfig from "@/hooks/use-set-config";
import SetBuilderForm from "./SetBuilderForm";
import SetEditForm from "./SetEditForm";
import { Sheet, SheetContent } from "@/components/atoms/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Repeat2, Timer, Weight as WeightIcon } from "lucide-react";

// Utility arrays for human-friendly set names
const setWords = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

const AddNewExerciseForm = React.forwardRef(({
  onActionIconClick,
  onDelete,
  formPrompt = "Add to program",
  initialName = "",
  initialSets = 3,
  initialSetConfigs = [],
}, ref) => {
  /* ------------------------------------------------------------------ */
  //  Local state – name & set config hook
  /* ------------------------------------------------------------------ */

  const [exerciseName, setExerciseName] = useState(initialName);

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

  /* ------------------------------------------------------------------ */
  //  Per-set editor sheet
  /* ------------------------------------------------------------------ */

  const isMobile = useIsMobile();
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingFields, setEditingFields] = useState({});
  const [editingName, setEditingName] = useState("");

  const openEditSheet = (idx) => {
    setEditingIndex(idx);
    const merged = getSetMerged(idx);
    setEditingFields({ ...merged });
    setEditingName(sets[idx].set_variant || `Set ${idx + 1}`);
    setEditSheetOpen(true);
  };

  const saveEditSheet = () => {
    const idx = editingIndex;
    Object.entries(editingFields).forEach(([k, v]) => updateSetField(idx, k, v));
    if (editingName) updateSetField(idx, "set_variant", editingName);
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
      onActionIconClick({
        name: exerciseName.trim(),
        sets: setsCount,
        setConfigs,
      });
    }
  };

  /* ------------------------------------------------------------------ */
  //  Focus behaviour – autofocus name when mounted
  /* ------------------------------------------------------------------ */

  const nameRef = useRef(null);
  useEffect(() => {
    nameRef.current?.select?.();
  }, []);

  /* ------------------------------------------------------------------ */
  //  Render helpers
  /* ------------------------------------------------------------------ */

  const renderSetCard = (idx) => {
    const merged = getSetMerged(idx);
    const isTimed = merged.set_type === "timed";

    return (
      <div
        key={idx}
        className="w-full p-3 rounded-sm outline outline-1 outline-neutral-300 flex justify-between items-center bg-white cursor-pointer"
        onClick={() => openEditSheet(idx)}
      >
        <span className="text-slate-600 text-sm font-normal font-['Space_Grotesk'] leading-none">
          {sets[idx].set_variant || `Set ${idx + 1}`}
        </span>
        <div className="h-7 min-w-12 bg-neutral-300 rounded-sm outline outline-1 outline-neutral-300 flex items-stretch overflow-hidden">
          <div className="px-2 bg-stone-100 flex items-center gap-0.5">
            {isTimed ? (
              <Timer className="size-4 text-slate-600" strokeWidth={1.5} />
            ) : (
              <Repeat2 className="size-4 text-slate-600" strokeWidth={1.5} />
            )}
            <span className="text-slate-600 text-sm leading-tight">
              {isTimed ? merged.timed_set_duration : merged.reps}
            </span>
          </div>
          <div className="px-2 bg-stone-100 flex items-center gap-0.5 border-l border-neutral-300">
            <WeightIcon className="size-4 text-slate-600" strokeWidth={1.5} />
            <span className="text-slate-600 text-sm leading-tight">
              {merged.unit === "body" ? "body" : merged.weight}
            </span>
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------------ */
  //  JSX
  /* ------------------------------------------------------------------ */

  return (
    <form
      ref={ref}
      className="w-full px-5 box-border inline-flex flex-col gap-6"
      onSubmit={handleSave}
    >
      {/* Exercise name & sets */}
      <div className="flex flex-col gap-3">
        <TextInput
          ref={nameRef}
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          customPlaceholder="Exercise name"
          autoFocus
        />
        <div className="flex flex-col gap-1">
          <span className="text-slate-600 text-base leading-normal">Sets</span>
          <NumericInput
            value={setsCount}
            onChange={handleSetsChange}
            min={1}
            max={10}
            className="w-full"
          />
        </div>
      </div>

      {/* Informational blurb */}
      <div className="text-slate-600 text-sm leading-tight">
        Set defaults are global – edit individual sets for more control.
      </div>

      {/* Set defaults */}
      <SetBuilderForm
        hideSetVariantInput
        hideDivider
        set_variant=""
        onSetVariantChange={() => {}}
        setType={defaults.set_type}
        onSetTypeChange={(val) => {
          updateDefault("set_type", val);
          if (val === "timed" && !defaults.timed_set_duration) {
            updateDefault("timed_set_duration", 30);
          }
        }}
        reps={defaults.reps}
        timed_set_duration={defaults.timed_set_duration}
        onRepsChange={(val) => updateDefault("reps", val)}
        onTimedDurationChange={(val) =>
          updateDefault("timed_set_duration", val)
        }
        weight={defaults.weight}
        unit={defaults.unit}
        onWeightChange={(val) => updateDefault("weight", val)}
        onUnitChange={(val) => updateDefault("unit", val)}
      />

      <Separator className="-mx-5" />

      {/* Customize sets */}
      <div className="flex flex-col gap-3 pb-2">
        <div className="text-base leading-tight">
          <span className="text-slate-600 font-medium">Customize sets </span>
          <span className="text-neutral-300">Tap a set to name and configure weight, reps, and more.</span>
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: setsCount }).map((_, idx) => renderSetCard(idx))}
        </div>
      </div>

      {/* Per-set edit sheet */}
      {editSheetOpen && (
        <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className={
              isMobile
                ? "h-[85vh] w-full bg-stone-50 px-0"
                : "w-[500px] bg-stone-50 px-0 gap-0"
            }
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 bg-stone-50 border-b">
              <div className="flex items-center justify-between px-6 py-3">
                <button
                  onClick={() => setEditSheetOpen(false)}
                  className="text-red-500 font-medium"
                >
                  Cancel
                </button>
                <h2 className="font-bold text-lg">Edit</h2>
                <button
                  onClick={saveEditSheet}
                  className="text-green-600 font-medium"
                >
                  Save changes
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
              <TextInput
                label="Name set"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                customPlaceholder="e.g. Warm-up"
              />
              <SetEditForm
                isChildForm
                hideDivider
                initialValues={editingFields}
                onValuesChange={(vals) => setEditingFields(vals)}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </form>
  );
});

AddNewExerciseForm.propTypes = {
  onActionIconClick: PropTypes.func,
  onDelete: PropTypes.func,
  formPrompt: PropTypes.string,
  initialName: PropTypes.string,
  initialSets: PropTypes.number,
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
};

export default AddNewExerciseForm; 