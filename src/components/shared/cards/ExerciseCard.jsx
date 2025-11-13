import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Grip } from "lucide-react";
import ExerciseCardBase from "@/components/shared/cards/ExerciseCardBase";
import { SetEditForm } from "@/features/routines";
import { Button } from "@/components/shadcn/button";
import SwiperForm from "@/components/shared/SwiperForm";
import { motion, useMotionValue } from "framer-motion";
import SwiperDialog from "@/components/shared/SwiperDialog";

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
  isFirstCard,
  hideGrip = false,
  addTopBorder = false,
  ...props
}) => {
  // Filter out isFirstCard from props to prevent React warning
  const { isFirstCard: _, ...domProps } = props;
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
  const [confirmDeleteExerciseOpen, setConfirmDeleteExerciseOpen] = useState(false);

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
      // If this is the last remaining set, confirm that we will delete the exercise instead
      if (prev.length <= 1) {
        setConfirmDeleteExerciseOpen(true);
        return prev;
      }
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

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(e);
  };

  const cardContent = (
    <div onClick={handleCardClick} {...domProps}>
      <ExerciseCardBase
        exerciseName={exerciseName}
        sets={localSetConfigs}
        addTopBorder={addTopBorder}
        onSetClick={setsAreEditable ? (idx) => handleSetEdit(idx) : undefined}
        rightHeader={
          hideGrip ? null : (
            <button
              onClick={handleMenuClick}
              className="size-6 relative overflow-hidden flex items-center justify-center"
              aria-label="Exercise options"
            >
              <Grip className="size-6 text-neutral-neutral-500" />
            </button>
          )
        }
      />
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {reorderable ? (
        <motion.div
          className="w-full"
          style={{ 
            touchAction: "pan-y"
          }}
        >
          {cardContent}
        </motion.div>
      ) : (
        <div className="w-full">
          {cardContent}
        </div>
      )}

      {/* Edit form sheet */}
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
          <SetEditForm
            hideInternalHeader
            hideActionButtons
            hideToggle={true}
            onDirtyChange={setFormDirty}
            onValuesChange={setCurrentFormValues}
            onSave={handleEditFormSave}
            onDelete={handleSetDelete}
            initialValues={editFormValues}
          />
        </SwiperForm>
      )}

      {/* Confirm deleting last set => delete exercise */}
      <SwiperDialog
        open={confirmDeleteExerciseOpen}
        onOpenChange={setConfirmDeleteExerciseOpen}
        onConfirm={() => setConfirmDeleteExerciseOpen(false)}
        onCancel={() => {
          // Proceed with deleting the exercise by clearing all sets
          if (onSetConfigsChange) {
            onSetConfigsChange([]); // RoutineBuilder will remove the exercise
          }
          setConfirmDeleteExerciseOpen(false);
          setEditSheetOpen(false);
          setEditSetIndex(null);
        }}
        title="Delete exercise?"
        confirmText="Cancel"
        cancelText="Delete exercise"
        confirmVariant="outline"
        cancelVariant="destructive"
        contentClassName=""
        headerClassName="self-stretch h-11 px-3 bg-neutral-50 border-t border-neutral-neutral-300 inline-flex justify-start items-center"
        footerClassName="self-stretch px-3 py-3"
      >
        Deleting this set will remove the exercise from your routine.
      </SwiperDialog>
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
  isFirstCard: PropTypes.bool,
};

export default ExerciseCard;
