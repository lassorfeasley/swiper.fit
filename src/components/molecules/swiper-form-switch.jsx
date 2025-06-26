import React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

/**
 * A labeled switch component styled for use inside Swiper forms.
 *
 * Design specs (off state):
 * - Container: w-14 h-8 p-1 bg-slate-200 rounded-sm flex justify-start items-center
 * - Thumb: w-6 h-full rounded-sm bg-stone-700
 *
 * On checked, the container justifies content to the end and the thumb turns green.
 */
const SwiperFormSwitch = ({
  label,
  checked,
  onCheckedChange,
  className,
  id,
}) => {
  const switchId = id || `swiper-form-switch-${label?.toLowerCase().replace(/\s+/g, "-") || "input"}`;

  return (
    <div
      className={cn(
        "w-full h-12 px-3 py-2.5 rounded-sm border border-neutral-300 bg-white inline-flex justify-end items-center gap-2.5",
        className
      )}
    >
      {label && (
        <label
          htmlFor={switchId}
          className="flex-1 text-slate-500 text-sm font-medium leading-none select-none"
        >
          {label}
        </label>
      )}
      <SwitchPrimitive.Root
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          "relative w-14 h-8 p-1 bg-slate-200 rounded-sm flex items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            "pointer-events-none w-6 h-full rounded-sm shadow-sm ring-0 transition-transform duration-200 ease-in-out",
            checked ? "translate-x-6 bg-green-500" : "translate-x-0 bg-stone-700"
          )}
        />
      </SwitchPrimitive.Root>
    </div>
  );
};

SwiperFormSwitch.propTypes = {
  label: PropTypes.string,
  checked: PropTypes.bool,
  onCheckedChange: PropTypes.func,
  className: PropTypes.string,
  id: PropTypes.string,
};

export default SwiperFormSwitch; 