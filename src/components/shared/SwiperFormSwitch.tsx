import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import ActionPill from "./ActionPill";

interface SwiperFormSwitchProps {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
  id?: string;
  variant?: "switch" | "action-pill";
  Icon?: React.ComponentType<any>;
  actionPillColor?: "orange" | "neutral" | "red" | "green" | "blue";
  actionPillIconColor?: "neutral" | "red" | "green" | "blue" | "white" | "black";
  actionPillFill?: boolean;
  labelClassName?: string;
}

/**
 * A labeled switch component styled for use inside Swiper forms.
 *
 * Design specs:
 * - OFF: Container with justify-start, grey thumb (bg-neutral-700)
 * - ON: Container with justify-start, green thumb (bg-green-500) translated to the right
 */
const SwiperFormSwitch: React.FC<SwiperFormSwitchProps> = ({
  label,
  checked,
  onCheckedChange,
  className,
  id,
  variant = "switch", // "switch" or "action-pill"
  Icon,
  actionPillColor = "neutral",
  actionPillIconColor = "neutral",
  actionPillFill = true,
  labelClassName
}) => {
  const switchId = id || `swiper-form-switch-${label?.toLowerCase().replace(/\s+/g, "-") || "input"}`;
  const containerRef = useRef(null);
  const thumbRef = useRef(null);
  const [animationDistance, setAnimationDistance] = useState(0);
  const [internalChecked, setInternalChecked] = useState(checked);

  // Sync internal state with external checked prop
  useEffect(() => {
    setInternalChecked(checked);
  }, [checked]);

  useEffect(() => {
    if (containerRef.current && thumbRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const thumbWidth = thumbRef.current.offsetWidth;
      const padding = 8; // p-1 = 4px on each side
      const availableSpace = containerWidth - padding;
      const distance = availableSpace - thumbWidth;
      setAnimationDistance(Math.max(0, distance - 1)); // Subtract 1px to keep thumb within rail
    }
  }, []);

  const handleToggle = () => {
    const newState = !internalChecked;
    setInternalChecked(newState);
    onCheckedChange?.(newState);
  };

  return (
    <div
      className={cn(
        "w-full self-stretch h-14 p-3 flex justify-between items-center gap-2.5",
        className
      )}
    >
      {label && (
        <label
          htmlFor={switchId}
          className={cn(
            "flex-1 text-left text-neutral-neutral-700 text-lg font-medium font-['Be_Vietnam_Pro'] leading-tight select-none",
            labelClassName
          )}
        >
          {label}
        </label>
      )}
      {variant === "switch" ? (
        <div
          ref={containerRef}
          id={switchId}
          className={"w-14 h-8 p-1 bg-neutral-neutral-300 rounded-3xl flex justify-start items-center gap-1 cursor-pointer relative overflow-hidden"}
          onClick={handleToggle}
        >
          <motion.div 
            ref={thumbRef}
            className="w-6 self-stretch rounded-3xl"
            animate={{
              backgroundColor: internalChecked ? "#22c55e" : "#374151", // green-500 : neutral-700
              x: internalChecked ? animationDistance : 0
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut"
            }}
          />
        </div>
      ) : (
        <ActionPill
          onClick={handleToggle}
          Icon={Icon}
          showText={false}
          color={actionPillColor}
          iconColor={actionPillIconColor}
          fill={actionPillFill}
        />
      )}
    </div>
  );
};

export default SwiperFormSwitch; 