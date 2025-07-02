import React, { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { TextInput } from "@/components/molecules/text-input";
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

  if (editingState) {
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
      onClick={() => {
        if (isControlled) {
          onActivate?.();
        } else {
          setIsEditing(true);
        }
      }}
    >
      {/* Label row */}
      <div className="w-full flex justify-between items-start">
        <div className="text-sm font-medium leading-none font-vietnam text-neutral-500">
          {label}
        </div>
      </div>
      {/* Static value wrapper matching TextInput structure */}
      <div className="relative w-full group">
        <div
          className="h-[52px] bg-neutral-400 rounded border-none text-white p-3 pr-14 flex items-center"
        >
          <div className="flex-1 text-base font-medium font-vietnam leading-tight">
            {value}
          </div>
        </div>
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-12 flex justify-center items-center border-l border-white"
          )}
        >
          <Pencil className="size-6 text-white" />
        </div>
      </div>
    </div>
  );
};

EditableTextInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  inputProps: PropTypes.object,
  editing: PropTypes.bool,
  onActivate: PropTypes.func,
};

export default EditableTextInput; 