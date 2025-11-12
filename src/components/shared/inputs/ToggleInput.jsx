import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { cn } from "@/lib/utils";

const ToggleInput = ({
  label,
  options = [],
  value,
  onValueChange,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <div
      className={cn(
        "w-full inline-flex flex-col justify-start items-center gap-1",
        className
      )}
    >
      {label && (
        <div className="self-stretch text-slate-500 text-label mb-1">
          {label}
        </div>
      )}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={disabled ? undefined : (onValueChange || onChange)}
        disabled={disabled}
        className="gap-0 self-stretch rounded-lg border border-neutral-300 flex justify-start items-center overflow-hidden h-7 p-0"
      >
        {options.map((option, idx) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(
              "flex-1 h-7 flex justify-center items-center gap-2.5 p-0 text-body border-0 shadow-none outline-none focus:outline-none focus:ring-0 active:outline-none active:ring-0 data-[state=on]:bg-neutral-300 data-[state=off]:bg-white",
              disabled ? "text-neutral-300 cursor-not-allowed" : "text-slate-600",
              idx !== options.length - 1 && "border-r border-neutral-300",
              "rounded-none"
            )}
            style={{ minWidth: 0 }}
            tabIndex={0}
          >
            <span>{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};

export default ToggleInput;
