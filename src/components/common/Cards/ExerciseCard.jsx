import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Repeat2, Weight, Grip, Clock } from "lucide-react";
import SetEditForm from "@/components/common/forms/SetEditForm";
import { SwiperButton } from "@/components/molecules/swiper-button";
import SwiperForm from "@/components/molecules/swiper-form";
import { motion } from "framer-motion";

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
      data-layer="Property 1=routine-builder" 
      className="w-full bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-300 inline-flex flex-col justify-start items-start overflow-hidden"
      onClick={handleCardClick}
      style={{ 
        cursor: reorderable ? "grab" : setsAreEditable && onCardClick ? "pointer" : "default",
        ...(isDragging && { cursor: "grabbing" })
      }}
    >
      {/* Header */}
      <div data-layer="Frame 61" className="self-stretch pl-3 border-b border-neutral-300 inline-flex justify-start items-center gap-4">
        <div data-layer="Exercise name" className="flex-1 justify-start text-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
          {exerciseName}
        </div>
        <div data-layer="IconButton" className="p-2.5 flex justify-start items-center gap-2.5">
          <button 
            onClick={handleMenuClick}
            className="size-6 relative overflow-hidden flex items-center justify-center"
            aria-label="Exercise options"
          >
            <Grip className="size-6 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* Set rows */}
      {localSetConfigs && localSetConfigs.length > 0 && (
        <>
          {localSetConfigs.map((config, idx) => (
            <div 
              key={idx}
              data-layer="card-row" 
              className="self-stretch h-11 pl-3 border-b border-neutral-300 inline-flex justify-between items-center overflow-hidden cursor-pointer hover:bg-neutral-50"
              onClick={setsAreEditable ? (e) => {
                e.stopPropagation();
                handleSetEdit(idx);
              } : undefined}
            >
              <div data-layer="Set name" className="justify-start text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                {getSetName(idx, config)}
              </div>
              <div data-layer="metrics" className="self-stretch min-w-12 flex justify-start items-center gap-px overflow-hidden">
                {/* First metric: Reps or Time */}
                <div data-layer="rep-type" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                  <div data-layer="rep-type-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                    {config.set_type === 'timed' ? (
                      <Clock className="size-4 text-neutral-500" strokeWidth={1.5} />
                    ) : (
                      <Repeat2 className="size-4 text-neutral-500" strokeWidth={1.5} />
                    )}
                  </div>
                  <div data-layer="rep-type-metric" className="text-center justify-center text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    {config.set_type === 'timed' ? formatTime(config.timed_set_duration || 0) : (config.reps || 0)}
                  </div>
                </div>
                {/* Weight */}
                <div data-layer="rep-weight" className="self-stretch pl-1 pr-2 flex justify-center items-center gap-0.5">
                  <div data-layer="rep-weight-icon" className="size-4 relative overflow-hidden flex items-center justify-center">
                    <Weight className="size-4 text-neutral-500" strokeWidth={1.5} />
                  </div>
                  <div data-layer="rep-weight-metric" className="text-center justify-center text-neutral-500 text-sm font-medium font-['Be_Vietnam_Pro'] leading-tight">
                    {config.unit === 'body' ? 'BW' : (config.weight || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      {reorderable ? (
        <motion.div
          className="w-full"
          whileTap={{ scale: 1.02 }}
          style={{ touchAction: "none" }}
        >
          {cardContent}
        </motion.div>
      ) : (
        cardContent
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
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <SetEditForm
                hideInternalHeader
                hideActionButtons
                hideToggle={true}
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
