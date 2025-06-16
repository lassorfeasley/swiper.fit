import * as React from "react";
import { ToggleGroup, ToggleGroupItem } from "../atoms/toggle-group";
import { cn } from "../../lib/utils";

const ToggleInput = ({
  label,
  options = [],
  value,
  onChange,
  className = "",
}) => {
  return (
    <div
      className={cn(
        "w-full inline-flex flex-col justify-start items-center gap-1",
        className
      )}
    >
      {label && (
        <div className="self-stretch text-slate-600 text-base font-normal font-['Space_Grotesk'] leading-normal mb-1">
          {label}
        </div>
      )}
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={onChange}
        className="gap-0 self-stretch rounded-sm border border-neutral-300 flex justify-start items-center overflow-hidden h-7 p-0 bg-white"
      >
        {options.map((option, idx) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={cn(
              "flex-1 h-7 flex justify-center items-center gap-2.5 p-0 font-normal font-['Space_Grotesk'] text-base text-slate-600 border-0 rounded-none shadow-none outline-none focus:outline-none focus:ring-0 active:outline-none active:ring-0 hover:bg-white hover:text-slate-600",
              value === option.value ? "bg-slate-200" : "bg-white",
              idx !== options.length - 1 && "border-r border-neutral-300"
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
