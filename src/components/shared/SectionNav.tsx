import React from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";

interface SectionNavProps {
  value?: string;
  onChange?: (value: string) => void;
}

/**
 * SectionNav – 3-way navigation (Warm-up / Workout / Cool-down)
 * Appears directly beneath the PageHeader, spans full width, and
 * collapses nicely on mobile. Behaves like tabs using Radix ToggleGroup
 * (type="single") so that exactly one section is always selected.
 */
const SectionNav = React.forwardRef<HTMLDivElement, SectionNavProps>(({ value = "warmup", onChange }, ref) => {
  const handleValueChange = (val: string) => {
    if (!val) return; // ignore unselect (keep current)
    onChange?.(val);
  };

  return (
    <div
      ref={ref}
      className="WorkoutSection w-full bg-stone-300 flex justify-center items-center select-none"
    >
      <div className="w-full max-w-[500px]">
        <ToggleGroup
          type="single"
          value={value}
          onValueChange={handleValueChange}
          className="Togglegroup w-full flex flex-row items-center overflow-hidden"
        >
          {[
            { label: "Warmup", val: "warmup" },
            { label: "Training", val: "workout" },
            { label: "Cooldown", val: "cooldown" },
          ].map((item, idx) => (
            <ToggleGroupItem
              key={item.val}
              value={item.val}
              className={
                [
                  "Togglebuttonwrapper flex-1 h-7 bg-transparent hover:bg-transparent flex justify-center items-center gap-2.5 rounded-none",
                  "text-slate-600 text-sm font-medium leading-none font-vietnam",
                  idx < 2 ? "border-r border-neutral-300" : "",
                  "data-[state=on]:bg-stone-100",
                ].join(" ")
              }
            >
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
});

SectionNav.displayName = "SectionNav";

export default SectionNav; 