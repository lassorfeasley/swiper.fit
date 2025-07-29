import React from "react";
import PropTypes from "prop-types";
import { cn } from "@/lib/utils";

/**
 * A labeled switch component styled for use inside Swiper forms.
 *
 * Design specs:
 * - OFF: Container with justify-start, grey thumb (bg-neutral-700)
 * - ON: Container with justify-end, green thumb (bg-green-500)
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
        "w-full h-12 bg-white inline-flex justify-end items-center gap-2.5",
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
      <div
        id={switchId}
        className={cn(
          "w-14 h-8 p-1 bg-neutral-100 border border-neutral-300 inline-flex items-center gap-1 cursor-pointer",
          checked ? "justify-end" : "justify-start"
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        <div 
          className={cn(
            "w-6 self-stretch",
            checked ? "bg-green-500" : "bg-neutral-700"
          )} 
        />
      </div>
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