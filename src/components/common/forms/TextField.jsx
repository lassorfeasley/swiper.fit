// @https://www.figma.com/design/Fg0Jeq5kdncLRU9GnkZx7S/FitAI?node-id=75-1692&t=qLasGdJck7GcZoku-4

import React, { useState } from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

const TextField = ({
  label,
  value,
  onChange,
  placeholder = "",
  className = "",
  error = false,
  id,
  icon,
  disabled = false,
  type = "text",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Determine outline color
  let outlineColor = "outline-neutral-300 border border-neutral-300";
  if (error) outlineColor = "outline-red-400 border border-red-400";
  else if (isFocused) outlineColor = "outline-slate-600 border border-slate-600";
  else if (isHovered) outlineColor = "outline-slate-600 border border-slate-600";
  else if (disabled) outlineColor = "outline-neutral-300 border border-neutral-300";

  // Determine text color
  let textColor = "text-slate-500";
  if (isFocused) textColor = "text-black";
  if (disabled) textColor = "text-neutral-300";

  // Font class
  const fontClass = "font-['Space_Grotesk']";

  // Use label as placeholder if placeholder is not provided
  const effectivePlaceholder = placeholder || label || "";

  return (
    <div className={cn("w-full flex flex-col items-start gap-2", className)}>
      <div
        className={cn(
          "self-stretch h-14 p-4 bg-white rounded-sm outline outline-1 outline-offset-[-1px] inline-flex justify-start items-center gap-1 overflow-hidden w-full",
          outlineColor
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: disabled ? 'not-allowed' : 'text' }}
        data-layer="TextInput"
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={effectivePlaceholder}
          disabled={disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "flex-1 bg-transparent border-none outline-none text-xl leading-loose",
            fontClass,
            textColor,
            disabled && "text-neutral-300",
            "placeholder:text-slate-400"
          )}
          autoComplete="off"
          {...props}
        />
        {icon && (
          <div className="ml-2 flex items-center" data-layer="icon">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

TextField.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.bool,
  id: PropTypes.string,
  icon: PropTypes.node,
  disabled: PropTypes.bool,
  type: PropTypes.string,
};

export default TextField;