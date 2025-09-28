import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Repeat2, Weight, Grip, Clock } from "lucide-react";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SwiperForm from "@/components/molecules/swiper-form";
import { motion, useMotionValue } from "framer-motion";

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

  const handleMenuClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(e);
  };

  // Get set names from database or fallback to default
  const getSetName = (index, config) => {
    return config.set_variant || `Set ${index + 1}`;
  };

  // Format time for timed sets
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const cardContent = (
    <div
      data-layer="exercise-card"
      className={`ExerciseCard w-full max-w-[500px] bg-white rounded-xl shadow-[0px_0px_8px_0px_rgba(229,229,229,1.00)] backdrop-blur-[1px] inline-flex flex-col justify-start items-start overflow-hidden`}
      onClick={handleCardClick}
      style={{ 
        cursor: reorderable ? "grab" : setsAreEditable && onCardClick ? "pointer" : "default",
        ...(isDragging && { cursor: "grabbing" })
      }}
      {...domProps}
    >
      {/* Header */}
      <div
        data-layer="card-label"
        className={`self-stretch pl-4 bg-neutral-neutral-200 inline-flex justify-start items-center gap-4${addTopBorder ? ' border-t border-neutral-neutral-300' : ''}`}
      >
        <div data-layer="exercise-name" className="flex-1 h-11 flex items-center justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
          {exerciseName}
        </div>
        {!hideGrip && (
          <div data-layer="IconButton" className="p-2.5 flex justify-start items-center gap-2.5">
            <button 
              onClick={handleMenuClick}
              className="size-6 relative overflow-hidden flex items-center justify-center"
              aria-label="Exercise options"
            >
              <Grip className="size-6 text-neutral-neutral-500" />
            </button>
          </div>
        )}
      </div>

      {/* Set rows */}
      {localSetConfigs && localSetConfigs.length > 0 && (
        <>
          {localSetConfigs.map((config, idx) => {
            const isLast = idx === localSetConfigs.length - 1;
            const rowClasses = [
              "self-stretch h-11 px-4 inline-flex justify-between items-center overflow-hidden cursor-pointer",
              idx % 2 === 1 ? "bg-neutral-50" : ""
            ].filter(Boolean).join(" ");
            return (
              <div 
                key={idx}
                data-layer="card-row" 
                className={rowClasses}
                onClick={setsAreEditable ? (e) => {
                  e.stopPropagation();
                  handleSetEdit(idx);
                } : undefined}
              >
                <div data-layer="Set name" className="justify-start text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                  {getSetName(idx, config)}
                </div>
                <div data-layer="metrics" className="self-stretch min-w-12 flex justify-start items-center gap-px overflow-hidden">
                  {/* First metric: Reps or Time */}
                  <div data-layer="rep-type" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div data-layer="rep-type-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                      {config.set_type === 'timed' ? (
                        <Clock className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      ) : (
                        <Repeat2 className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                      )}
                    </div>
                    <div data-layer="rep-type-metric" className="text-center justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {config.set_type === 'timed' ? formatTime(config.timed_set_duration || 0) : (config.reps || 0)}
                    </div>
                  </div>
                  {/* Weight */}
                  <div data-layer="rep-weight" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                    <div data-layer="rep-weight-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                      <Weight className="size-4 text-neutral-neutral-500" strokeWidth={1.5} />
                    </div>
                    <div data-layer="rep-weight-metric" className="text-center justify-center text-neutral-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                      {config.unit === 'body' ? 'BW' : (config.weight || 0)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {reorderable ? (
        <motion.div
          className="w-full"
          style={{ 
            touchAction: "none"
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
