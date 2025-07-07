import React from "react";
import PropTypes from "prop-types";
import { Pencil } from "lucide-react";
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
  className = "",
  ...props
}) => {
  return (
    <div
      className={cn(
        "h-[52px] self-stretch pl-3 bg-white border-b border-neutral-300 inline-flex items-center sticky top-0 z-20",
        className
      )}
      {...props}
    >
      <div className="flex-1 flex items-center gap-2.5">
        <div className="flex-1 text-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight">
          {children}
        </div>
        <div className="flex items-center gap-5" />
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
  className: PropTypes.string,
  isSaveDisabled: PropTypes.bool,
};

export default SectionWrapperLabel; 