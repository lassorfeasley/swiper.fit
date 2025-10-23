import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/shared/inputs/TextInput";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";

/**
 * EditableTextInput – displays a static value with a pencil icon,
 * then swaps to a TextInput on click to allow editing.
 */
const EditableTextInput = ({
  label,
  value,
  onChange,
  className = "",
  inputProps = {},
  editing,
  onActivate,
  customIcon,
  onIconClick,
  disableEditing = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef(null);
  const isControlled = editing !== undefined;
  const editingState = isControlled ? editing : isEditing;

  // When entering edit mode, focus the input
  useEffect(() => {
    if (editingState && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingState]);

  // If the underlying value changes, update temp
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleBlur = () => {
    if (!isControlled) {
      setIsEditing(false);
    }
    if (tempValue !== value) {
      onChange(tempValue);
    }
  };

  const handleMainClick = () => {
    if (disableEditing) return;
    
    if (isControlled) {
      onActivate?.();
    } else {
      setIsEditing(true);
    }
  };

  const handleIconClick = (e) => {
    e.stopPropagation();
    if (onIconClick) {
      onIconClick();
    } else if (!disableEditing) {
      handleMainClick();
    }
  };

  if (editingState && !disableEditing) {
    return (
      <TextInput
        label={label}
        value={tempValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setTempValue(newValue);
          if (isControlled) {
            onChange(newValue);
          }
        }}
        ref={inputRef}
        onBlur={handleBlur}
        {...inputProps}
      />
    );
  }

  return (
    <div
      className={cn(
        "w-full inline-flex flex-col justify-start items-start gap-2",
        className
      )}
      onClick={handleMainClick}
    >
      {/* Label row */}
      {label && (
        <div className="w-full flex justify-between items-start">
          <div className="text-sm font-medium leading-none font-vietnam text-neutral-500">
            {label}
          </div>
        </div>
      )}
      {/* Static value wrapper matching TextInput structure */}
      <div className="relative w-full group">
        <div
          className="h-[52px] bg-neutral-100 rounded-sm border-none text-neutral-500 p-3 pr-14 flex items-center"
        >
          <div className="flex-1 text-base font-medium font-vietnam leading-tight">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-12 flex justify-center items-center",
            onIconClick && "hover:bg-neutral-200 transition-colors cursor-pointer"
          )}
          onClick={handleIconClick}
        >
          {customIcon || <Pencil className="size-6 text-neutral-500" />}
        </div>
      </div>
    </div>
  );
};

EditableTextInput.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  inputProps: PropTypes.object,
  editing: PropTypes.bool,
  onActivate: PropTypes.func,
  customIcon: PropTypes.element,
  onIconClick: PropTypes.func,
  disableEditing: PropTypes.bool,
};

export default EditableTextInput; 