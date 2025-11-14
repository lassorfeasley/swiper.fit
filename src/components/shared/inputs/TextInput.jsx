import * as React from "react";
// import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

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
    const [showPassword, setShowPassword] = React.useState(false);

    const getInputStyles = () => {
      // Base field style (height / spacing / typography / colours according to spec)
      const baseBase =
        "h-[52px] bg-white rounded-lg border border-neutral-300 text-base font-medium leading-tight font-vietnam placeholder:font-medium placeholder:text-slate-500 shadow-none focus:ring-0 focus-visible:ring-0";

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
    const isPasswordToggle = typeof icon === "boolean" && icon;

    const handleIconClick = () => {
      if (isPasswordToggle) {
        setShowPassword(!showPassword);
      } else if (onClick) {
        onClick();
      }
    };

    // Destructure type from props so we can control it for password visibility toggle
    const { type: propType, ...restProps } = props;
    
    // Determine the input type: if icon is boolean true and showPassword is true, show as text, otherwise use the prop type
    const inputType = isPasswordToggle && showPassword ? "text" : (propType || "text");
    
    // Determine which icon to show
    const renderIcon = () => {
      if (isPasswordToggle) {
        return showPassword ? <Eye /> : <EyeOff />;
      }
      return icon;
    };

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
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "flex h-10 w-full rounded-md file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50",
              "focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0", // Remove all focus rings
              "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden", // Hide IE/Edge password reveal button
              getInputStyles(),
              iconPresent && "pr-14" // leave space for the icon container (w-12 + gap)
            )}
            disabled={disabled}
            placeholder={customPlaceholder}
            autoComplete={isPasswordToggle ? "new-password" : restProps.autoComplete}
            {...restProps}
          />
          {iconPresent && (
            <div
              className={cn(
                "absolute top-0 right-0 h-full w-12 flex justify-center items-center border-l cursor-pointer",
                disabled && "border-neutral-300 text-neutral-300",
                !disabled && error && "border-red-400 text-slate-600",
                !disabled && !error &&
                  "border-neutral-300 text-slate-500 group-hover:border-slate-600 group-focus-within:border-slate-600"
              )}
              onClick={handleIconClick}
            >
              {renderIcon()}
            </div>
          )}
        </div>
      </div>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
