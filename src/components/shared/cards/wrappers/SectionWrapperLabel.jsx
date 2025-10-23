import React from "react";
import PropTypes from "prop-types";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SectionWrapperLabel – customizable label/header area for PageSectionWrapper.
 * Supports optional edit, save, and cancel actions displayed to the right of the title.
 */
const SectionWrapperLabel = ({
  children,
  isEditing = false,
  onEdit,
  onSave,
  isSaveDisabled = false,
  onCancel,
  showPlusButton = false,
  onPlus,
  className = "",
  ...props
}) => {
  return (
    <div
      className={cn(
        "self-stretch px-[28px] mb-5 inline-flex justify-center items-center",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-[500px] flex items-center justify-between">
        <div data-layer="section" className="Section flex items-center justify-start text-neutral-neutral-700 text-2xl font-bold font-['Be_Vietnam_Pro'] leading-loose">
          {children}
        </div>
        {showPlusButton && (
          <button onClick={onPlus} aria-label="Add" className="p-2.5 flex items-center justify-center">
            <Plus className="w-6 h-6 text-neutral-neutral-700" />
          </button>
        )}
      </div>
    </div>
  );
};

SectionWrapperLabel.propTypes = {
  children: PropTypes.node.isRequired,
  isEditing: PropTypes.bool,
  onEdit: PropTypes.func,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  showPlusButton: PropTypes.bool,
  onPlus: PropTypes.func,
  className: PropTypes.string,
  isSaveDisabled: PropTypes.bool,
};

export default SectionWrapperLabel; 