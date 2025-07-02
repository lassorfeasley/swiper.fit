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
        "h-20 self-stretch px-5 bg-white border-b border-neutral-300 inline-flex flex-col justify-center items-start gap-2.5 sticky top-0 z-20",
        className
      )}
      {...props}
    >
      <div className="self-stretch inline-flex justify-between items-center gap-2.5">
        <div className="flex-1 justify-start text-neutral-700 text-2xl font-bold font-vietnam leading-normal">
          {children}
        </div>
        {(onEdit || onSave || onCancel) && (
          <div className="flex items-center gap-5">
            {isEditing ? (
              <>
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="text-red-500 text-base font-medium font-vietnam leading-tight"
                  >
                    Cancel
                  </button>
                )}
                {onSave && (
                  <button
                    onClick={onSave}
                    disabled={isSaveDisabled}
                    className={cn(
                      isSaveDisabled
                        ? "text-neutral-300 cursor-not-allowed"
                        : "text-green-600",
                      "text-base font-medium font-vietnam leading-tight"
                    )}
                  >
                    Save
                  </button>
                )}
              </>
            ) : (
              onEdit && (
                <button
                  onClick={onEdit}
                  className="border-l border-white flex justify-center items-center gap-2.5 p-2"
                >
                  <Pencil className="size-6 text-neutral-400" />
                </button>
              )
            )}
          </div>
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
  className: PropTypes.string,
  isSaveDisabled: PropTypes.bool,
};

export default SectionWrapperLabel; 