import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SetBadge from "@/components/molecules/SetBadge";
import { FormHeader, SheetTitle } from "@/components/atoms/sheet";
import { SwiperSheet } from "@/components/molecules/swiper-sheet";
import SetEditForm from "@/components/common/forms/SetEditForm";
import CardWrapper from "./Wrappers/CardWrapper";
import { Reorder } from "framer-motion";
import AddNewExerciseForm from "../forms/AddNewExerciseForm";

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
  ...props
}) => {
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editSetIndex, setEditSetIndex] = useState(null);
  const [editFormValues, setEditFormValues] = useState({
    reps: 0,
    weight: 0,
    unit: "lbs",
  });
  const [localSetConfigs, setLocalSetConfigs] = useState(setConfigs);
  const [isDragging, setIsDragging] = useState(false);

  const setsAreEditable =
    onSetConfigsChange !== undefined && mode !== "completed";

  // Keep localSetConfigs in sync with setConfigs prop
  useEffect(() => {
    setLocalSetConfigs(setConfigs);
  }, [setConfigs]);

  // Open edit sheet for a set
  const handleSetEdit = (idx) => {
    if (!setsAreEditable) return;
    setEditSetIndex(idx);
    setEditFormValues(localSetConfigs[idx]);
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
      data-layer="CardContentsWrapper"
      className="w-full p-4 bg-stone-50 rounded-lg"
      onClick={handleCardClick}
      style={{ cursor: setsAreEditable && onCardClick ? "pointer" : "default" }}
    >
      <div
        data-layer="ExersiceCardContent"
        className="w-full flex flex-col gap-2"
      >
        <div
          data-layer="Exercise Name"
          className="w-full text-slate-950 text-heading-md"
        >
          {exerciseName}
        </div>
        <div
          data-layer="Frame 5"
          data-property-1="Default"
          className="w-full flex flex-wrap gap-2"
        >
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
              complete={mode === "completed"}
              className={mode === "completed" ? "bg-green-500 text-white" : ""}
            />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <CardWrapper className={className}>
      {reorderable ? (
        <Reorder.Item
          value={reorderValue}
          className="w-full"
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
        >
          {cardContent}
        </Reorder.Item>
      ) : (
        cardContent
      )}
      {setsAreEditable && (
        <SwiperSheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
          <FormHeader className="mb-4">
            <SheetTitle>Edit set</SheetTitle>
          </FormHeader>
          <SetEditForm
            onSave={handleEditFormSave}
            initialValues={editFormValues}
            saveButtonText="Save"
            onDelete={handleSetDelete}
          />
        </SwiperSheet>
      )}
    </CardWrapper>
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
};

export default ExerciseCard;
