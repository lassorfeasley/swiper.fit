import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SetBadge from "@/components/molecules/SetBadge";
import { FormHeader } from "@/components/atoms/sheet";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SwiperForm from "@/components/molecules/swiper-form";

const ExerciseCard = ({
  exerciseName,
  setConfigs = [],
  className = "",
  onEdit,
  onSetConfigsChange,
  mode = "default",
  reorderable = false,
  reorderValue,
  onCardClick,
  isDragging = false,
  ...props
}) => {
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSetIndex, setEditSetIndex] = useState(null);
  const [editFormValues, setEditFormValues] = useState({
    reps: 0,
    weight: 0,
    unit: "lbs",
  });
  const [currentFormValues, setCurrentFormValues] = useState(editFormValues);
  const [formDirty, setFormDirty] = useState(false);
  const [localSetConfigs, setLocalSetConfigs] = useState(setConfigs);

  // Sets are editable whenever an onSetConfigsChange handler is provided
  const setsAreEditable = onSetConfigsChange !== undefined;

  // Keep localSetConfigs in sync with setConfigs prop
  useEffect(() => {
    setLocalSetConfigs(setConfigs);
  }, [setConfigs]);

  // Open edit sheet for a set
  const handleSetEdit = (idx) => {
    if (!setsAreEditable) return;
    setEditSetIndex(idx);
    setEditFormValues(localSetConfigs[idx]);
    setCurrentFormValues(localSetConfigs[idx]);
    setEditSheetOpen(true);
  };

  // Save edited set values
  const handleEditFormSave = (values) => {
    setLocalSetConfigs((prev) => {
      const updated = prev.map((cfg, i) =>
        i === editSetIndex ? { ...cfg, ...values } : cfg
      );
      if (onSetConfigsChange) {
        onSetConfigsChange(updated);
      }
      return updated;
    });
    setEditSheetOpen(false);
    setEditSetIndex(null);
  };

  const handleSetDelete = () => {
    if (editSetIndex === null) return;
    setLocalSetConfigs((prev) => {
      const updated = prev.filter((_, i) => i !== editSetIndex);
      if (onSetConfigsChange) {
        onSetConfigsChange(updated);
      }
      return updated;
    });
    setEditSheetOpen(false);
    setEditSetIndex(null);
  };

  const handleCardClick = (e) => {
    if (isDragging) return;
    if (onCardClick) onCardClick(e);
  };

  const cardContent = (
    <div
      data-exercise-card="true"
      data-layer="CardContentsWrapper"
      className="w-full p-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex flex-col justify-start items-start gap-4"
      onClick={handleCardClick}
      style={{ cursor: setsAreEditable && onCardClick ? "pointer" : "default" }}
    >
      {/* Exercise name */}
      <div className="self-stretch inline-flex justify-start items-center gap-4">
        <div className="flex-1 justify-start text-neutral-600 text-lg font-medium font-vietnam leading-tight">
          {exerciseName}
        </div>
      </div>

      {/* Set badges */}
      {localSetConfigs && localSetConfigs.length > 0 && (
        <div className="w-full min-w-0 inline-flex justify-start items-center gap-3 flex-wrap content-center">
          {localSetConfigs.map((config, idx) => (
            <SetBadge
              key={idx}
              reps={config.reps}
              weight={config.weight}
              unit={config.unit || "lbs"}
              set_type={config.set_type}
              timed_set_duration={config.timed_set_duration}
              editable={setsAreEditable}
              onEdit={(e) => {
                e.stopPropagation();
                handleSetEdit(idx);
              }}
              className={mode === "completed" ? "bg-green-500 text-white" : ""}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      {cardContent}
      {setsAreEditable && (
        <SwiperForm
          open={editSheetOpen}
          onOpenChange={setEditSheetOpen}
          title="Edit set"
          leftAction={() => setEditSheetOpen(false)}
          rightAction={() => handleEditFormSave(currentFormValues)}
          rightEnabled={formDirty}
          rightText="Save"
          leftText="Cancel"
          padding={0}
        >
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <SetEditForm
                hideInternalHeader
                hideActionButtons
                onDirtyChange={setFormDirty}
                onValuesChange={setCurrentFormValues}
                onSave={handleEditFormSave}
                initialValues={editFormValues}
              />
            </div>
            {onSetConfigsChange && (
              <div className="border-t border-neutral-300">
                <div className="p-4">
                  <SwiperButton
                    onClick={handleSetDelete}
                    variant="destructive"
                    className="w-full"
                  >
                    Delete Set
                  </SwiperButton>
                </div>
              </div>
            )}
          </div>
        </SwiperForm>
      )}
    </div>
  );
};

ExerciseCard.propTypes = {
  exerciseName: PropTypes.string.isRequired,
  setConfigs: PropTypes.arrayOf(
    PropTypes.shape({
      reps: PropTypes.number,
      weight: PropTypes.number,
      unit: PropTypes.string,
      set_type: PropTypes.string,
      timed_set_duration: PropTypes.number,
    })
  ),
  className: PropTypes.string,
  onEdit: PropTypes.func,
  onSetConfigsChange: PropTypes.func,
  mode: PropTypes.oneOf(["default", "completed"]),
  reorderable: PropTypes.bool,
  reorderValue: PropTypes.any,
  onCardClick: PropTypes.func,
  isDragging: PropTypes.bool,
};

export default ExerciseCard;
