import * as React from "react";
import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

const TextInput = React.forwardRef(
  (
    {
      className,
      variant = "default",
      icon,
      error,
      disabled,
      customPlaceholder,
      label,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);

    const getInputStyles = () => {
      const baseStyles =
        "h-12 p-4 !bg-white rounded-sm outline outline-1 outline-offset-[-1px] text-body";

      if (disabled) {
        return cn(baseStyles, "outline-neutral-300 text-neutral-300");
      }

      if (error) {
        return cn(baseStyles, "outline-red-400 text-neutral-600");
      }

      if (isFocused) {
        return cn(baseStyles, "outline-neutral-600 text-neutral-600");
      }

      if (isHovered) {
        return cn(baseStyles, "outline-neutral-600 text-neutral-500");
      }

      return cn(baseStyles, "outline-neutral-300 text-neutral-500");
    };

    const getLabelStyles = () => {
      const baseStyles =
        "text-label";

      if (disabled) {
        return cn(baseStyles, "text-neutral-300");
      }

      if (error) {
        return cn(baseStyles, "text-red-400");
      }

      return cn(baseStyles, "text-neutral-600");
    };

    return (
      <div className="w-full inline-flex flex-col justify-start items-start gap-1">
        {label && <div className={getLabelStyles()}>{label}</div>}
        <div
          className={cn("relative w-full", className)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <Input
            ref={ref}
            className={getInputStyles()}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={customPlaceholder}
            {...props}
          />
          {icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              {icon}
            </div>
          )}
        </div>
        {error && <span className="text-red-400 text-label">{error}</span>}
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
