import * as React from "react";
import { Input } from "@/components/atoms/input";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";

const TextInput = React.forwardRef(
  (
    {
      className,
      icon,
      error,
      disabled,
      customPlaceholder,
      label,
      variant,
      optional = false,
      onClick,
      ...props
    },
    ref
  ) => {
    const getInputStyles = () => {
      // Base field style (height / spacing / typography / colours according to spec)
      const baseBase =
        "h-[52px] bg-white rounded border border-neutral-300 outline outline-1 outline-offset-[-1px] text-base font-medium leading-tight font-vietnam placeholder:font-medium placeholder:text-slate-500 shadow-none focus:ring-0 focus-visible:ring-0";

      // Padding differs when disabled (spec shows 16px -> p-4)
      const baseStyles = disabled ? cn(baseBase, "p-4") : cn(baseBase, "p-3");

      if (disabled) {
        return cn(
          baseStyles,
          "border-neutral-300 outline-neutral-300 text-neutral-300 placeholder:text-neutral-300"
        );
      }

      if (error) {
        return cn(
          baseStyles,
          "border-red-400 outline-red-400 text-slate-600 placeholder:text-slate-600"
        );
      }

      // Normal (non-error) state; styling on hover handled via group-hover classes
      return cn(
        baseStyles,
        "border-neutral-300 outline-neutral-300 text-slate-500 placeholder:text-slate-500"
      );
    };

    const getLabelStyles = () => {
      const baseStyles = "text-sm font-medium leading-none font-vietnam";

      if (disabled) {
        return cn(baseStyles, "text-neutral-300");
      }

      if (error) {
        return cn(baseStyles, "text-red-400");
      }

      return cn(baseStyles, "text-slate-500");
    };

    const iconPresent = !!icon;

    return (
      <div className="w-full inline-flex flex-col justify-start items-start gap-2">
        {label && (
          <div className="w-full flex justify-between items-start">
            <div className={getLabelStyles()}>{label}</div>
            {optional && (
              <div className="text-neutral-400 text-sm font-medium leading-none font-vietnam">
                Optional
              </div>
            )}
          </div>
        )}
        <div className={cn("relative w-full group", className)}>
          <Input
            ref={ref}
            className={cn(
              getInputStyles(),
              iconPresent && "pr-14" // leave space for the icon container (w-12 + gap)
            )}
            disabled={disabled}
            placeholder={customPlaceholder}
            onClick={onClick}
            {...props}
          />
          {iconPresent && (
            <div
              className={cn(
                "absolute top-0 right-0 h-full w-12 flex justify-center items-center border-l",
                disabled && "border-neutral-300 text-neutral-300",
                !disabled && error && "border-red-400 text-slate-600",
                !disabled && !error &&
                  "border-neutral-300 text-slate-500 group-hover:border-slate-600 group-focus-within:border-slate-600"
              )}
              onClick={onClick}
            >
              {typeof icon === "boolean" ? <Eye /> : icon}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
