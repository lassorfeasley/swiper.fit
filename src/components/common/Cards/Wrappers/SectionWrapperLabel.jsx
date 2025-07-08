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
  isSticky = true,
  stickyTopClass = "top-11",
  ...props
}) => {
  return (
    <div
      className={cn(
        "h-[44px] self-stretch pl-3 bg-white border-b border-neutral-300 inline-flex items-center z-20",
        isSticky && `sticky ${stickyTopClass}`,
        className
      )}
      {...props}
    >
      <div className="flex-1 flex items-center gap-2.5">
        <div data-layer="title" className="Title flex-1 self-stretch px-3 inline-flex justify-start items-center gap-2.5">
          <div data-layer="Programs" className="Programs justify-start text-neutral-neutral-700 text-xs font-bold font-['Be_Vietnam_Pro'] uppercase leading-3 tracking-wide">
            {children}
          </div>
        </div>
        <div className="flex items-center gap-5">
          {showPlusButton && (
            <button onClick={onPlus} aria-label="Add" className="p-2.5 border-l border-neutral-300 flex items-center justify-center">
              <Plus className="w-6 h-6 text-neutral-700" />
            </button>
          )}
        </div>
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
  isSticky: PropTypes.bool,
  stickyTopClass: PropTypes.string,
};

export default SectionWrapperLabel; 